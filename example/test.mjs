import pingus from 'pingus';

// UDP ping scan to localhost
pingus
  .tcpscan({
    host: 'server-pingo.wnynya.com',
    timeout: 500,
    ports: '20-24,80,443',
  })
  .then(console.log);
