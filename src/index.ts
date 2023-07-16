import { PingTCP, PingTCPOptions, PingTCPResult } from './pingtcp.js';
import { PingUDP, PingUDPOptions, PingUDPResult } from './pingudp.js';
import { PingICMP, PingICMPOptions, PingICMPResult } from './pingicmp.js';

export default {
  PingTCP: PingTCP,
  tcp: PingTCP.sendAsync,
  tcpscan: PingTCP.scanAsync,
  PingUDP: PingUDP,
  udp: PingUDP.sendAsync,
  udpscan: PingUDP.scanAsync,
  wol: PingUDP.wol,
  PingICMP: PingICMP,
  icmp: PingICMP.sendAsync,
  traceroute: PingICMP.tracerouteAsync,
};
