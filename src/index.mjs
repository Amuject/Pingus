import { PingTCP, PingUDP, PingICMP } from './ping.mjs';
import RangeScanner from './rangescanner.mjs';
import ping_promise from './ping-promise.mjs';

export { PingTCP, PingUDP, PingICMP };

export default {
  PingTCP: PingTCP,
  PingUDP: PingUDP,
  PingICMP: PingICMP,
  RangeScanner: RangeScanner,
  tcp: ping_promise.tcp,
  udp: ping_promise.udp,
  icmp: ping_promise.icmp,
};
