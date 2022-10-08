import fs from 'fs';
import net from 'net';
import dgram from 'dgram';
import EventEmitter from 'events';
import raw from 'raw-socket';
import dns from '@wanyne/dns';
import IP from '@wanyne/ip';

import path from 'path';
import { fileURLToPath } from 'url';
const ___filename = fileURLToPath(import.meta.url);
const ___dirname = path.dirname(___filename);
const knownPorts = JSON.parse(
  fs.readFileSync(path.resolve(___dirname, '../data/known-ports.json'))
);

import pingf from './ping-func.mjs';

class Ping extends EventEmitter {
  constructor(options) {
    super();

    this.options = options;

    this.options.dnsResolve =
      this.options.dnsResolve != undefined ? this.options.dnsResolve : true;
    this.options.filterBogon =
      this.options.filterBogon != undefined ? this.options.filterBogon : false;
    this.options.timeout = this.options.timeout
      ? this.options.timeout * 1
      : 2000;

    this.options.host = this.options.host.toLowerCase();

    if (typeof this.options.ports == 'string') {
      if (
        /^(?:\d{1,5},|\d{1,5}-\d{1,5},)+\d{1,5}|\d{1,5}-\d{1,5}/.test(
          this.options.ports
        )
      ) {
        const ports = [];
        let parts = this.options.ports.split(',');
        for (let part of parts) {
          const m = /^(\d{1,5})-(\d{1,5})/.exec(part);
          if (m) {
            for (let i = Math.min(m[1], m[2]); i <= Math.max(m[1], m[2]); i++) {
              ports.push(i);
            }
          } else {
            ports.push(part * 1);
          }
        }
        this.options.ports = ports;
      } else if (this.options.ports == '*') {
        this.options.ports = [];
        for (let i = 1; i <= 65535; i++) {
          this.options.ports.push(i);
        }
      } else {
        this.options.ports = [this.options.ports * 1];
      }
    }

    const pr = JSON.parse(JSON.stringify(this.options.ports));
    this.options.ports = [];
    for (let p of pr) {
      p = p * 1;
      if (!Number.isNaN(p)) {
        this.options.ports.push(p);
      }
    }

    this.id = this.genid();

    this.result = {
      error: undefined,
      type: 'ping',
      status: undefined,
      host: this.options.host,
      ip: null,
      ips: [],
      time: -1,
    };
  }

  genid() {
    return randomString(16);
    function randomString(length, pool = '0123456789abcdef') {
      pool = pool.split('');
      let string = '';
      for (let i = 0; i < length; i++) {
        string += pool[Math.floor(Math.random() * pool.length)];
      }
      return string;
    }
  }

  async dnsResolve() {
    const ips = await dns.ips(this.options.host, this.options.dnsServer);
    if (!ips) {
      this.result.error = 'ENOTFOUND';
      this.result.status = 'error';
      throw new Error(this.result.error);
    }
    this.result.ips = ips;
    this.result.ip = ips[0];
  }

  filterBogon() {
    if (this.options.filterBogon && new IP(this.result.ip).isBogon()) {
      this.result.error = 'EBOGONIP';
      this.result.status = 'error';
      throw new Error(this.result.error);
    }
  }

  async ready() {
    try {
      if (this.options.dnsResolve) {
        await this.dnsResolve().catch((error) => {
          throw error;
        });
      } else {
        this.result.ip = this.options.host;
        this.result.ips = [this.result.ip];
      }
      if (this.options.filterBogon) {
        this.filterBogon();
      }
    } catch (error) {
      throw error;
    }
    this.result.status = 'ready';
    return;
  }

  emitResult() {
    this.emit('result', this.result);
  }

  emitError(error) {
    this.emit('error', error, this.result);
  }

  emitTask(task) {
    this.emit('task', task);
  }
}

