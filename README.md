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
  - Class: [`pingus.PingTCP`](#class-pinguspingtcp-extends-pingusping) Extends: [`pingus.Ping`](#class-pingusping)
    - [`new PingTCP(options)`](#new-pingtcpoptions)
    - [`pingtcp.scan()`](#pingtcpscan)
  - Class: [`pingus.PingUDP`](#class-pinguspingudp-extends-pingusping) Extends: [`pingus.Ping`](#class-pingusping)
    - [`new PingUDP(options)`](#new-pingudpoptions)
    - [`pingudp.scan()`](#pingudpscan)
  - Class: [`pingus.PingICMP`](#class-pinguspingicmp-extends-pingusping) Extends: [`pingus.Ping`](#class-pingusping)
    - [`new PingICMP(options)`](#new-pingicmpoptions)
    - [`pingicmp.traceroute()`](#pingicmptraceroute)
  - Class: [`pingus.RangeScanner`](#class-pingusrangescanner)
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

---

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

---

# API

## Class: `pingus.Ping`

### Event: `'ready'`

- `result` [`<Object>`]()

Emitted when ready to send ping. (Resolve DNS, Filter Bogon IP)

```js
import pingus from 'pingus';

const ping = new pingus.PingTCP({
  host: 'example.com',
});
ping.on('ready', (result) => {
  console.log('ping\ttarget:\t', result.host);
  console.log('\tips:\t', result.ips);
});
ping.send();
```

<details><summary>Console Output</summary>

```
ping    target: example.com
        ips: [ '93.184.216.34', '2606:2800:220:1:248:1893:25c8:1946' ]
```

</details>

### Event: `'result'`

- `result` [`<Object>`]()

Result of ping data.

```js
import pingus from 'pingus';

const ping = new pingus.PingTCP({
  host: 'example.com',
});
ping.on('result', (result) => {
  console.log(result);
});
ping.send();
```

<details><summary>Console Output</summary>

```
{
  error: undefined,
  type: 'ping/tcp',
  status: 'open',
  host: 'example.com',
  ip: '93.184.216.34',
  ips: [ '93.184.216.34', '2606:2800:220:1:248:1893:25c8:1946' ],
  time: 127,
  port: 80,
  name: 'http',
  banner: ''
}
```

</details>

### Event: `'error'`

### `ping.send()`

## Class: `pingus.PingTCP` Extends: [`pingus.Ping`](#class-pingusping)

### `new PingTCP(options)`

- `options` [`<Object>`]()
  - `host` [`<string>`]() Set target hostname (domain) or ip address.
  - `port` [`<number>`]() Set target port when using `pingtcp.send()`. _Default: `80`_
  - `ports` [`<Array>`]() Set target ports when using `pingtcp.scan()`.
  - `timeout` [`<number>`]() Set timeout. _Default: `2000`_
  - `dnsResolve` [`<boolean>`]() Resolve DNS `A` and `AAAA` records when `host` is domain address. _Default: `true`_
  - `dnsServer` [`<string>`]() Set DNS server to resolve DNS records.
  - `filterBogon` [`<boolean>`]() [Filter bogon ip address](https://en.wikipedia.org/wiki/Bogon_filtering) in `host`. _Default: `true`_

### `pingtcp.send()`

Send TCP ping. Return result on Event: [`'result'`]().

### `pingtcp.scan()`

Scan ports using TCP ping. Return result on Event: [`'result'`]().

## Class: `pingus.PingUDP` Extends: [`pingus.Ping`](#class-pingusping)

### `new PingUDP(options)`

### `pingudp.scan()`

## Class: `pingus.PingICMP` Extends: [`pingus.Ping`](#class-pingusping)

### `new PingICMP(options)`

### `pingicmp.traceroute()`

## `pingus.tcp(options[, callback])`

## `pingus.udp(options[, callback])`

## `pingus.icmp(options[, callback])`

# Usage

ESM

```js
import pingus from 'pingus';
```

CJS

```js
const pingus = require('pingus').default;
```

## Ping

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
