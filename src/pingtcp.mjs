import net from 'net';
import Ping from './ping.mjs';

class PingTCP extends Ping {
  async send() {
    this.options.port = this.options.port ? this.options.port * 1 : 80;
    this.options.port = Math.max(1, Math.min(65535, this.options.port));

    this.result.type = 'ping/tcp';
    this.result.port = this.options.port;
    this.result.name = this.portName(this.result.port);
    this.result.banner = '';

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
    const socket = new net.Socket();

    socket.setTimeout(this.options.timeout);

    socket.on('connect', () => {
      socket.connected = true;
      this.result.ip = socket.remoteAddress;
      this.result.time = new Date().getTime() - timestamp;
    });

    socket.on('data', (data) => {
      this.result.banner += data.toString();
      this.result.banner = this.result.banner.replace(/\r|\n/g, '');
    });

    socket.on('close', (error) => {
      if (this.result.status == 'ready' && !error) {
        this.result.status = 'open';
      }

      this.result.name = this.#bannerName(this.result.banner, this.result.name);

      socket.destroy();

      this.emitResult();
      return;
    });

    socket.on('timeout', () => {
      if (this.result.status == 'ready' && !socket.connected) {
        this.result.time = new Date().getTime() - timestamp;
        this.result.status = 'filtered';
      }

      socket.destroy();
    });

    socket.on('error', (error) => {
      this.result.time = new Date().getTime() - timestamp;
      socket.destroy();

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

    socket.connect(this.result.port, this.result.ip);
  }

  #bannerName(banner, name) {
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

  static sendAsync(options = {}, callback = () => {}) {
    return new Promise((resolve, reject) => {
      new PingTCP(options)
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

  async scan() {
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
      r.name ? (_this.result.names[r.port] = r.name) : null;
      r.banner ? (_this.result.banners[r.port] = r.banner) : null;
      _this.result.statuses[r.status].push(r.port);
      r.status == 'error' ? (_this.result.errors[r.port] = r.error) : null;
    };

    for (let i = 0; i < this.options.ports.length; i++) {
      if (tasks[ti].length == this.options.chunk) {
        const pr = await Promise.all(tasks[ti]);
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
      tasks[ti].push(PingTCP.sendAsync(opts));
    }

    const pr = await Promise.all(tasks[ti]);
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
