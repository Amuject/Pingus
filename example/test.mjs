import pingus from 'pingus';

pingus
  .icmp({ host: 'example.com' })
  .then((result) => {
    console.log('icmp ping v host ok');
  })
  .catch(console.warn);

pingus
  .tcp({ host: 'example.com' })
  .then((result) => {
    console.log('tcp ping v host ok');
  })
  .catch(console.warn);

pingus
  .udp({ host: 'example.com' })
  .then((result) => {
    console.log('udp ping v host ok');
  })
  .catch(console.warn);

pingus
  .icmp({ host: '그아아아아' })
  .then((result) => {
    console.log('icmp ping u host ok');
  })
  .catch(console.warn);

pingus
  .tcp({ host: '그아아아아' })
  .then((result) => {
    console.log('tcp ping u host ok');
  })
  .catch(console.warn);

pingus
  .udp({ host: '그아아아아' })
  .then((result) => {
    console.log('udp ping u host ok');
  })
  .catch(console.warn);

pingus
  .traceroute({ host: 'example.com', timeout: 500 })
  .then((result) => {
    console.log('icmp traceroute v host ok');
  })
  .catch(console.warn);

pingus
  .tcpscan({ host: 'example.com', ports: '20-100,10,443,5000' })
  .then((result) => {
    console.log('tcp scan v host ok');
  })
  .catch(console.warn);

pingus
  .udpscan({ host: 'example.com', ports: '20-100,10,443,5000' })
  .then((result) => {
    console.log('udp scan v host ok');
  })
  .catch(console.warn);

pingus
  .tcpscan({ host: 'example.com', ports: '1234' })
  .then((result) => {
    console.log('tcp scan v2 host ok', result.ports);
  })
  .catch(console.warn);

pingus
  .tcpscan({ host: 'example.com', ports: '가나다라' })
  .then((result) => {
    console.log('tcp scan v3 host ok', result.ports);
  })
  .catch(console.warn);

pingus
  .tcpscan({ host: 'example.com', ports: '234432' })
  .then((result) => {
    console.log('tcp scan v4 host ok', result.ports);
  })
  .catch(console.warn);

pingus
  .tcpscan({ host: 'example.com' })
  .then((result) => {
    console.log('tcp scan v5 host ok', result.ports);
  })
  .catch(console.warn);
