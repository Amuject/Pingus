import util from 'node:util';

import pingus from 'pingus';

// TCP Ping to localhost:22

pingus.tcp({ host: 'localhost', port: 22 }).then(console.log);
