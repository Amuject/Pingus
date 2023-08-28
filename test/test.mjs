import pingus from 'pingus';

const ping = new pingus.PingICMP({
  host: 'wanyne.com',
  ttl: 128,
  bytes: 32,
  dnsServer: '1.1.1.1',
  resolveDNS: true,
});
ping.on('result', (result) => {
  console.log('ping\ttarget:\t', result.host);
  console.log('\tips:\t', result.ips);
});
ping.send();
