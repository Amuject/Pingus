import { PingTCP, PingUDP, PingICMP } from './ping.mjs';

function tcp(options, callback = () => {}) {
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

function udp(options) {
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

function icmp(options) {
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
