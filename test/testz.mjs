import pingus from 'pingus';

function test(condition, msg, err) {
  if (condition) {
    console.log('[PASS]:', msg);
  } else {
    console.log('[ERROR]:', msg);
  }
}

new pingus.PingTCP({
  host: 'localhost',
})
  .on('ready', (res) => {
    test(res.ip == '127.0.0.1', 'PingTCP ready');
  })
  .on('result', (res) => {
    test(true, 'PingTCP result');
  })
  .on('error', (error) => {
    test(false, 'PingTCP error');
  })
  .send();

new pingus.PingUDP({
  host: 'localhost',
})
  .on('ready', (res) => {
    test(res.ip == '127.0.0.1', 'PingUDP ready');
  })
  .on('result', (res) => {
    test(true, 'PingUDP result');
  })
  .on('error', (error) => {
    test(false, 'PingUDP error');
  })
  .send();

new pingus.PingICMP({
  host: 'localhost',
})
  .on('ready', (res) => {
    test(res.ip == '127.0.0.1', 'PingICMP ready');
  })
  .on('result', (res) => {
    test(true, 'PingICMP result');
  })
  .on('error', (error) => {
    test(false, 'PingICMP error');
  })
  .send();

new pingus.PingTCP({
  host: 'localhost',
  ports: 80,
})
  .on('ready', (res) => {
    test(res.ip == '127.0.0.1', 'PingTCP ready scan number');
  })
  .on('result', (res) => {
    test(true, 'PingTCP result scan number');
  })
  .on('error', (error) => {
    test(false, 'PingTCP error scan number');
  })
  .scan();

new pingus.PingTCP({
  host: 'localhost',
  ports: '80',
})
  .on('ready', (res) => {
    test(res.ip == '127.0.0.1', 'PingTCP ready scan string');
  })
  .on('result', (res) => {
    test(true, 'PingTCP result scan string');
  })
  .on('error', (error) => {
    test(false, 'PingTCP error scan string');
  })
  .scan();

new pingus.PingTCP({
  host: 'localhost',
  ports: '80-90',
})
  .on('ready', (res) => {
    test(res.ip == '127.0.0.1', 'PingTCP ready scan range');
  })
  .on('result', (res) => {
    test(true, 'PingTCP result scan range');
  })
  .on('error', (error) => {
    test(false, 'PingTCP error scan range');
  })
  .scan();

new pingus.PingTCP({
  host: 'localhost',
  ports: '80,81,82,83,84,85',
})
  .on('ready', (res) => {
    test(res.ip == '127.0.0.1', 'PingTCP ready scan stringarray');
  })
  .on('result', (res) => {
    test(true, 'PingTCP result scan stringarray');
  })
  .on('error', (error) => {
    test(false, 'PingTCP error scan stringarray');
  })
  .scan();

new pingus.PingTCP({
  host: 'localhost',
  ports: '20-30,80,81,82,83,84,85,90-100',
})
  .on('ready', (res) => {
    test(res.ip == '127.0.0.1', 'PingTCP ready scan multiple');
  })
  .on('result', (res) => {
    test(true, 'PingTCP result scan multiple');
  })
  .on('error', (error) => {
    test(false, 'PingTCP error scan multiple');
  })
  .scan();

new pingus.PingTCP({
  host: 'localhost',
  ports: '@',
})
  .on('ready', (res) => {
    test(res.ip == '127.0.0.1', 'PingTCP ready scan mostports');
  })
  .on('result', (res) => {
    test(true, 'PingTCP result scan mostports');
  })
  .on('error', (error) => {
    test(false, 'PingTCP error scan mostports');
  })
  .scan();

new pingus.PingUDP({
  host: 'localhost',
  ports: 80,
})
  .on('ready', (res) => {
    test(res.ip == '127.0.0.1', 'PingUDP ready scan number');
  })
  .on('result', (res) => {
    test(true, 'PingUDP result scan number');
  })
  .on('error', (error) => {
    test(false, 'PingUDP error scan number');
  })
  .scan();

new pingus.PingUDP({
  host: 'localhost',
  ports: '80',
})
  .on('ready', (res) => {
    test(res.ip == '127.0.0.1', 'PingUDP ready scan string');
  })
  .on('result', (res) => {
    test(true, 'PingUDP result scan string');
  })
  .on('error', (error) => {
    test(false, 'PingUDP error scan string');
  })
  .scan();

new pingus.PingUDP({
  host: 'localhost',
  ports: '80-90',
})
  .on('ready', (res) => {
    test(res.ip == '127.0.0.1', 'PingUDP ready scan range');
  })
  .on('result', (res) => {
    test(true, 'PingUDP result scan range');
  })
  .on('error', (error) => {
    test(false, 'PingUDP error scan range');
  })
  .scan();

new pingus.PingUDP({
  host: 'localhost',
  ports: '80,81,82,83,84,85',
})
  .on('ready', (res) => {
    test(res.ip == '127.0.0.1', 'PingUDP ready scan stringarray');
  })
  .on('result', (res) => {
    test(true, 'PingUDP result scan stringarray');
  })
  .on('error', (error) => {
    test(false, 'PingUDP error scan stringarray');
  })
  .scan();

new pingus.PingUDP({
  host: 'localhost',
  ports: '20-30,80,81,82,83,84,85,90-100',
})
  .on('ready', (res) => {
    test(res.ip == '127.0.0.1', 'PingUDP ready scan multiple');
  })
  .on('result', (res) => {
    test(true, 'PingUDP result scan multiple');
  })
  .on('error', (error) => {
    test(false, 'PingUDP error scan multiple');
  })
  .scan();

new pingus.PingUDP({
  host: 'localhost',
  ports: '@',
})
  .on('ready', (res) => {
    test(res.ip == '127.0.0.1', 'PingUDP ready scan mostports');
  })
  .on('result', (res) => {
    test(true, 'PingUDP result scan mostports');
  })
  .on('error', (error) => {
    test(false, 'PingUDP error scan mostports');
  })
  .scan();

new pingus.PingICMP({
  host: 'example.com',
})
  .on('ready', (res) => {
    test(res.ip == '93.184.216.34', 'PingICMP ready traceroute');
  })
  .on('result', (res) => {
    test(true, 'PingICMP result traceroute');
  })
  .on('error', (error) => {
    test(false, 'PingICMP error traceroute');
  })
  .traceroute();

pingus
  .wol({
    mac: '00-00-00-00-00-00',
  })
  .then((res) => {
    test(res.ip == '255.255.255.255', 'PingICMP result wol');
  })
  .catch((err) => {
    test(false, 'PingICMP error wol');
  });
