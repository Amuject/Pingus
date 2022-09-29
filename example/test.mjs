import pingus from 'pingus';

new pingus.PingICMP({ host: 'example.com', ttl: 10 })
  .on('result', (result) => {
    console.log(result);
  })
  .on('error', (err, result) => {
    throw err;
  })
  .send();
