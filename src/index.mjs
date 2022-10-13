import PingTCP from './pingtcp.mjs';
import PingUDP from './pingudp.mjs';
import PingICMP from './pingicmp.mjs';
import RangeScanner from './rangescanner.mjs';

export default {
  PingTCP: PingTCP,
  PingUDP: PingUDP,
  PingICMP: PingICMP,
  tcp: PingTCP.sendAsync,
  tcpscan: PingTCP.scanAsync,
  udp: PingUDP.sendAsync,
  udpscan: PingUDP.scanAsync,
  wol: PingUDP.wol,
  icmp: PingICMP.sendAsync,
  traceroute: PingICMP.tracerouteAsync,
  RangeScanner: RangeScanner,
};

export { PingTCP, PingUDP, PingICMP, RangeScanner };

if (process.argv.length >= 2) {
  if (process.argv.length == 2) {
    process.exit();
  } else if (process.argv.length == 3) {
    const target = process.argv[2];

    console.log('Running Pingus at', new Date(), '\n');
    console.log('host:\t', target);

    new PingICMP({ host: target, ttl: 255 })
      .on('ready', (result) => {
        console.log('ips:\t', result.ips);
      })
      .on('result', (result) => {
        console.log(result);
        console.log('ICMP ECHO OK ');
      })
      .on('error', (error) => {})
      .send();
  } else if (process.argv.length >= 4) {
    const target = process.argv[2];

    const args = [];
    for (let i = 3; i < process.argv.length; i++) {
      args.push(process.argv[i]);
    }

    console.log(target, args);
  }
}
