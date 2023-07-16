import { Ping, PingOptions, PingTarget, PingResult } from './ping.js';
import IP from '@wnynya/ip';
import dgram from 'node:dgram';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const ___dirname = path.dirname(fileURLToPath(import.meta.url));

const ports_name_udp = JSON.parse(
  fs
    .readFileSync(path.resolve(___dirname, '../data/ports-name-udp.json'))
    .toString()
);
const freq_ports_udp = JSON.parse(
  fs
    .readFileSync(path.resolve(___dirname, '../data/freq-ports-udp.json'))
    .toString()
);

interface PingUDPOptions extends PingOptions {
  port: 22 | 80 | number;
  buffer?: Buffer;
  broadcast?: boolean;

  ports?: number | number[] | string;
  chunk?: number;
}

interface PingUDPTarget extends PingTarget {
  port: number;

  ports?: number[];
}

interface PingUDPResult extends PingResult {
  port: number;
  name: string;

  ports?: any;
  statuses?: any;
  names?: any;
  errors?: any;
}

class PingUDP extends Ping {
  declare options: PingUDPOptions;
  declare target: PingUDPTarget;
  declare result: PingUDPResult;

  constructor(
    options: PingUDPOptions = {
      host: null,
      port: null,
    }
  ) {
    super();

    this.options = options;

    this.target = {
      ip: null,
      port: options.port ? options.port * 1 : 55,
    };

    this.result = {
      type: 'ping/udp',
      status: null,
      host: null,
      ip: null,
      ips: [],
      time: -1,
      port: this.target.port,
      name: this.portName(this.target.port),
    };

    this.after(options);

    this.parsePorts(options);
  }

  send() {
    this.ready()
      .then(() => {
        const timestamp = new Date().getTime();
        const socket = dgram.createSocket(
          this.target.ip.is4() ? 'udp4' : 'udp6'
        );
        const buffer = this.options.buffer
          ? this.options.buffer
          : Buffer.alloc(8);

        let timeout;

        socket.on('close', (error) => {
          this.emit('result', this.result);
          clearTimeout(timeout);
          return;
        });

        socket.on('error', (error: any) => {
          timeout ? clearTimeout(timeout) : null;
          this.result.time = new Date().getTime() - timestamp;
          socket.close();

          if (error.code == 'ECONNREFUSED') {
            this.result.status = 'close';
          } else if (error.code == 'ECONNRESET') {
            this.result.status = 'reset';
          } else {
            this.result.status = 'error';
            this.result.error = error.code;
            this.emit('error', error, this.result);
            return;
          }
        });

        socket.on('listening', () => {
          if (this.options.broadcast) {
            socket.setBroadcast(true);
          }
        });

        const onConnect = (error, bytes) => {
          if (error) {
            this.result.status = 'error';
            this.result.error = error;
            this.emit('error', error, this.result);
            return;
          }

          this.result.status = 'open';
          try {
            this.result.ip = new IP(socket.remoteAddress().address);
          } catch (error) {}
          this.result.time = new Date().getTime() - timestamp;
          timeout = setTimeout(() => {
            socket.close();
          }, this.options.timeout);
        };

        if (this.options.broadcast) {
          socket.send(
            buffer,
            0,
            buffer.length,
            this.target.port,
            this.target.ip.toString(),
            onConnect
          );
        } else {
          socket.connect(this.target.port, this.target.ip.toString(), () => {
            socket.send(buffer, onConnect);
          });
        }
      })
      .catch((error) => {
        this.result.status = 'error';
        this.result.error = error.code || error.message || error;
        this.emit('error', error, this.result);
      });
  }

  private portName(port: number) {
    return ports_name_udp.hasOwnProperty(port)
      ? ports_name_udp[port]
      : 'unknown';
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
        ports = freq_ports_udp;
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
    options: PingUDPOptions,
    callback = (error, result: PingUDPResult) => {}
  ) {
    return new Promise<PingUDPResult>((resolve, reject) => {
      new PingUDP(options)
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
      ? [67, 68, 69, 123, 161, 162, 445, 514, 19132]
      : this.target.ports;
    this.options.chunk = this.options.chunk ? this.options.chunk : 256;

    this.result.type = 'ping/udp/scan';
    this.result.ports = this.target.ports;
    this.result.statuses = {
      open: [],
      reset: [],
      close: [],
      filtered: [],
      error: [],
    };
    this.result.names = {};
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
      tasks[ti].push(PingUDP.sendAsync(opts));
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
    options: PingUDPOptions,
    callback = (error, result: PingUDPResult) => {}
  ) {
    return new Promise<PingUDPResult>((resolve, reject) => {
      new PingUDP(options)
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

  static wol(
    mac = '00-00-00-00-00-00',
    options: PingUDPOptions = { host: '255.255.255.255', port: 9 },
    callback = (error, result: PingUDPResult) => {}
  ) {
    return new Promise<PingUDPResult>((resolve, reject) => {
      const header = Buffer.from([0xff, 0xff, 0xff, 0xff, 0xff, 0xff]);
      mac = mac.toLowerCase();
      mac = mac.replace(/[^0-9a-f]/g, '');
      let macAddress = Buffer.alloc(6);
      for (let i = 0; i < 6; i++) {
        macAddress[i] = parseInt(mac.substring(i * 2, i * 2 + 2), 16);
      }
      let magic = header;
      for (let i = 0; i < 16; i++) {
        magic = Buffer.concat([magic, macAddress]);
      }
      options.buffer = magic;
      options.broadcast = true;
      options.host = options.host ? options.host : '255.255.255.255';
      options.port = options.port ? options.port : 9;
      new PingUDP(options)
        .on('result', (result) => {
          resolve(result);
          callback(null, result);
        })
        .on('error', (error, result) => {
          reject(result);
          callback(error, result);
        })
        .send();
    });
  }
}

export default PingUDP;
export { PingUDP, PingUDPOptions, PingUDPResult };
