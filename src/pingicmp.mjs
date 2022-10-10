import raw from 'raw-socket';
import IP from '@wanyne/ip';
import Ping from './ping.mjs';

class PingICMP extends Ping {
  async send() {
    this.options.ttl = this.options.ttl ? this.options.ttl * 1 : 128;
    this.options.ttl = Math.max(1, Math.min(256, this.options.ttl));
    this.options.bytes = this.options.bytes ? this.options.bytes * 1 : 32;
    this.options.bytes = Math.max(24, Math.min(65535, this.options.bytes));

    this.result.type = 'ping/icmp';
    this.result.ttl = this.options.ttl;
    this.result.bytes = -1;

    try {
      await this.ready();
      this.emit('ready', this.result);
    } catch (error) {
      this.result.status = 'error';
      this.result.error = error.code || error.message || error;
      this.emitError(error);
      return;
    }

    this.addressFamily = new IP(this.result.ip).is4
      ? raw.AddressFamily.IPv4
      : raw.AddressFamily.IPv6;
    this.protocol = new IP(this.result.ip).is4
      ? raw.Protocol.ICMP
      : raw.Protocol.ICMPv6;

    const timestamp = new Date().getTime();
    const socket = raw.createSocket({
      addressFamily: this.addressFamily,
      protocol: this.protocol,
    });
    const body = this.#randomString(this.options.bytes - 24);
    const buffer = this.#createBuffer(body || '');
    const timeout = setTimeout(() => {
      if (this.result.status == 'ready') {
        this.result.time = new Date().getTime() - timestamp;
        this.result.status = 'timeout';
        socket.close();
      }
    }, this.options.timeout);

    socket.on('message', (data, source) => {
      const parsed = this.#parseBuffer(Buffer.from(data), source);
      if (parsed == null) {
        return;
      }

      clearTimeout(timeout);

      this.result.reply = parsed;

      this.result.time = new Date().getTime() - timestamp;
      if (this.result.status == 'ready') {
        if (parsed.type == 0) {
          this.result.status = 'reply';
        } else {
          this.result.status = 'exception';
        }
      }

      socket.close();
    });

    socket.on('close', () => {
      this.emitResult();
      return;
    });

    socket.on('error', (error) => {
      console.log(error);
      clearTimeout(timeout);

      this.result.error = error.code || error.message || error;
      this.result.status = 'error';

      socket.close();

      this.emitError(error);
      return;
    });

    socket.send(
      buffer,
      0,
      buffer.length,
      this.result.ip,
      () => {
        socket.setOption(
          new IP(this.result.ip).is4
            ? raw.SocketLevel.IPPROTO_IP
            : raw.SocketLevel.IPPROTO_IPV6,
          new IP(this.result.ip).is4
            ? raw.SocketOption.IP_TTL
            : raw.SocketOption.IPV6_TTL,
          this.options.ttl
        );
      },
      (error, bytes) => {
        this.result.bytes = bytes;
        if (error) {
          clearTimeout(timeout);

          this.result.error = error.code || error.message || error;
          this.result.status = 'error';

          socket.close();

          this.emitError(error);
          return;
        }
      }
    );
  }

  #parseBuffer(buf, src) {
    let offset = 0;
    if (new IP(this.result.ip).is4) {
      offset = (buf[0] & 0x0f) * 4;
    }
    let buffer = buf.subarray(offset);

    const type = buffer.subarray(0, 1)[0];
    const code = buffer.subarray(1, 2)[0];
    const checksum = buffer.subarray(2, 8);
    const id = buffer.subarray(8, 24).toString('ascii');
    const body = buffer.subarray(24).toString('ascii');

    if (type == 0 && id != this.id) {
      return null;
    }

    const tc = this.#parseTypeCode(type, code);

