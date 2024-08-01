import { Ping, PingOptions, PingTarget, PingResult } from './ping.js';
import IP from '@wnynya/ip';
import net from 'node:net';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const ___dirname = path.dirname(fileURLToPath(import.meta.url));

const ports_name_tcp = JSON.parse(
  fs
    .readFileSync(path.resolve(___dirname, '../data/ports-name-tcp.json'))
    .toString()
);
const freq_ports_tcp = JSON.parse(
  fs
    .readFileSync(path.resolve(___dirname, '../data/freq-ports-tcp.json'))
    .toString()
);

interface PingTCPOptions extends PingOptions {
  port: 22 | 80 | number;

  ports?: number | number[] | string;
  chunk?: number;
}

interface PingTCPTarget extends PingTarget {
  port: number;

  ports?: number[];
}

interface PingTCPResult extends PingResult {
  port: number;
  name: string;
  banner: string;

  ports?: any;
  statuses?: any;
  names?: any;
  banners?: any;
  errors?: any;
}

class PingTCP extends Ping {
  declare options: PingTCPOptions;
  declare target: PingTCPTarget;
  declare result: PingTCPResult;

  constructor(
    options: PingTCPOptions = {
      host: null,
      port: null,
    }
  ) {
    super();

    this.options = options;

    this.target = {
      ip: null,
      port: options.port ? options.port * 1 : 80,
    };

    this.result = {
      type: 'ping/tcp',
      status: null,
      host: null,
      ip: null,
      ips: [],
      time: -1,
      port: this.target.port,
      name: this.portName(this.target.port),
      banner: '',
    };

    this.parsePorts(options);

    this.afterConstructor(options);
  }

  send() {
    this.ready()
      .then(() => {
        const timestamp = new Date().getTime();
        const socket = new net.Socket();
        let connected = false;

        socket.setTimeout(this.options.timeout);

        socket.on('connect', () => {
          connected = true;
          this.result.ip = new IP(socket.remoteAddress);
          this.result.time = new Date().getTime() - timestamp;
        });

        socket.on('data', (data) => {
          this.result.banner += data.toString();
          this.result.banner = this.result.banner.replace(/\r|\n/g, '');
        });

        socket.on('close', (error) => {
          if (this.result.status === null && !error) {
            this.result.status = 'open';
          }

          this.result.name = this.bannerName(
            this.result.banner,
            this.result.name
          );

          socket.destroy();

          this.emit('result', this.result);
          return;
        });

        socket.on('timeout', () => {
          if (this.result.status === null && !connected) {
            this.result.time = new Date().getTime() - timestamp;
            this.result.status = 'filtered';
          }

          socket.destroy();
        });

        socket.on('error', (error: any) => {
          this.result.time = new Date().getTime() - timestamp;
          socket.destroy();

          if (error.code === 'ECONNREFUSED') {
            this.result.status = 'close';
          } else if (error.code === 'ECONNRESET') {
            this.result.status = 'reset';
          } else {
            this.result.status = 'error';
            this.result.error = error.code;
            this.emit('error', error, this.result);
            return;
          }
        });

        socket.connect(this.target.port, this.target.ip.toString());
      })
      .catch((error) => {
        this.result.status = 'error';
        this.result.error = error.code || error.message || error;
        this.emit('error', error, this.result);
      });
  }

  private portName(port: number) {
    return ports_name_tcp.hasOwnProperty(port)
      ? ports_name_tcp[port]
      : 'unknown';
  }

  private bannerName(banner, name) {
    if (banner.match(/ssh/i)) {
      return 'ssh';
    } else if (banner.match(/ftp/i)) {
      return 'ftp';
    } else if (banner.match(/mysql|mariadb/i)) {
      return 'mysql';
    } else if (banner.match(/kttv/i)) {
      return 'kt-telecop';
    } else {
      return name;
    }
  }

