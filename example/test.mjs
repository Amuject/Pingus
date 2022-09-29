import pingus from 'pingus';

// UDP ping scan to localhost
new pingus.PingTCP({ host: 'localhost', port: 22 })
  .on('result', (result) => {
    console.log(result);
  })
  .on('error', (err, result) => {
    throw err;
  })
  .send();
