import { EventEmitter } from 'node:events';
import dns from '@wnynya/dns';
import IP from '@wnynya/ip';

interface PingOptions {
  host: IP | string;
  timeout?: 2000 | number;
  filterBogon?: boolean;
  resolveDNS?: boolean;
  dnsServer?: '1.1.1.1' | '8.8.8.8' | '8.8.4.4' | string;
}

interface PingTarget {
  ip: IP;
}

interface PingResult {
  error?: Error | string;
  type: string | null;
  status: string | null;
  host: string | null;
  ip: IP | null;
  ips: IP[];
  time: number;
  toPrimitiveJSON?(): JSONPingResult;
}

interface JSONPingResult {
  error?: Error | string;
  type: string | null;
  status: string | null;
  host: string | null;
  ip: string | null;
  ips: string[];
  time: number;
}

abstract class Ping extends EventEmitter {
  options: PingOptions;
  target: PingTarget;
  result: PingResult;

  afterConstructor(options: PingOptions) {
    // host
    const hostString =
      options.host instanceof IP
        ? options.host.toString()
        : options.host.toLowerCase();
    this.options.host = hostString;
    this.result.host = hostString;

    // timeout
    this.options.timeout =
      options.timeout === undefined ? 2000 : options.timeout;

    // filterBogon
    this.options.filterBogon =
      options.filterBogon === undefined ? false : options.filterBogon;

    // dns
    this.options.dnsServer =
      options.dnsServer === undefined ? '1.1.1.1' : options.dnsServer;

    // toPrimitiveJSON
    this.result.toPrimitiveJSON = () => {
      const result = JSON.parse(JSON.stringify(this.result));
      result.ip = result?.ip?.label;
      const ips = [];
      for (const ip of result.ips) {
        ips.push(ip.label);
      }
      result.ips = ips;
      return result;
    };
  }

  async ready() {
    // resolve DNS
    await this.#resolveDNS().catch((error) => {
      throw error;
    });

    // filter Bogon IPs
    if (this.options.filterBogon) {
      try {
        this.#filterBogon();
      } catch (error) {
        throw error;
      }
    }

    return;
  }

  async #resolveDNS() {
    const ips = await dns.ips(this.options.host, this.options.dnsServer);
    if (!ips || ips.length == 0) {
      this.result.error = 'ENOTFOUND';
      this.result.status = 'error';
      throw new Error(this.result.error);
    }
    const array: IP[] = [];
    for (const ip of ips) {
      array.push(new IP(ip));
    }
    this.target.ip = array[0];
    this.result.ip = this.target.ip;
    this.result.ips = array;
  }

  #filterBogon() {
    if (this.options.filterBogon && this.result.ip.isBogon()) {
      this.result.error = 'EBOGONIP';
      this.result.status = 'error';
      throw new Error(this.result.error);
    }
  }
}

export default Ping;
export { Ping, PingOptions, PingTarget, PingResult };
