import EventEmitter from 'events';
import IP from '@wanyne/ip';

class RangeScanner extends EventEmitter {
  constructor(range, task) {
    super();

    this.task = task;

    let ips = [];
    if (range instanceof Array) {
      ips = range;
    } else {
      const ip = new IP(range);
      if (!ip.hasSubnet) {
        ips.push(range);
      } else {
        if (ip.is4) {
          ips = ip.getRange4Ips();
        } else {
          ips = ip.getRange6Ips();
        }
      }
    }

    this.result = {
      error: undefined,
      type: 'rangescan',
      status: undefined,
      ips: ips,
      time: -1,
      results: [],
    };
  }

  async scan(chunk = 16) {
    const timestamp = new Date().getTime();
    const t = [[]];
    let ti = 0;

    for (let i = 0; i < this.result.ips.length; i++) {
      if (t[ti].length == chunk) {
        const pr = await Promise.all(t[ti]);
        for (const p of pr) {
          this.result.results.push(p);
        }
        ti++;
      }

      if (i % chunk == 0 && i > 0) {
        t.push([]);
      }

      const opts = JSON.parse(JSON.stringify(this.task.options));
      opts.host = this.result.ips[i];
      const task = new this.task.clss(opts)[this.task.func]();
      t[ti].push(task);
    }

    const pr = await Promise.all(t[ti]);
    for (const p of pr) {
      this.result.results.push(p);
    }

    this.result.status = 'finish';

    this.result.time = new Date().getTime() - timestamp;
    return this.result;
  }
}

export default RangeScanner;
