import pingus from 'pingus';

const ping = new pingus.PingICMP({
  host: 'wanyne.com',
  ttl: 128,
  bytes: 32,
  dnsServer: '1.1.1.1',
  resolveDNS: true,
});
ping.on('result', (result) => {
  console.log(result.toPrimitiveJSON());
  console.log('ping\ttarget:\t', result.host);
  console.log('\tips:\t', result.ips);
});
ping.send();

new pingus.PingICMP({ host: 'example.com', timeout: 500 })
  .on('result', (result) => {
    console.log(result.toPrimitiveJSON());
  })
  .on('error', (err, result) => {
    throw err;
  })
  .traceroute();
