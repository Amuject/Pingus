const pingus = require('../').default;

// UDP ping scan to localhost
pingus.tcp({ host: 'localhost', port: 22 }).then(console.log);
pingus.udp({ host: 'localhost', port: 67 }).then(console.log);
pingus.icmp({ host: 'example.com' }).then(console.log);
