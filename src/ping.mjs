import EventEmitter from 'events';
import dns from '@wnynya/dns';
import IP from '@wnynya/ip';

import fs from 'fs';
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
    this.options.host = this.options.host.toLowerCase();
    this.options.dnsResolve =
      this.options.dnsResolve != undefined ? this.options.dnsResolve : true;
    this.options.filterBogon =
      this.options.filterBogon != undefined ? this.options.filterBogon : false;
    this.options.timeout = this.options.timeout
      ? this.options.timeout * 1
      : 2000;

    this.id = this.#genid();

    this.#parsePorts();

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

  #genid() {
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

  #parsePorts() {
    this.options.portsx =
      this.options.portsx != undefined ? this.options.portsx : 65536;

    if (this.options.ports) {
      let ports = this.options.ports;
      if (typeof ports == 'string') {
        if (
          /^(?:\d{1,5},|\d{1,5}-\d{1,5},)+\d{1,5}|\d{1,5}-\d{1,5}/.test(ports)
        ) {
          let parts = ports.split(',');
          ports = [];
          for (let part of parts) {
            const m = /^(\d{1,5})-(\d{1,5})/.exec(part);
            if (m) {
              for (
                let i = Math.min(m[1], m[2]);
                i <= Math.max(m[1], m[2]);
                i++
              ) {
                ports.push(i);
              }
            } else {
              ports.push(part * 1);
            }
          }
        } else if (ports == '*') {
          ports = [];
          for (let i = 1; i <= 65535; i++) {
            ports.push(i);
          }
        } else if (ports == '@') {
          if (this.constructor.name == 'PingTCP') {
            ports = knownPorts.ports.tcp;
          } else if (this.constructor.name == 'PingUDP') {
            ports = knownPorts.ports.udp;
          }
        } else {
          ports = [Math.floor(ports * 1)];
        }
      } else if (typeof ports == 'number') {
        ports = [Math.floor(ports)];
      }
      const cports = JSON.parse(JSON.stringify(ports));
      ports = [];
      p: for (let p of cports) {
        p = p * 1;
        if (!Number.isNaN(p) && 0 < p && p < 65536) {
          ports.push(p);
        }
        if (this.options.portsx < ports.length) {
          break p;
        }
      }
      this.options.ports = ports;
    }
  }

  async #dnsResolve() {
    const ips = await dns.ips(this.options.host, this.options.dnsServer);
    if (!ips) {
      this.result.error = 'ENOTFOUND';
      this.result.status = 'error';
      throw new Error(this.result.error);
    }
    this.result.ips = ips;
    this.result.ip = ips[0];
  }

  #filterBogon() {
    if (this.options.filterBogon && new IP(this.result.ip).isBogon()) {
      this.result.error = 'EBOGONIP';
      this.result.status = 'error';
      throw new Error(this.result.error);
    }
  }

  async ready() {
    // resolve DNS
    if (this.options.dnsResolve) {
      await this.#dnsResolve().catch((error) => {
        throw error;
      });
    } else {
      this.result.ip = this.options.host;
      this.result.ips = [this.result.ip];
    }

    // filter Bogon IPs
    if (this.options.filterBogon) {
      try {
        this.#filterBogon();
      } catch (error) {
        throw error;
      }
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

  portName(port) {
    if (this.constructor.name == 'PingTCP') {
      return knownPorts.names.tcp?.[port]
        ? knownPorts.names.tcp?.[port]
        : 'unknown';
    } else if (this.constructor.name == 'PingUDP') {
      return knownPorts.names.udp?.[port]
        ? knownPorts.names.udp?.[port]
        : 'unknown';
    } else {
      return 'unknown';
    }
  }
}

export default Ping;
