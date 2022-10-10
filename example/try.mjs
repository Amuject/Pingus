import pingus from 'pingus';

pingus.wol({ mac: '' }).then(console.log).catch(console.warn);

pingus.icmp({ host: '255.255.255.255' }).then(console.log);
