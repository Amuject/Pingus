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
        await this.dnsResolve();
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

    if (!inner) {
      try {
        await this.ready();
      } catch (error) {
        this.result.status = 'error';
        this.result.error = error.code || error.message || error;
        !inner ? this.emitError(error) : null;
        throw this.result;
      }
    } else {
      this.result.ip = this.options.host;
      this.result.ips = [this.result.ip];
      this.result.status = 'ready';
    }

    this.emit('ready', this.result);

    return new Promise((resolve, reject) => {
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
        resolve(this.result);
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
          reject(this.result);
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
    });
  }

  async scan(inner) {
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

    if (!inner) {
      try {
        await this.ready();
      } catch (error) {
        this.result.status = 'error';
        this.result.error = error.code || error.message || error;
        !inner ? this.emitError(error) : null;
        throw this.result;
      }
    } else {
      this.result.status = 'ready';
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
      opts.host = this.result.ip;
      opts.port = this.options.ports[i];
      const task = new PingTCP(opts);
      t[ti].push(task.send(true));
    }

    const pr = await Promise.all(t[ti]);
    for (const p of pr) {
      parse(p);
    }

    this.result.status = 'finish';

    this.result.time = new Date().getTime() - timestamp;
    this.emitResult();
    return this.result;
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

    if (!inner) {
      try {
        await this.ready();
      } catch (error) {
        this.result.status = 'error';
        this.result.error = error.code || error.message || error;
        !inner ? this.emitError(error) : null;
        throw this.result;
      }
    } else {
      this.result.ip = this.options.host;
      this.result.ips = [this.result.ip];
      this.result.status = 'ready';
    }

    this.emit('ready', this.result);

    return new Promise((resolve, reject) => {
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
        resolve(this.result);
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
          reject(this.result);
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
    });
  }

  async scan(inner) {
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

    if (!inner) {
      try {
        await this.ready();
      } catch (error) {
        this.result.status = 'error';
        this.result.error = error.code || error.message || error;
        !inner ? this.emitError(error) : null;
        throw this.result;
      }
    } else {
      this.result.status = 'ready';
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
      opts.host = this.result.ip;
      opts.port = this.options.ports[i];
      const task = new PingUDP(opts);
      t[ti].push(task.send(true));
    }

    const pr = await Promise.all(t[ti]);
    for (const p of pr) {
      parse(p);
    }

    this.result.status = 'finish';

    this.result.time = new Date().getTime() - timestamp;
    this.emitResult();
    return this.result;
  }
}

class PingICMP extends Ping {
  async send(inner) {
    this.options.ttl = Math.max(
      1,
      Math.min(65535, this.options.ttl ? this.options.ttl * 1 : 128)
    );
    this.options.bytes = Math.max(
      1,
      Math.min(65535, this.options.bytes ? this.options.bytes * 1 : 32)
    );

    this.result.type = 'ping/icmp';
    this.result.ttl = this.options.ttl;
    this.result.bytes = -1;

    if (!inner) {
      try {
        await this.ready();
      } catch (error) {
        this.result.status = 'error';
        this.result.error = error.code || error.message || error;
        !inner ? this.emitError(error) : null;
        throw this.result;
      }
    } else {
      this.result.ip = this.options.host;
      this.result.ips = [this.result.ip];
      this.result.status = 'ready';
    }

    this.emit('ready', this.result);

    return new Promise((resolve, reject) => {
      const socket = raw.createSocket(
        new IP(this.result.ip).is4
          ? {
              addressFamily: raw.AddressFamily.IPv4,
              protocol: raw.Protocol.ICMP,
            }
          : {
              addressFamily: raw.AddressFamily.IPv6,
              protocol: raw.Protocol.ICMPv6,
            }
      );
      const timestamp = new Date().getTime();
      const buffer = this.createBuffer(this.options.body || '');
      const sto = setTimeout(() => {
        if (this.result.status == 'ready') {
          this.result.time = new Date().getTime() - timestamp;
          this.result.status = 'timeout';
          socket.close();
        }
      }, this.options.timeout);

      socket.on('message', (data, source) => {
        clearTimeout(sto);

        const buf = Buffer.from(data);
        let off = 20;
        if (!new IP(this.result.ip).is4) {
          off = 0;
        }
        const type = buf[off];
        const code = buf[off + 1];

        this.result.reply = this.parseReply(source, type, code);

        this.result.time = new Date().getTime() - timestamp;
        if (this.result.status == 'ready') {
          if (type == 0) {
            this.result.status = 'reply';
          } else {
            this.result.status = 'exception';
          }
        }

        socket.close();
      });
      socket.on('close', () => {
        !inner ? this.emitResult() : null;
        resolve(this.result);
        return;
      });
      socket.on('error', (err) => {
        clearTimeout(sto);

        this.result.error = err.code || err.message || err;
        this.result.status = 'error';

        socket.close();

        !inner ? this.emitError(error) : null;
        reject(this.result);
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
            raw.SocketOption.IP_TTL,
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
            reject(this.result);
            return;
          }
        }
      );
    });
  }

  parseReply(source, type, code) {
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
      source: source,
      type: type,
      code: code,
      typestr: typeString,
      codestr: codeString,
    };
  }

  createBuffer(data) {
    const type = Buffer.from([0x08, 0x00]);
    const code = Buffer.from([0x00, 0x00]);
    const checksum = Buffer.from([0x00, 0x00, 0x00, 0x00]);
    const body = Buffer.from(data);
    const buffer = Buffer.concat([type, code, checksum, body]);
    return raw.writeChecksum(buffer, 2, raw.createChecksum(buffer));
  }

  async traceroute() {}
}

export { PingTCP, PingUDP, PingICMP };
