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
