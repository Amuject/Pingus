const pingus = require('pingus');

pingus
  .wol('00-00-00-00-00-00')
  .then((result) => {
    console.log(result);
  })
  .catch((error) => {
    throw error;
  });
