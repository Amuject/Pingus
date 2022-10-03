import { PingTCP, PingUDP, PingICMP } from './ping.mjs';
import RangeScanner from './rangescanner.mjs';
import pingf from './ping-func.mjs';

export { PingTCP, PingUDP, PingICMP };

export default {
  PingTCP: PingTCP,
  PingUDP: PingUDP,
  PingICMP: PingICMP,
  RangeScanner: RangeScanner,
  tcp: pingf.tcp,
  udp: pingf.udp,
  icmp: pingf.icmp,
  tcpscan: pingf.tcpscan,
  udpscan: pingf.udpscan,
  traceroute: pingf.traceroute,
};
