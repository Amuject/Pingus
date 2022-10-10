import pingus from '../src/index.mjs';

pingus
  .traceroute({ host: 'example.com', timeout: 500 })
  .then((result) => {
    console.log(result);
  })
  .catch(console.warn);
