import { PingTCP, PingUDP, PingICMP } from './ping.mjs';

async function tcp(options) {
  return new Promise((resolve, reject) => {
    new PingTCP(options)
      .on('result', (result) => {
        resolve(result);
      })
      .on('error', (error, result) => {
        reject(result);
      })
      .send();
  });
}

async function udp(options) {
  return new Promise((resolve, reject) => {
    new PingUDP(options)
      .on('result', (result) => {
        resolve(result);
      })
      .on('error', (error, result) => {
        reject(result);
      })
      .send();
  });
}

async function icmp(options) {
  return new Promise((resolve, reject) => {
    new PingICMP(options)
      .on('result', (result) => {
        resolve(result);
      })
      .on('error', (error, result) => {
        reject(result);
      })
      .send();
  });
}

export default {
  tcp: tcp,
  udp: udp,
  icmp: icmp,
};
