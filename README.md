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
    - [`pingtcp.send()`](#pingtcpsend)
    - [`pingtcp.scan()`](#pingtcpscan)
  - Class: [`pingus.PingUDP`](#class-pinguspingudp-extends-pingusping) Extends: [`pingus.Ping`](#class-pingusping)
    - [`new PingUDP(options)`](#new-pingudpoptions)
    - [`pingudp.send()`](#pingudpsend)
    - [`pingudp.scan()`](#pingudpscan)
  - Class: [`pingus.PingICMP`](#class-pinguspingicmp-extends-pingusping) Extends: [`pingus.Ping`](#class-pingusping)
    - [`new PingICMP(options)`](#new-pingicmpoptions)
    - [`pingicmp.send()`](#pingicmpsend)
    - [`pingicmp.traceroute()`](#pingicmptraceroute) _(WIP)_
  - Class: [`pingus.RangeScanner`](#class-pingusrangescanner) _(WIP)_
    - [`new RangeScanner(options)`](#new-rangescanneroptions)
  - [`pingus.tcp(options[, callback])`](#pingustcpoptions-callback)
  - [`pingus.udp(options[, callback])`](#pingusudpoptions-callback)
  - [`pingus.icmp(options[, callback])`](#pingusicmpoptions-callback)
- [Usage](#usage)
  - [Seng Ping Styles](#send-ping-styles)
  - [TCP Ping](#tcp-ping)
  - [UDP Ping](#udp-ping)
  - [ICMP Ping](#icmp-ping)
  - [Scan TCP Ports](#scan-tcp-ports)
  - [Scan UDP Ports](#scan-udp-ports)
  - [Using RangeScanner](#using-rangescanner) _(WIP)_

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

# API

## Class: `pingus.Ping`

`pingus.Ping` is [`EventEmitter`]() with the following events:

### Event: `'ready'`

- `result` [`<Object>`]()

Emitted when ready (Resolve DNS, Filter Bogon IP) to send ping after call [`ping.send()`](#pingsend).

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

<details><summary>Result (Console Output)</summary>

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

<details><summary>Result (Console Output)</summary>

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

- [`<Error>`]()
- `result` [`<Object>`]()

Emitted when an error occurs. `result` has last statement before error occurs and error code.

### `ping.send()`

Send ping. See some of examples in [Usage](#usage)

## Class: `pingus.PingTCP` Extends: [`pingus.Ping`](#class-pingusping)

Class for TCP ping.
<br>
`pingus.PingTCP` is type of [`pingus.Ping`](#class-pingusping)

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

See [`ping.send()`](#pingsend).
Some of examples in [Usage](#usage).

### `pingtcp.scan()`

Scan ports using TCP ping. Return result on Event: [`'result'`]().
See some of examples in [Usage](#usage).

## Class: `pingus.PingUDP` Extends: [`pingus.Ping`](#class-pingusping)

Class for UDP ping.<br>
`pingus.PingUDP` is type of [`pingus.Ping`](#class-pingusping)

### `new PingUDP(options)`

- `options` [`<Object>`]()
  - `host` [`<string>`]() Set target hostname (domain) or ip address.
  - `port` [`<number>`]() Set target port when using `pingudp.send()`. _Default: `68`_
  - `ports` [`<Array>`]() Set target ports when using `pingudp.scan()`.
  - `bytes` [`<number>`]() Set random bytes length when send on UDP ping socket connected. Ignored when `body` options set. _Default: `32`_
  - `body` [`<string>`]() Set body when send on UDP ping socket connected.
  - `timeout` [`<number>`]() Set timeout. _Default: `2000`_
  - `dnsResolve` [`<boolean>`]() Resolve DNS `A` and `AAAA` records when `host` is domain address. _Default: `true`_
  - `dnsServer` [`<string>`]() Set DNS server to resolve DNS records.
  - `filterBogon` [`<boolean>`]() [Filter bogon ip address](https://en.wikipedia.org/wiki/Bogon_filtering) in `host`. _Default: `true`_

### `pingudp.send()`

See [`ping.send()`](#pingsend).
Some of examples in [Usage](#usage).

### `pingudp.scan()`

Similar with [`pingtcp.scan()`](#pingtcpscan).<br>
Scan ports using UDP ping. Return result on Event: [`'result'`]().
See some of examples in [Usage](#usage).

## Class: `pingus.PingICMP` Extends: [`pingus.Ping`](#class-pingusping)

Class for ICMP ping.
<br>
`pingus.PingICMP` is type of [`pingus.Ping`](#class-pingusping)

### `new PingICMP(options)`

- `options` [`<Object>`]()
  - `host` [`<string>`]() Set target hostname (domain) or ip address.
  - `ttl` [`<number>`]() Set ttl. _Default: `128`_
  - `timeout` [`<number>`]() Set timeout. _Default: `2000`_
  - `dnsResolve` [`<boolean>`]() Resolve DNS `A` and `AAAA` records when `host` is domain address. _Default: `true`_
  - `dnsServer` [`<string>`]() Set DNS server to resolve DNS records.
  - `filterBogon` [`<boolean>`]() [Filter bogon ip address](https://en.wikipedia.org/wiki/Bogon_filtering) in `host`. _Default: `true`_

### `pingicmp.send()`

See [`ping.send()`](#pingsend).
Some of examples in [Usage](#usage).

### `pingicmp.traceroute()`

WIP

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

## Send Ping Styles

### Using [`Class`](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Classes) extends [`EventEmitter`](https://nodejs.org/docs/latest/api/events.html)

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

### Using [`Callback`](https://developer.mozilla.org/en-US/docs/Glossary/Callback_function)

```js
// TCP ping to localhost:80
pingus.tcp({ host: 'localhost' }, (err, result) => {
  if (err) {
    throw err;
  }
  console.log(result);
});
```

### Using [`Promise`](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Promise)

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

### Using [`async/await`](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Statements/async_function)

```js
// TCP ping to localhost:80
const result = await pingus.tcp({ host: 'localhost' });
console.log(result);
```

<details><summary>Result (Console Output)</summary>

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

## TCP Ping

```js
// TCP ping to localhost:22
new pingus.PingTCP({ host: 'localhost', port: 22 })
  .on('result', (result) => {
    console.log(result);
  })
  .on('error', (err, result) => {
    throw err;
  })
  .send();
```

<details><summary>Result (Console Output)</summary>

```js
{
  error: undefined,
  type: 'ping/tcp',
  status: 'open',
  host: 'localhost',
  ip: '127.0.0.1',
  ips: [ '127.0.0.1' ],
  time: 1,
  port: 22,
  name: 'ssh',
  banner: 'SSH-2.0-OpenSSH_8.9p1 Ubuntu-3'
}
```

## UDP Ping

```js
// UDP ping to localhost:19132
new pingus.PingUDP({ host: 'localhost', port: 19132 })
  .on('result', (result) => {
    console.log(result);
  })
  .on('error', (err, result) => {
    throw err;
  })
  .send();
```

<details><summary>Result (Console Output)</summary>

```js
{
  error: undefined,
  type: 'ping/udp',
  status: 'close',
  host: 'localhost',
  ip: '127.0.0.1',
  ips: [ '127.0.0.1' ],
  time: 2,
  port: 19132,
  name: 'minecraft-be'
}
```

</details>

## ICMP Ping

```js
// ICMP ping to example.com
new pingus.PingICMP({ host: 'example.com' })
  .on('result', (result) => {
    console.log(result);
  })
  .on('error', (err, result) => {
    throw err;
  })
  .send();
```

<details><summary>Result (Console Output)</summary>

```js
{
  error: undefined,
  type: 'ping/icmp',
  status: 'reply',
  host: 'example.com',
  ip: '93.184.216.34',
  ips: [ '93.184.216.34', '2606:2800:220:1:248:1893:25c8:1946' ],
  time: 122,
  ttl: 128,
  bytes: 8,
  reply: {
    source: '93.184.216.34',
    type: 0,
    code: 0,
    typestr: 'ECHO_REPLY',
    codestr: 'NO_CODE'
  }
}
```

</details>

```js
// ICMP ping to example.com using ttl = 10
new pingus.PingICMP({ host: 'example.com', ttl: 10 })
  .on('result', (result) => {
    console.log(result);
  })
  .on('error', (err, result) => {
    throw err;
  })
  .send();
```

<details><summary>Result (Console Output)</summary>

```js
{
  error: undefined,
  type: 'ping/icmp',
  status: 'exception',
  host: 'example.com',
  ip: '93.184.216.34',
  ips: [ '93.184.216.34', '2606:2800:220:1:248:1893:25c8:1946' ],
  time: 127,
  ttl: 10,
  bytes: 8,
  reply: {
    source: '152.195.76.133',
    type: 11,
    code: 0,
    typestr: 'TIME_EXCEEDED',
    codestr: 'NO_CODE'
  }

```

</details>

## Scan TCP Ports

```js
// TCP ping scan to localhost
new pingus.PingTCP({
  host: 'localhost',
  ports: [21, 22, 80, 443, 3306, 8080],
})
  .on('result', (result) => {
    console.log(result);
  })
  .on('error', (err, result) => {
    throw err;
  })
  .scan();
```

<details><summary>Result (Console Output)</summary>

```js
{
  error: undefined,
  type: 'ping/tcp/scan',
  status: 'finish',
  host: 'localhost',
  ip: '127.0.0.1',
  ips: [ '127.0.0.1' ],
  time: 2008,
  ports: [ 21, 22, 80, 443, 3306, 8080 ],
  statuses: {
    open: [ 22, 80, 8080 ],
    reset: [],
    close: [ 21, 443, 3306 ],
    filtered: [],
    error: []
  },
  names: {
    '21': 'ftp',
    '22': 'ssh',
    '80': 'http',
    '443': 'https',
    '3306': 'mysql',
    '8080': 'http-alt'
  },
  banners: { '22': 'SSH-2.0-OpenSSH_8.9p1 Ubuntu-3' },
  errors: {}
}
```

</details>

## Scan UDP Ports

```js
// UDP ping scan to localhost
new pingus.PingUDP({
  host: 'localhost',
  ports: [67, 68, 161, 162, 445],
})
  .on('result', (result) => {
    console.log(result);
  })
  .on('error', (err, result) => {
    throw err;
  })
  .scan();
```

<details><summary>Result (Console Output)</summary>

```js
{
  error: undefined,
  type: 'ping/udp/scan',
  status: 'finish',
  host: 'localhost',
  ip: '127.0.0.1',
  ips: [ '127.0.0.1' ],
  time: 2003,
  ports: [ 67, 68, 161, 162, 445 ],
  statuses: {
    open: [ 68 ],
    reset: [],
    close: [ 67, 161, 162, 445 ],
    filtered: [],
    error: []
  },
  names: {
    '67': 'bootps',
    '68': 'bootpc',
    '161': 'snmp',
    '162': 'snmptrap',
    '445': 'microsoft-ds'
  },
  banners: {},
  errors: {}
}
```

</details>