class PingTCP extends Ping {
  async send(inner) {
    this.options.port = Math.max(
      1,
      Math.min(65535, this.options.port ? this.options.port * 1 : 80)
    );

    this.result.type = 'ping/tcp';
    this.result.port = this.options.port;
    this.result.name =
      knownPorts && knownPorts?.names?.tcp[this.result.port]
        ? knownPorts.names.tcp[this.result.port]
        : 'unknown';
    this.result.banner = '';

    try {
      await this.ready();
    } catch (error) {
      this.result.status = 'error';
      this.result.error = error.code || error.message || error;
      !inner ? this.emitError(error) : null;
      return;
    }

    this.emit('ready', this.result);

    const socket = new net.Socket();
    const timestamp = new Date().getTime();
    let connected = false;

    socket.setTimeout(this.options.timeout);

    socket.on('connect', () => {
      connected = true;
      this.result.ip = socket.remoteAddress;
      this.result.time = new Date().getTime() - timestamp;
    });
    socket.on('data', (data) => {
      this.result.banner += data.toString();
      this.result.banner = this.result.banner.replace(/\r|\n/g, '');
    });
    socket.on('close', (error) => {
      if (!error && this.result.status == 'ready') {
        this.result.status = 'open';
      }

      if (this.result.banner.match(/ssh/i)) {
        this.result.name = 'ssh';
      } else if (this.result.banner.match(/mysql|mariadb/i)) {
        this.result.name = 'mysql';
      }

      socket.destroy();

      !inner ? this.emitResult() : null;
      return;
    });
    socket.on('error', (error) => {
      this.result.time = new Date().getTime() - timestamp;
      if (error.code == 'ECONNREFUSED') {
        this.result.status = 'close';
        socket.destroy();
      } else if (error.code == 'ECONNRESET') {
        this.result.status = 'reset';
        socket.destroy();
      } else {
        this.result.status = 'error';
        this.result.error = error.code;

        socket.destroy();

        !inner ? this.emitError(error) : null;
        return;
      }
    });
    socket.on('timeout', () => {
      if (!connected && this.result.status == 'ready') {
        this.result.time = new Date().getTime() - timestamp;
        this.result.status = 'filtered';
      }

      socket.destroy();
    });

    socket.connect(this.result.port, this.result.ip);
  }

  async scan(inner) {
    if (this.options.ports == '@') {
      this.options.ports = knownPorts.ports.tcp;
    }

    this.options.ports = !this.options.ports
      ? [21, 22, 23, 25, 80, 194, 443, 3000, 3306, 5000, 8080, 25565]
      : this.options.ports;
    this.options.chunk = this.options.chunk ? this.options.chunk : 256;

    this.result.type = 'ping/tcp/scan';
    this.result.ports = this.options.ports;
    this.result.statuses = {
      open: [],
      reset: [],
      close: [],
      filtered: [],
      error: [],
    };
    this.result.names = {};
    this.result.banners = {};
    this.result.errors = {};

    try {
      await this.ready();
    } catch (error) {
      this.result.status = 'error';
      this.result.error = error.code || error.message || error;
      !inner ? this.emitError(error) : null;
      return;
    }

    const timestamp = new Date().getTime();
    const t = [[]];
    let ti = 0;
    const _this = this;
    const parse = (r) => {
      r.name ? (_this.result.names[r.port] = r.name) : null;
      r.banner ? (_this.result.banners[r.port] = r.banner) : null;
      _this.result.statuses[r.status].push(r.port);
      r.status == 'error' ? (_this.result.errors[r.port] = r.error) : null;
    };

    for (let i = 0; i < this.options.ports.length; i++) {
      if (t[ti].length == this.options.chunk) {
        const pr = await Promise.all(t[ti]);
        for (const p of pr) {
          parse(p);
        }
        ti++;
      }

      if (i % this.options.chunk == 0 && i > 0) {
        t.push([]);
      }

      const opts = JSON.parse(JSON.stringify(this.options));
      delete opts.ports;
      opts.host = this.result.ip;
      opts.port = this.options.ports[i];
      opts.dnsResolve = false;
      opts.filterBogon = false;
      t[ti].push(pingf.tcp(opts));
    }

    const pr = await Promise.all(t[ti]);
    for (const p of pr) {
      parse(p);
    }

    this.result.status = 'finish';

    this.result.time = new Date().getTime() - timestamp;
    this.emitResult();
    return;
  }
}

class PingUDP extends Ping {
  async send(inner) {
    this.options.port = Math.max(
      1,
      Math.min(65535, this.options.port ? this.options.port * 1 : 68)
    );
    this.options.bytes = Math.max(
      1,
      Math.min(65535, this.options.bytes ? this.options.bytes * 1 : 32)
    );

    this.result.type = 'ping/udp';
    this.result.port = this.options.port;
    this.result.name =
      knownPorts && knownPorts?.names?.udp[this.result.port]
        ? knownPorts.names.udp[this.result.port]
        : 'unknown';

    try {
      await this.ready();
    } catch (error) {
      this.result.status = 'error';
      this.result.error = error.code || error.message || error;
      !inner ? this.emitError(error) : null;
      return;
    }

    this.emit('ready', this.result);

    const socket = new dgram.createSocket(
      new IP(this.result.ip).is4 ? 'udp4' : 'udp6'
    );
    const timestamp = new Date().getTime();
    const buffer = this.options.body
      ? Buffer.from(this.options.body)
      : Buffer.alloc(this.options.bytes);
    let sto;

    socket.on('close', (error) => {
      !inner ? this.emitResult() : null;
      return;
    });
    socket.on('error', (error) => {
      sto ? clearTimeout(sto) : null;

      this.result.time = new Date().getTime() - timestamp;
      if (error.code == 'ECONNREFUSED') {
        this.result.status = 'close';
        socket.close();
      } else if (error.code == 'ECONNRESET') {
        this.result.status = 'reset';
        socket.close();
      } else {
        this.result.status = 'error';
        this.result.error = error.code;

        socket.close();

        !inner ? this.emitError(error) : null;
        return;
      }
    });

    socket.connect(this.result.port, this.result.ip, () => {
      socket.send(buffer, (error, bytes) => {
        if (error) {
          this.result.error = error;
          result(error);
        }

        this.result.status = 'open';
        this.result.ip = socket.remoteAddress().address;
        this.result.time = new Date().getTime() - timestamp;
        sto = setTimeout(() => {
          socket.close();
        }, this.options.timeout);
      });
    });
  }

