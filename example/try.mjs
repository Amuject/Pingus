import pingus from 'pingus';

pingus
  .tcpscan({
    host: '125.188.112.49',
    ports: '@',
    timeout: 1000,
  })
  .then((result) => {
    console.log(result); //결과 출력
  })
  .catch((err) => {
    console.warn(err);
  });
