"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "PingICMP", {
  enumerable: true,
  get: function () {
    return _pingicmp.default;
  }
});
Object.defineProperty(exports, "PingTCP", {
  enumerable: true,
  get: function () {
    return _pingtcp.default;
  }
});
Object.defineProperty(exports, "PingUDP", {
  enumerable: true,
  get: function () {
    return _pingudp.default;
  }
});
Object.defineProperty(exports, "RangeScanner", {
  enumerable: true,
  get: function () {
    return _rangescanner.default;
  }
});
exports.default = void 0;

var _pingtcp = _interopRequireDefault(require("./pingtcp.js"));

var _pingudp = _interopRequireDefault(require("./pingudp.js"));

var _pingicmp = _interopRequireDefault(require("./pingicmp.js"));

var _rangescanner = _interopRequireDefault(require("./rangescanner.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = {
  PingTCP: _pingtcp.default,
  PingUDP: _pingudp.default,
  PingICMP: _pingicmp.default,
  tcp: _pingtcp.default.sendAsync,
  tcpscan: _pingtcp.default.scanAsync,
  udp: _pingudp.default.sendAsync,
  udpscan: _pingudp.default.scanAsync,
  wol: _pingudp.default.wol,
  icmp: _pingicmp.default.sendAsync,
  traceroute: _pingicmp.default.tracerouteAsync,
  RangeScanner: _rangescanner.default
};
exports.default = _default;

if (process.argv.length >= 3 && process.argv[2] == '--pingus-cli') {
  if (process.argv.length == 3) {
    process.exit();
  } else if (process.argv.length == 4) {
    const target = process.argv[3];
    console.log('Running Pingus at', new Date(), '\n');
    console.log(strpad('host', 8) + target);
    new _pingicmp.default({
      host: target,
      ttl: 255
    }).on('ready', result => {
      if (result.ips.length == 1) {
        console.log(strpad('ip', 8) + result.ips[0]);
      } else {
        let ips = '';

        for (const ip of result.ips) {
          ips += ip + ', ';
        }

        ips = ips.substring(0, ips.length - 2);
        console.log(strpad('ips', 8) + ips);
      }

      console.log('');
    }).on('result', result => {
      if (result.reply) {
        let type = result.reply.typestr.toLowerCase();
        type = type.replace(/_/g, '-');
        let code = result.reply.codestr.toLowerCase();
        code = code.replace(/_/g, '-');
        console.log('icmp echo', 'reply', type + '/' + code, 'from', result.reply.source);
      } else {
        console.log('icmp echo', result.status);
      }

      console.log('');
      Promise.all([_pingtcp.default.scanAsync({
        host: target,
        ports: '@'
      }), _pingudp.default.scanAsync({
        host: target,
        ports: '@'
      })]).then(tures => {
        const tres = tures[0];
        const ures = tures[1];
        const prints = [];
        const elses = [];

        function addPrints(protocol, status, ports, names) {
          if (ports.length < 32) {
            for (const port of ports) {
              prints.push({
                protocol: protocol,
                port: port,
                name: names[port],
                status: status
              });
            }
          } else {
            elses.push({
              protocol: protocol,
              ports: ports.length,
              status: status
            });
          }
        }

        for (const id in tres.statuses) {
          addPrints('tcp', id, tres.statuses[id], tres.names);
        }

        for (const id in ures.statuses) {
          addPrints('udp', id, ures.statuses[id], ures.names);
        }

        prints.sort((a, b) => {
          return a.port - b.port;
        });

        for (const port of prints) {
          console.log(strpad(port.protocol, 8) + strpad(port.port + '', 16) + strpad(port.status, 16) + port.name);
        }

        console.log('');

        for (const el of elses) {
          console.log(strpad(el.protocol, 8) + strpad(el.ports + ' ports', 16) + el.status);
        }

        console.log('');
        process.exit();
      });
    }).on('error', (error, result) => {
      console.log(result);
      process.exit();
    }).send();
  } else if (process.argv.length >= 4) {
    const target = process.argv[2];
    const args = [];

    for (let i = 3; i < process.argv.length; i++) {
      args.push(process.argv[i]);
    }

    console.log(target, args);
  }

  function strpad(s, n, c) {
    var val = s.valueOf();

    if (Math.abs(n) <= val.length) {
      return val;
    }

    var m = Math.max(Math.abs(n) - s.length || 0, 0);
    var pad = Array(m + 1).join(String(c || ' ').charAt(0));
    return n < 0 ? pad + val : val + pad;
  }
}