    return {
      source: src,
      type: tc.type,
      code: tc.code,
      typestr: tc.typestr,
      codestr: tc.codestr,
      body: type == 0 ? body.toString() : null,
    };
  }

  #parseTypeCode(type, code) {
    const types = [
      'ECHO_REPLY',
      'UNASSIGNED_1',
      'UNASSIGNED_2',
      'DESTINATION_UNREACHABLE',
      'SOURCE_QUENCH',
      'REDIRECT',
      'ALTERNATE_HOST_ADDRESS',
      'UNASSIGNED_7',
      'ECHO',
      'ROUTER_ADVERTISEMENT',
      'ROUTER_SECTION',
      'TIME_EXCEEDED',
      'PARAMETER_PROBLEM',
      'TIMESTAMP',
      'TIMESTAMP_REPLY',
      'INFORMATION_REQUEST',
      'INFORMATION_REPLY',
    ];
    const type_3_codes = [
      'NET_UNREACHABLE',
      'HOST_UNREACHABLE',
      'PROTOCOL_UNREACHABLE',
      'PORT_UNREACHABLE',
      'FRAGMENTATION_NEEDED',
      'SOURCE_ROUTE_FAILED',
      'NET_UNKNOWN',
      'HOST_UNKNOWN',
      'HOST_ISOLATED',
      'NET_PROHIBITED',
      'HOST_PROHIBITED',
      'NET_SERVICE_UNREACHABLE',
      'HOST_SERVICE_UNREACHABLE',
      'COMM_PROHIBITED',
      'HOST_PRECEDENCE_VIOLATION',
      'PRECEDENCE_CUTOFF',
    ];
    const type_5_codes = [
      'NETWORK',
      'HOST',
      'SERVICE_AND_NETWORK',
      'HOST_AND_NETWORK',
    ];

    let typeString = types[type] || 'UNKNOWN_TYPE';
    let codeString = 'NO_CODE';

    if (type == 3) {
      codeString = type_3_codes[code] || 'UNKNOWN_CODE';
    } else if (type == 5) {
      codeString = type_5_codes[code] || 'UNKNOWN_CODE';
    }
    return {
      type: type,
      code: code,
      typestr: typeString,
      codestr: codeString,
    };
  }

  #createBuffer(data) {
    const type = Buffer.from([new IP(this.result.ip).is4 ? 0x08 : 0x80, 0x00]);
    const code = Buffer.from([0x00, 0x00]);
    const checksum = Buffer.from([0x00, 0x00, 0x00, 0x00]);
    const id = Buffer.from(this.id);
    const body = Buffer.from(data);
    const buffer = Buffer.concat([type, code, checksum, id, body]);
    return raw.writeChecksum(buffer, 2, raw.createChecksum(buffer));
  }

  #randomString(length, pool = '0123456789abcdef') {
    pool = pool.split('');
    let string = '';
    for (let i = 0; i < length; i++) {
      string += pool[Math.floor(Math.random() * pool.length)];
    }
    return string;
  }

  static sendAsync(options, callback = () => {}) {
    return new Promise((resolve, reject) => {
      new PingICMP(options)
        .on('result', (result) => {
          resolve(result);
          callback(null, result);
        })
        .on('error', (error, result) => {
          resolve(result);
          callback(error, result);
        })
        .send();
    });
  }

  async traceroute() {
    this.result.type = 'ping/icmp/traceroute';
    this.result.hops = [];
    this.options.ttln = Math.max(
      1,
      Math.min(256, this.options.ttln ? this.options.ttln * 1 : 1)
    );
    this.options.ttlx = Math.max(
      1,
      Math.min(256, this.options.ttlx ? this.options.ttlx * 1 : 64)
    );
    this.options.timeoutx = Math.max(
      1,
      Math.min(256, this.options.timeoutx ? this.options.timeoutx * 1 : 8)
    );

    try {
      await this.ready();
      this.emit('ready', this.result);
    } catch (error) {
      this.result.status = 'error';
      this.result.error = error.code || error.message || error;
      this.emitError(error);
      return;
    }

    const timestamp = new Date().getTime();

    let timeoutstack = 0;
    for (let i = this.options.ttln; i <= this.options.ttlx; i++) {
      const opts = JSON.parse(JSON.stringify(this.options));
      opts.host = this.result.ip;
      opts.ttl = i;
      opts.dnsResolve = false;
      opts.filterBogon = false;
      const result = await PingICMP.sendAsync(opts);

      const hop = {
        status: result.status,
        ip: result?.reply?.source,
        ttl: i,
      };

      if (result.status == 'exception') {
        hop.status = result.reply.typestr.toLowerCase();
      }

      if (result.status == 'timeout') {
        hop.ip = null;
        timeoutstack++;
      } else {
        timeoutstack = 0;
      }

      this.result.hops.push(hop);

      if (result?.reply?.source == this.result.ip) {
        break;
      }
      if (timeoutstack >= this.options.timeoutx) {
        break;
      }
    }

    this.result.status = 'finish';

    this.result.time = new Date().getTime() - timestamp;
    this.emitResult();
    return;
  }

  static tracerouteAsync(options, callback = () => {}) {
    return new Promise((resolve, reject) => {
      new PingICMP(options)
        .on('result', (result) => {
          resolve(result);
          callback(null, result);
        })
        .on('error', (error, result) => {
          resolve(result);
          callback(error, result);
        })
        .traceroute();
    });
  }
}

export default PingICMP;
