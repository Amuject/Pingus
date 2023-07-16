import pingus from 'pingus';

(async () => {
  /* console.log(
    await pingus.tcp({
      host: 'localhost',
    })
  );
  console.log(
    await pingus.udp({
      host: 'localhost',
    })
  );
  console.log(
    await pingus.icmp({
      host: 'wany.io',
    })
  );
  console.log(
    await pingus.traceroute({
      host: 'example.com',
    })
  );
  console.log(
    await pingus.tcpscan({
      host: 'localhost',
      ports: '22-80',
    })
  );*/
})();

pingus
  .wol('00-00-00-00-00-00')
  .then((result) => {
    console.log(result);
  })
  .catch((error) => {
    throw error;
  });
