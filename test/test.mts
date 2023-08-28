import pingus from 'pingus';

const ping = new pingus.PingICMP({
  host: 'google.com',
  ttl: 128,
  bytes: 32,
  dnsServer: '64.6.64.6',
  resolveDNS: true,
});
ping.on('result', (result) => {
  console.log('ping\ttarget:\t', result.host);
  console.log('\tips:\t', result.ips);
});
ping.send();
