# Pingus

A simple ping tool.
Supports TCP / UDP / ICMP protocol.

## Table of Content

- [Installation](#installation)
- [Simple Example](#simple-example)
- [API](#api)
  - Class: [`pingus.Ping`](#class-pingusping)
    - Event: [`'ready'`](#event-ready)
    - Event: [`'result'`](#event-result)
    - Event: [`'error'`](#event-error)
    - [`ping.send()`](#pingsend)
  - Class: [`pingus.PingTCP`](#class-pingustcp-extends-pingusping) Extends: [`pingus.Ping`](#class-pingusping)
    - [`new PingTCP(options)`](#new-pingtcpoptions)
    - [`pingtcp.scan()`](#pingtcpscan)
  - Class: [`pingus.PingUDP`](#pingudp-extends-pingusping) Extends: [`pingus.Ping`](#class-pingusping)
    - [`new PingUDP(options)`](#new-pingudpoptions)
    - [`pingudp.scan()`](#pingudpscan)
  - Class: [`pingus.PingICMP`](#pingicmp-extends-pingusping) Extends: [`pingus.Ping`](#class-pingusping)
    - [`new PingICMP(options)`](#new-pingicmpoptions)
    - [`pingicmp.traceroute()`](#pingicmptraceroute)
  - Class: [`pingus.RangeScanner`](#class-pingus)
    - [`new RangeScanner(options)`](#new-rangescanneroptions)
  - [`pingus.tcp(options[, callback])`](#pingustcpoptions-callback)
  - [`pingus.udp(options[, callback])`](#pingusudpoptions-callback)
  - [`pingus.icmp(options[, callback])`](#pingusicmpoptions-callback)
- [Usage](#usage)
  - [TCP Ping](#tcp-ping)
  - [UDP Ping](#udp-ping)
  - [ICMP Ping](#icmp-ping)
  - [Scan TCP Ports](#scan-tcp-ports)
  - [Scan UDP Ports](#scan-udp-ports)
  - [Command Line](#command-line)

## Installation

```
npm i pingus
```

## Simple Example

```js
// TCP Ping to localhost:22
import pingus from 'pingus'; // ESM
pingus.tcp({ host: 'localhost', port: 22 }).then(console.log);
```

```js
// Result
{
  error: undefined,
  type: 'ping/tcp',
  status: 'open',
  host: 'localhost',
  ip: '127.0.0.1',
  ips: [ '127.0.0.1' ],
  time: 2,
  port: 22,
  name: 'ssh',
  banner: 'SSH-2.0-OpenSSH_8.9p1 Ubuntu-3'
}
```

## API

## Class: `pingus.Ping`

### Event: `'ready'`

### Event: `'result'`

### Event: `'error'`

### `ping.send()`

## Class: `pingus.PingTCP` Extends: [`pingus.Ping`](#class-pingusping)

### `new PingTCP(options)`

### `pingtcp.scan()`

## Class: `pingus.PingUDP` Extends: [`pingus.Ping`](#class-pingusping)

### `new PingUDP(options)`

### `pingudp.scan()`

## Class: `pingus.PingICMP` Extends: [`pingus.Ping`](#class-pingusping)

### `new PingICMP(options)`

### `pingicmp.traceroute()`

## Usage

ESM

```js
import pingus from 'pingus';
```

CJS

```js
const pingus = require('pingus').default;
```

### Ping

Using class

```js
// TCP ping to localhost:80
new pingus.PingTCP({ host: 'localhost' })
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
pingus.tcp({ host: 'localhost' }, (err, result) => {
  if (err) {
    throw err;
  }
  console.log(result);
});
```

Using Promise

```js
// TCP ping to localhost:80
pingus
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
const result = await pingus.tcp({ host: 'localhost' });
console.log(result);
```

<details><summary>Result</summary>

```js
{
  error: undefined,
  type: 'ping/tcp',
  status: 'open',
  host: 'localhost',
  ip: '127.0.0.1',
  ips: [ '127.0.0.1' ],
  time: 2,
  port: 80,
  name: 'http',
  banner: ''
}
```

</details>

### UDP Ping

Using class

```js
// TCP ping to localhost:80
new pingus.PingTCP({ host: 'localhost' })
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
pingus.tcp({ host: 'localhost' }, (err, result) => {
  if (err) {
    throw err;
  }
  console.log(result);
});
```

Using Promise

```js
// TCP ping to localhost:80
pingus
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
const result = await pingus.tcp({ host: 'localhost' });
console.log(result);
```

<details><summary>Result</summary>

```js
{
  error: undefined,
  type: 'ping/tcp',
  status: 'open',
  host: 'localhost',
  ip: '127.0.0.1',
  ips: [ '127.0.0.1' ],
  time: 2,
  port: 80,
  name: 'http',
  banner: ''
}
```

</details>

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
