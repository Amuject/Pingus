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

function udp(options, callback = () => {}) {
  return new Promise((resolve, reject) => {
    new PingUDP(options)
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

function icmp(options, callback = () => {}) {
  return new Promise((resolve, reject) => {
    new PingICMP(options)
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

function tcpscan(options, callback = () => {}) {
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

function udpscan(options, callback = () => {}) {
  return new Promise((resolve, reject) => {
    new PingUDP(options)
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

export default {
  tcp: tcp,
  udp: udp,
  icmp: icmp,
  tcpscan: tcpscan,
  udpscan: udpscan,
};
