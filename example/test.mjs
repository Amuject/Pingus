import pingus from 'pingus';

// UDP ping scan to localhost
pingus
  .traceroute({
    host: 'example.com',
    timeout: 500,
  })
  .then(console.log);
