import pingus from 'pingus';

const host = 'wany.io';

//pingus.icmp({ host: host }).then(console.log).catch(console.warn);

//pingus.tcp({ host: host }).then(console.log).catch(console.warn);

//pingus.udp({ host: host }).then(console.log).catch(console.warn);

/*pingus
  .traceroute({ host: host, timeout: 500 })
  .then(console.log)
  .catch(console.warn);*/
pingus
  .tcpscan({ host: host, ports: '@' })
  .then((res) => {
    delete res.names;
    console.log(res);
  })
  .catch(console.warn);
/*pingus
  .udpscan({ host: host, ports: '@' })
  .then((res) => {
    delete res.names;
    console.log(res);
  })
  .catch(console.warn);*/
