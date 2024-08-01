import { Ping, PingOptions, PingTarget, PingResult } from './ping.js';
import raw from 'raw-socket';

interface PingICMPOptions extends PingOptions {
  ttl: 128 | number;
  bytes: 32 | number;
}

interface PingICMPTarget extends PingTarget {}

interface PingICMPResult extends PingResult {
  ttl: number;
  bytes: number;
  hops?: any;
  reply?: any;
}

class PingICMP extends Ping {
  declare options: PingICMPOptions;
  declare target: PingICMPTarget;
  declare result: PingICMPResult;

  private id: string;
  private addressFamily: any;
  private protocol: any;

  constructor(options: PingICMPOptions) {
    super();

    this.options = {
      host: null,
      ttl: options.ttl ? options.ttl * 1 : 128,
      bytes: options.bytes ? options.bytes * 1 : 32,
    };

    this.target = {
      ip: null,
    };

    this.result = {
      type: 'ping/icmp',
      status: null,
      host: null,
      ip: null,
      ips: [],
      time: -1,
      ttl: this.options.ttl,
      bytes: this.options.bytes,
    };

    this.id = this.randomString(16);

    this.afterConstructor(options);
  }

  send() {
    this.ready()
      .then(() => {
        this.addressFamily = this.target.ip.is4()
          ? raw.AddressFamily.IPv4
          : raw.AddressFamily.IPv6;
        this.protocol = this.target.ip.is4()
          ? raw.Protocol.ICMP
          : raw.Protocol.ICMPv6;

        const timestamp = new Date().getTime();
        const socket = raw.createSocket({
          addressFamily: this.addressFamily,
          protocol: this.protocol,
        });
        const body = this.randomString(this.options.bytes - 24);
        const buffer = this.createBuffer(body || '');
        const timeout = setTimeout(() => {
          if (this.result.status === null) {
            this.result.time = new Date().getTime() - timestamp;
            this.result.status = 'timeout';
            socket.close();
          }
        }, this.options.timeout);

        socket.on('message', (data, source) => {
          const parsed = this.parseBuffer(Buffer.from(data), source);
          if (parsed == null) {
            return;
          }

          clearTimeout(timeout);

          this.result.reply = parsed;

          this.result.time = new Date().getTime() - timestamp;
          if (this.result.status === null) {
            if (parsed.type == 0) {
              this.result.status = 'reply';
            } else {
              this.result.status = 'exception';
            }
          }

          socket.close();
        });

        socket.on('close', () => {
          this.emit('result', this.result);
          return;
        });

        socket.on('error', (error) => {
          console.log(error);
          clearTimeout(timeout);

          this.result.error = error.code || error.message || error;
          this.result.status = 'error';

          socket.close();

          this.emit('error', error, this.result);
          return;
        });

        socket.send(
          buffer,
          0,
          buffer.length,
          this.target.ip.toString(),
          () => {
            socket.setOption(
              this.target.ip.is4()
                ? raw.SocketLevel.IPPROTO_IP
                : raw.SocketLevel.IPPROTO_IPV6,
              this.target.ip.is4()
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

              this.emit('error', error, this.result);
              return;
            }
          }
        );
      })
      .catch((error) => {
        this.result.status = 'error';
        this.result.error = error.code || error.message || error;
        this.emit('error', error, this.result);
      });
  }

  private parseBuffer(buf, src) {
    let offset = 0;
    if (this.result.ip.is4()) {
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

    const tc = this.parseTypeCode(type, code);

    return {
      source: src,
      type: tc.type,
      code: tc.code,
      typestr: tc.typestr,
      codestr: tc.codestr,
      body: body ? body.toString() : null,
    };
  }

  private parseTypeCode(type, code) {
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

  private createBuffer(data) {
    const type = Buffer.from([this.result.ip.is4() ? 0x08 : 0x80, 0x00]);
    const code = Buffer.from([0x00, 0x00]);
    const checksum = Buffer.from([0x00, 0x00, 0x00, 0x00]);
    const id = Buffer.from(this.id);
    const body = Buffer.from(data);
    const buffer = Buffer.concat([type, code, checksum, id, body]);
    return raw.writeChecksum(buffer, 2, raw.createChecksum(buffer));
  }

  private randomString(length, pool = '0123456789abcdef'.split('')) {
    let string = '';
    for (let i = 0; i < length; i++) {
      string += pool[Math.floor(Math.random() * pool.length)];
    }
    return string;
  }

  static sendAsync(
    options: PingICMPOptions,
    callback = (error, result: PingICMPResult) => {}
  ) {
    return new Promise<PingICMPResult>((resolve, reject) => {
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

  async traceroute(ttln = 1, ttlx = 64, timeoutx = 8) {
    this.result.type = 'ping/icmp/traceroute';
    this.result.hops = [];
    ttln = Math.max(1, Math.min(256, ttln));
    ttlx = Math.max(1, Math.min(256, this.options.ttl));
    timeoutx = Math.max(1, Math.min(256, timeoutx));

    try {
      await this.ready();
      this.emit('ready', this.result);
    } catch (error) {
      this.result.status = 'error';
      this.result.error = error.code || error.message || error;
      this.emit('error', error, this.result);
      return;
    }

    const timestamp = new Date().getTime();

    let timeoutstack = 0;
    let ping = 3;

    for (let ttl = ttln; ttl <= ttlx; ttl++) {
      const options = {
        host: this.result.ip,
        bytes: 32,
        ttl: ttl,
        dnsResolve: false,
        filterBogon: false,
      };

      const results = [];
      for (let j = 0; j < ping; j++) {
        results.push(await PingICMP.sendAsync(options));
      }

      const hop = {
        status: results[0]?.status,
        ip: results[0]?.reply?.source,
        ttl: ttl,
        rtt: {
          min: Infinity,
          max: -Infinity,
          avg: 0,
        },
      };

      let rttSum = 0;
      let rttCount = 0;
      for (const result of results) {
        hop.status = result.status;
        hop.rtt.min = Math.min(hop.rtt.min, result.time);
        hop.rtt.max = Math.max(hop.rtt.max, result.time);
        rttSum += result.time;
        rttCount++;
      }

      hop.rtt.avg = Math.ceil(rttSum / rttCount);

      if (hop.status == 'exception') {
        hop.status = results[0]?.reply.typestr.toLowerCase();
      }

      if (hop.status == 'timeout') {
        hop.ip = null;
        timeoutstack++;
      } else {
        timeoutstack = 0;
      }

      this.result.hops.push(hop);

      if (hop.ip == this.result.ip) {
        break;
      }
      if (timeoutstack >= timeoutx) {
        break;
      }
    }

    this.result.status = 'finish';

    this.result.time = new Date().getTime() - timestamp;
    this.emit('result', this.result);
    return;
  }

  static tracerouteAsync(
    options: PingICMPOptions,
    callback = (error, result: PingICMPResult) => {}
  ) {
    return new Promise<PingICMPResult>((resolve, reject) => {
      new PingICMP(options)
        .on('result', (result) => {
          resolve(result);
          callback(null, result);
        })
        .on('error', (error, result) => {
          reject(result);
          callback(error, result);
        })
        .traceroute();
    });
  }
}

export default PingICMP;
export { PingICMP, PingICMPOptions, PingICMPResult };
