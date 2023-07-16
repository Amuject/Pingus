import dgram from 'dgram';
import IP from '@wnynya/ip';
import Ping from './ping.mjs';

class PingUDP extends Ping {
  async send() {
    this.options.port = this.options.port ? this.options.port * 1 : 68;
    this.options.port = Math.max(1, Math.min(65535, this.options.port));
    this.options.bytes = this.options.bytes ? this.options.bytes * 1 : 32;
    this.options.bytes = Math.max(24, Math.min(65535, this.options.bytes));

    this.result.type = 'ping/udp';
    this.result.port = this.options.port;
    this.result.name = this.portName(this.result.port);

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
    const socket = new dgram.createSocket(
      new IP(this.result.ip).is4 ? 'udp4' : 'udp6'
    );
    const buffer = this.options.buffer
      ? this.options.buffer
      : this.options.body
      ? Buffer.from(this.options.body)
      : Buffer.alloc(this.options.bytes);

    let timeout;

    socket.on('close', (error) => {
      this.emitResult();
      return;
    });

    socket.on('error', (error) => {
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
        this.emitError(error);
        return;
      }
    });

    socket.on('listening', () => {
      if (this.options.broadcast) {
        socket.setBroadcast(true);
      }
    });

    const concb = (error, bytes) => {
      if (error) {
        this.result.status = 'error';
        this.result.error = error;
        this.emitError(error);
        return;
      }

      this.result.status = 'open';
      try {
        this.result.ip = socket.remoteAddress().address;
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
        this.result.port,
        this.result.ip,
        concb
      );
    } else {
      socket.connect(this.result.port, this.result.ip, () => {
        socket.send(buffer, concb);
      });
    }
  }

  static sendAsync(options = {}, callback = () => {}) {
    return new Promise((resolve, reject) => {
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
    this.result.errors = {};

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

    for (let i = 0; i < this.options.ports.length; i++) {
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
      opts.host = this.result.ip;
      opts.port = this.options.ports[i];
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
    this.emitResult();
    return;
  }

  static scanAsync(options = {}, callback = () => {}) {
    return new Promise((resolve, reject) => {
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

  static wol(options = {}, callback = () => {}) {
    return new Promise((resolve, reject) => {
      let header = Buffer.from([0xff, 0xff, 0xff, 0xff, 0xff, 0xff]);
      let mac = options.mac || '00-00-00-00-00-00';
      mac = mac.toLowerCase();
      mac = mac.replace(/[^0-9a-f]/g, '');
      let macfer = Buffer.alloc(6);
      for (let i = 0; i < 6; i++) {
        macfer[i] = parseInt(mac.substring(i * 2, i * 2 + 2), 16);
      }
      let buffer = header;
      for (let i = 0; i < 16; i++) {
        buffer = Buffer.concat([buffer, macfer]);
      }
      options.buffer = buffer;
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
