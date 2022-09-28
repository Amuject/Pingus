# Pingo

A simple ping tool.
Supports TCP / UDP / ICMP protocol.

## Table of Content

- [Installation](#installation)
- [Usage](#usage)
  - [TCP Ping](#tcp-ping)
  - [Multiple Ports](#multiple-ports)
  - [TCP Ping](#tcp-ping)
  - [UDP Ping](#udp-ping)
  - [Scan Ports](#scan-ports)
  - [Scan UDP Ports](#scan-udp-ports)
  - [Command Line](#command-line)
- [API](#api)
  - [query](#query)
  - [ping](#ping)
  - [scan](#scan)

## Installation

```
npm i pingo
```

## Usage

ESM

```js
import pingo from 'pingo';
```

CJS

```js
const pingo = require('pingo').default;
```

### TCP Ping

Using class

```js
// TCP ping to localhost:80
new pingo.PingTCP({ host: 'localhost' })
  .on('result', (result) => {
    console.log(result);
  })
  .on('error', (err, result) => {
    throw err;
  })
  .send();
```

Using callback

```js
// TCP ping to localhost:80
pingo.tcp({ host: 'localhost' }, (err, result) => {
  if (err) {
    throw err;
  }
  console.log(result);
});
```

Using Promise

```js
// TCP ping to localhost:80
pingo
  .tcp({ host: 'localhost' })
  .then((result) => {
    console.log(result);
  })
  .catch((err) => {
    throw err;
  });
```

Using async / await

```js
// TCP ping to localhost:80
const result = await pingo.tcp({ host: 'localhost' });
console.log(result);
```

<details><summary>Result</summary>

```js
{
  "error": undefined,
  "type": "ping/tcp",
  "host": "localhost",
  "ip": "127.0.0.1",
  "ips": ["127.0.0.1"],
  "port": 80,
  "status": "open",
  "name": "http",
  "banner": "",
  "time": 2
}
```

</details>

### Multiple Ports

```js
// TCP ping to ports of localhost
ping('localhost:22,80-90,443,3306')
  .then((result) => {
    console.log(result);
  })
  .catch((err) => {
    throw err;
  });
```

<details><summary>Result</summary>

```js
{
  "error": undefined,
  "type": "ping/tcp/scan",
  "host": "localhost",
  "ip": "127.0.0.1",
  "ips": ["127.0.0.1"],
  "ports": [22, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 443, 3306],
  "status": {
    "open": [22, 80, 3306],
    "reset": [],
    "close": [81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 443],
    "filtered": [],
    "error": []
  },
  "names": {
    "22": "ssh",
    "80": "http",
    "81": "unknown",
    "82": "xfer",
    "83": "mit-ml-dev",
    "84": "ctf",
    "85": "mit-ml-dev",
    "86": "mfcobol",
    "87": "unknown",
    "88": "kerberos",
    "89": "su-mit-tg",
    "90": "dnsix",
    "443": "https",
    "3306": "mysql"
  },
  "banners": { "22": "SSH-2.0-OpenSSH_8.9p1 Ubuntu-3" },
  "errors": {},
  "time": 2005
}
```

</details>

### Ping TCP

```js
// TCP ping to localhost:80
ping
  .tcp('localhost', 80)
  .then((result) => {
    console.log(result);
  })
  .catch((err) => {
    throw err;
  });
```

### Ping UDP

```js
// UDP ping to localhost:68
ping
  .udp('localhost', 68)
  .then((result) => {
    console.log(result);
  })
  .catch((err) => {
    throw err;
  });
```

### Scan Ports

```js
// TCP scan to ports of localhost
ping
  .scan('localhost', [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 80, 443, 3306])
  .then((result) => {
    console.log(result);
  })
  .catch((err) => {
    throw err;
  });
```

### Scan UDP Ports

```js
// UDP scan to ports of localhost
ping
  .scan('localhost', [67, 68, 161, 162, 163, 164], {
    protocol: 'udp',
  })
  .then((result) => {
    console.log(result);
  })
  .catch((err) => {
    throw err;
  });
```

### Command Line

```sh
cd node_modules/ping-port
npm run query [host]:<port|ports> <...options>
```

options:<br>
&nbsp;&nbsp;`t`: use tcp (default)<br>
&nbsp;&nbsp;`u`: use udp<br>
&nbsp;&nbsp;`f`: full log output<br>
&nbsp;&nbsp;`d <dns>`: use specific dns server<br>
<br>
Example

```sh
npm run query example.com:@ t d 8.8.8.8
```

<details><summary>Result</summary>

```
Running ping-port at 2022-09-24T13:15:21.226Z

query   : tcp/example.com:@
dns     : 8.8.8.8
ip      : 93.184.216.34

scan    : 1024 ports
open    : [80,443]
reset   : []
close   : [1119,1935]
filtered: 1020 ports

80      open    http
443     open    https
1119    close   bnetgame
1935    close   macromedia-fcs
```

</details>

## API

### query

```js
ping(target, options);
```

target: `string [host]:<port|ports>`<br>
<br>
target ports:<br>
`:80`: target port 80<br>
`:80,90,100`: target port 80, 90 and 100<br>
`:80-100`: target port in range 80 to 100<br>
`:22,80-100,443`: target port 22, port in range 80 to 100 and port 443<br>
`:@`: target most used 1024 ports<br>
`:*`: target all ports (same as `:1-65535`)<br>
<br>
options: `Object`<br>
&nbsp;&nbsp;options.protocol: `string <tcp|udp>`<br>
&nbsp;&nbsp;options.filterBogon: `boolean`<br>
&nbsp;&nbsp;options.dnsServer: `string <server>`<br>

### ping

```js
ping.tcp(target, options);
```

```js
ping.udp(host, port, options);
```

host: `string [host]`<br>
port: `number <port>`<br>
options: `Object`<br>
&nbsp;&nbsp;options.timeout: `number <miliseconds>`<br>
&nbsp;&nbsp;options.filterBogon: `boolean`<br>
&nbsp;&nbsp;options.dnsServer: `string <server>`<br>

### scan

```js
ping.scan(host, ports, options);
```

host: `string [host]`<br>
ports: `Array <ports>`<br>
options: `Object`<br>
&nbsp;&nbsp;options.timeout: `number <miliseconds>`<br>
&nbsp;&nbsp;options.chunk: `number <chunk>`<br>
&nbsp;&nbsp;options.protocol: `string <tcp|udp>`<br>
&nbsp;&nbsp;options.filterBogon: `boolean`<br>
&nbsp;&nbsp;options.dnsServer: `string <server>`<br>