  private parsePorts(options) {
    if (!options.ports) {
      return;
    }

    let ports: number[] = [];
    // 포트 범위가 문자열인 경우
    if (typeof options.ports === 'string') {
      // 포트 범위: 커스텀
      if (
        /^(?:\d{1,5},|\d{1,5}-\d{1,5},)+\d{1,5}|\d{1,5}-\d{1,5}/.test(
          options.ports
        )
      ) {
        for (let part of options.ports.split(',')) {
          const m = /^(\d{1,5})-(\d{1,5})/.exec(part);
          if (m) {
            for (
              let i = Math.min(parseInt(m[1]), parseInt(m[2]));
              i <= Math.max(parseInt(m[1]), parseInt(m[2]));
              i++
            ) {
              ports.push(i);
            }
          } else {
            ports.push(parseInt(part));
          }
        }
      }
      // 포트 범위: 전부
      else if (options.ports === '*') {
        for (let i = 1; i <= 65535; i++) {
          ports.push(i);
        }
      }
      // 포트 범위: 자주 사용되는 1024개
      else if (options.ports === '@') {
        ports = freq_ports_tcp;
      }
      // 포트 범위: 문자열로 적힌 숫자 하나
      else {
        ports = [Math.floor(parseInt(options.ports))];
      }
    }
    // 포트 범위가 숫자인 경우
    else if (typeof options.ports === 'number') {
      ports = [Math.floor(options.ports)];
    }
    // 포트 범위가 배열인 경우
    else if (ports instanceof Array) {
      ports = options.ports;
    }

    // 정상 포트만 필터링
    const parsedPorts = [];
    for (let p of ports) {
      p = p * 1;
      if (!Number.isNaN(p) && 0 < p && p < 65536) {
        parsedPorts.push(p);
      }
      if (65536 < ports.length) {
        break;
      }
    }

    this.target.ports = parsedPorts;
    this.result.ports = parsedPorts;
  }

  static sendAsync(
    options: PingTCPOptions,
    callback = (error, result: PingTCPResult) => {}
  ) {
    return new Promise<PingTCPResult>((resolve, reject) => {
      new PingTCP(options)
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

  async scan() {
    this.target.ports = !this.target.ports
      ? [21, 22, 23, 25, 80, 194, 443, 3000, 3306, 5000, 8080, 25565]
      : this.target.ports;
    this.options.chunk = this.options.chunk ? this.options.chunk : 256;

    this.result.type = 'ping/tcp/scan';
    this.result.ports = this.target.ports;
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
      this.emit('ready', this.result);
    } catch (error) {
      this.result.status = 'error';
      this.result.error = error.code || error.message || error;
      this.emit('error', error, this.result);
      return;
    }

    const timestamp = new Date().getTime();
    const tasks = [[]];
    let ti = 0;
    const _this = this;
    const parse = (r) => {
      r = r.value;
      r.name ? (_this.result.names[r.port] = r.name) : null;
      r.banner ? (_this.result.banners[r.port] = r.banner) : null;
      _this.result.statuses[r.status].push(r.port);
      r.status == 'error' ? (_this.result.errors[r.port] = r.error) : null;
    };

    for (let i = 0; i < this.target.ports.length; i++) {
      if (tasks[ti].length == this.options.chunk) {
        const pr = await Promise.allSettled(tasks[ti]);
        for (const p of pr) {
          parse(p);
        }
        ti++;
      }

      if (i % this.options.chunk == 0 && i > 0) {
        tasks.push([]);
      }

      const opts = JSON.parse(JSON.stringify(this.options));
      delete opts.ports;
      opts.host = this.target.ip.toString();
      opts.port = this.target.ports[i];
      opts.dnsResolve = false;
      opts.filterBogon = false;
      tasks[ti].push(PingTCP.sendAsync(opts));
    }

    const pr = await Promise.allSettled(tasks[ti]);
    for (const p of pr) {
      parse(p);
    }

    this.result.status = 'finish';

    this.result.time = new Date().getTime() - timestamp;
    this.emit('result', this.result);
    return;
  }

  static scanAsync(
    options: PingTCPOptions,
    callback = (error, result: PingTCPResult) => {}
  ) {
    return new Promise<PingTCPResult>((resolve, reject) => {
      new PingTCP(options)
        .on('result', (result) => {
          resolve(result);
          callback(null, result);
        })
        .on('error', (error, result) => {
          reject(result);
          callback(error, result);
        })
        .scan();
    });
  }
}

export default PingTCP;
export { PingTCP, PingTCPOptions, PingTCPResult };
