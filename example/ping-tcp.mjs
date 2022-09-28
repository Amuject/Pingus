import pingus from '../src/index.mjs';

pingus.tcp({ host: 'localhost', port: 22 }).then(console.log);