  async scan(inner) {
    if (this.options.ports == '@') {
      this.options.ports = knownPorts.ports.udp;
    }

    this.options.ports = !this.options.ports
      ? [67, 68, 69, 123, 161, 162, 445, 514, 19132]
      : this.options.ports;
    this.options.chunk = this.options.chunk ? this.options.chunk : 256;

    this.result.type = 'ping/udp/scan';
    this.result.ports = this.options.ports;
    this.result.statuses = {
      open: [],
      reset: [],
      close: [],
      filtered: [],
      error: [],
    };
    this.result.names = {};
    this.result.banners = {};
    this.result.errors = {};

    try {
      await this.ready();
    } catch (error) {
      this.result.status = 'error';
      this.result.error = error.code || error.message || error;
      !inner ? this.emitError(error) : null;
      return;
    }

    const timestamp = new Date().getTime();
    const t = [[]];
    let ti = 0;
    const _this = this;
    const parse = (r) => {
      r.name ? (_this.result.names[r.port] = r.name) : null;
      r.banner ? (_this.result.banners[r.port] = r.banner) : null;
      _this.result.statuses[r.status].push(r.port);
      r.status == 'error' ? (_this.result.errors[r.port] = r.error) : null;
    };

    for (let i = 0; i < this.options.ports.length; i++) {
      if (t[ti].length == this.options.chunk) {
        const pr = await Promise.all(t[ti]);
        for (const p of pr) {
          parse(p);
        }
        ti++;
      }

      if (i % this.options.chunk == 0 && i > 0) {
        t.push([]);
      }

      const opts = JSON.parse(JSON.stringify(this.options));
      delete opts.ports;
      opts.host = this.result.ip;
      opts.port = this.options.ports[i];
      opts.dnsResolve = false;
      opts.filterBogon = false;
      const task = pingf.udp(opts);
      t[ti].push(task);
    }

    const pr = await Promise.all(t[ti]);
    for (const p of pr) {
      parse(p);
    }

    this.result.status = 'finish';

    this.result.time = new Date().getTime() - timestamp;
    this.emitResult();
    return;
  }
}

class PingICMP extends Ping {
  async send(inner) {
    this.options.ttl = Math.max(
      1,
      Math.min(256, this.options.ttl ? this.options.ttl * 1 : 128)
    );
    this.options.bytes = Math.max(
      24,
      Math.min(65535, this.options.bytes ? this.options.bytes * 1 : 32)
    );

    this.result.type = 'ping/icmp';
    this.result.ttl = this.options.ttl;
    this.result.bytes = -1;

    try {
      await this.ready();
    } catch (error) {
      this.result.status = 'error';
      this.result.error = error.code || error.message || error;
      !inner ? this.emitError(error) : null;
      return;
    }

    this.emit('ready', this.result);

    this.addressFamily = new IP(this.result.ip).is4
      ? raw.AddressFamily.IPv4
      : raw.AddressFamily.IPv6;
    this.protocol = new IP(this.result.ip).is4
      ? raw.Protocol.ICMP
      : raw.Protocol.ICMPv6;

    const socket = raw.createSocket({
      addressFamily: this.addressFamily,
      protocol: this.protocol,
    });
    const timestamp = new Date().getTime();
    const body = this.#randomString(this.options.bytes - 24);
    const buffer = this.#createBuffer('abcdefgh' || '');
    const sto = setTimeout(() => {
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

      clearTimeout(sto);

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
      !inner ? this.emitResult() : null;
      return;
    });
    socket.on('error', (err) => {
      console.log(err);
      clearTimeout(sto);

      this.result.error = err.code || err.message || err;
      this.result.status = 'error';

      socket.close();

      !inner ? this.emitError(err) : null;
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
          clearTimeout(sto);

          this.result.error = error.code || error.message || error;
          this.result.status = 'error';

          socket.close();

          !inner ? this.emitError(error) : null;
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

  async traceroute(inner) {
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
    } catch (error) {
      this.result.status = 'error';
      this.result.error = error.code || error.message || error;
      !inner ? this.emitError(error) : null;
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
      const result = await pingf.icmp(opts);

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
}

export { PingTCP, PingUDP, PingICMP };
