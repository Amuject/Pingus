import pingus from 'pingus';

pingus.wol({ mac: '' }).then(console.log).catch(console.warn);

pingus
  .udpscan({ host: 'localhost', ports: '@' })
  .then((res) => {
    delete res.names;
    delete res.ports;
    console.log(res);
  })
  .catch(console.warn);
