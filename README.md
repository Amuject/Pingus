# Pingus

> **Known Issue**
>
> _Currently Pingus not working in node version <= 20. This will be fixed with an update._

**A simple ping tool.
Supports TCP / UDP / ICMP protocol.**

<br>

Pingus can...

> _Send ICMP echo request & ttl traceroute.<br>
> Send ping, scan to TCP / UDP ports & banner grabbing.<br>
> Send magic packet (Wake on LAN) using UDP ping._

<br>

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
    - [`pingicmp.traceroute()`](#pingicmptraceroute)
  - [Using `Callback` or `Promise` (`async/await`)](#using-callback-or-promise-asyncawait)
    - [`pingus.tcp(options[, callback])`](#pingustcpoptions-callback)
    - [`pingus.tcpscan(options[, callback])`](#pingustcpscanoptions-callback)
    - [`pingus.udp(options[, callback])`](#pingusudpoptions-callback)
    - [`pingus.udpscan(options[, callback])`](#pingusudpscanoptions-callback)
    - [`pingus.wol(mac, options[, callback])`](#pinguswolmac-options-callback)
    - [`pingus.icmp(options[, callback])`](#pingusicmpoptions-callback)
    - [`pingus.traceroute(options[, callback])`](#pingusudpscanoptions-callback)
- [Usage](#usage)
  - [Use Pingus](#use-pingus)
  - [Send Ping Styles](#send-ping-styles)
  - [TCP Ping](#tcp-ping)
  - [Scan TCP Ports](#scan-tcp-ports)
  - [UDP Ping](#udp-ping)
  - [Scan UDP Ports](#scan-udp-ports)
  - [Wake on LAN](#wake-on-lan)
  - [ICMP Ping](#icmp-ping)
  - [Traceroute](#traceroute)

## Installation

```
npm i pingus
```

If an error occurs during installation, it may be due to the installation failure of the following packages.

- [raw-socket](https://www.npmjs.com/package/raw-socket)

It can be fixed by installing the GCC compiler.

- In Ubuntu:

  ```bash
  sudo apt-get install -y build-essential
  ```

- In Windows:

  Install [`Visual Studio`](https://visualstudio.microsoft.com/) including the `Desktop development with C++` workload.

## Simple Example

```js
// TCP Ping to localhost:22
import pingus from 'pingus'; // ESM, Typescript
const pingus = require('pingus'); // CJS

pingus.tcp({ host: 'localhost', port: 22 }).then(console.log);
```

```js
// Result
{
  type: 'ping/tcp',
  status: 'open',
  host: 'localhost',
  ip: IP { label: '127.0.0.1' },
  ips: [ IP { label: '127.0.0.1' } ],
  time: 2,
  port: 22,
  name: 'ssh',
  banner: 'SSH-2.0-OpenSSH_8.9p1 Ubuntu-3'
}
```

# API

## Class: `pingus.Ping`

`pingus.Ping` is [`EventEmitter`](https://nodejs.org/docs/latest/api/events.html) with the following events:

### Event: `'ready'`

- `result` [`<Object>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

Emitted when ready (Resolve DNS, Filter Bogon IP) to send ping after call [`ping.send()`](#pingsend).

```js
import pingus from 'pingus';

const ping = new pingus.PingTCP({
  host: 'example.com',
});
ping.on('result', (result) => {
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

- `result` [`<Object>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

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

```js
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

- [`<Error>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)
- `result` [`<Object>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

Emitted when an error occurs. `result` has last statement before error occurs and error code.

### `ping.send()`

Send ping. See some of examples in [Usage](#usage)

## Class: `pingus.PingTCP` Extends: [`pingus.Ping`](#class-pingusping)

Class for TCP ping.
<br>
`pingus.PingTCP` is type of [`pingus.Ping`](#class-pingusping)

### `new PingTCP(options)`

- `options` [`<Object>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)
  - `host` [`<string>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type) Set target hostname (domain) or ip address.
  - `port` [`<number>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#number_type) Set target port when using `pingtcp.send()`. _Default: `80`_
  - `ports` [`<Array>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)|[`<string>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type) Set target ports when using `pingtcp.scan()`. Use array of port numbers or query strings. See [example](#example-of-optionsports).
  - `timeout` [`<number>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#number_type) Set timeout. _Default: `2000`_
  - `resolveDNS` [`<boolean>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean) Resolve DNS `A` and `AAAA` records when `host` is domain address. _Default: `true`_
  - `dnsServer` [`<string>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type) Set DNS server to resolve DNS records.
  - `filterBogon` [`<boolean>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean) [Filter bogon ip address](https://en.wikipedia.org/wiki/Bogon_filtering) in `host`. _Default: `true`_

#### Example of `options.ports`

```js
ports: [21, 22, 80, 443]; // Scan port 21, 22, 80, 443
```

```js
ports: '21,22,80,443'; // Scan port 21, 22, 80, 443
```

```js
ports: '21-80'; // Scan ports in range 21 to 80 (21, 22, 23 ... 78, 79, 80)
```

```js
ports: '21-25,80,443'; // Scan ports in range 21 to 25 and 80, 443
```

```js
ports: '@'; // Scan most used 1024 ports in protocol
```

```js
ports: '*'; // Scan all ports (1 to 65535)
```

### `pingtcp.send()`

See [`ping.send()`](#pingsend).
Some of examples in [Usage](#usage).

### `pingtcp.scan()`

Scan ports using TCP ping. Return result on Event: [`'result'`](#event-result).
See some of examples in [Usage](#usage).

## Class: `pingus.PingUDP` Extends: [`pingus.Ping`](#class-pingusping)

Class for UDP ping.<br>
`pingus.PingUDP` is type of [`pingus.Ping`](#class-pingusping)

### `new PingUDP(options)`

- `options` [`<Object>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)
  - `host` [`<string>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type) Set target hostname (domain) or ip address.
  - `port` [`<number>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#number_type) Set target port when using `pingudp.send()`. _Default: `68`_
  - `ports` [`<Array>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)|[`<string>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type) Set target ports when using `pingudp.scan()`. Use array of port numbers or query strings. Same as PingTCP. See [example](#example-of-optionsports).
  - `buffer` [`<Buffer>`](https://nodejs.org/api/buffer.html) Set buffer when send on UDP ping socket connected.
  - `body` [`<string>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type) Set body when send on UDP ping socket connected. Ignored when `buffer` options set.
  - `bytes` [`<number>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#number_type) Set random bytes length when send on UDP ping socket connected. Ignored when `body` options set. _Default: `32`_
  - `timeout` [`<number>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#number_type) Set timeout. _Default: `2000`_
  - `resolveDNS` [`<boolean>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean) Resolve DNS `A` and `AAAA` records when `host` is domain address. _Default: `true`_
  - `dnsServer` [`<string>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type) Set DNS server to resolve DNS records.
  - `filterBogon` [`<boolean>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean) [Filter bogon ip address](https://en.wikipedia.org/wiki/Bogon_filtering) in `host`. _Default: `true`_

### `pingudp.send()`

See [`ping.send()`](#pingsend).
Some of examples in [Usage](#usage).

### `pingudp.scan()`

Similar with [`pingtcp.scan()`](#pingtcpscan).<br>
Scan ports using UDP ping. Return result on Event: [`'result'`](#event-result).
See some of examples in [Usage](#usage).

## Class: `pingus.PingICMP` Extends: [`pingus.Ping`](#class-pingusping)

Class for ICMP ping.
<br>
`pingus.PingICMP` is type of [`pingus.Ping`](#class-pingusping)

### `new PingICMP(options)`

- `options` [`<Object>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)
  - `host` [`<string>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type) Set target hostname (domain) or ip address.
  - `ttl` [`<number>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#number_type) Set ttl. _Default: `128`_
  - `ttln` [`<number>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#number_type) Set start ttl when using [`pingicmp.traceroute()`](#pingicmptraceroute). _Default: `1`_
  - `ttlx` [`<number>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#number_type) Set max ttl when using [`pingicmp.traceroute()`](#pingicmptraceroute). _Default: `64`_
  - `timeout` [`<number>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#number_type) Set timeout. _Default: `2000`_
  - `timeoutx` [`<number>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#number_type) Set max timeout-stack when using [`pingicmp.traceroute()`](#pingicmptraceroute). _Default: `8`_
  - `resolveDNS` [`<boolean>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean) Resolve DNS `A` and `AAAA` records when `host` is domain address. _Default: `true`_
  - `dnsServer` [`<string>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type) Set DNS server to resolve DNS records.
  - `filterBogon` [`<boolean>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean) [Filter bogon ip address](https://en.wikipedia.org/wiki/Bogon_filtering) in `host`. _Default: `true`_

### `pingicmp.send()`

See [`ping.send()`](#pingsend).
Some of examples in [Usage](#usage).

### `pingicmp.traceroute()`

Run traceroute.
Some of examples in [Usage](#usage).

## Using [`Callback`](https://developer.mozilla.org/en-US/docs/Glossary/Callback_function) or [`Promise`](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Promise) ([`async/await`](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Statements/async_function))

See examples in [Send Ping Styles](#send-ping-styles).

## `pingus.tcp(options[, callback])`

Send TCP ping.

## `pingus.tcpscan(options[, callback])`

Scan ports using TCP ping.

## `pingus.udp(options[, callback])`

Send UDP ping.

## `pingus.udpscan(options[, callback])`

Scan ports using UDP ping.

## `pingus.wol(mac, options[, callback])`

- `mac` [`<string>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type) Set target [MAC](https://en.wikipedia.org/wiki/MAC_address) address.
- `options` [`<Object>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) Same as options of [`new PingUDP(options)`](#new-pingudpoptions)

Send [magic packet](https://en.wikipedia.org/wiki/Wake-on-LAN#Magic_packet) UDP ping to use [WOL](https://en.wikipedia.org/wiki/Wake-on-LAN) feature.

## `pingus.icmp(options[, callback])`

Send ICMP ping.

## `pingus.traceroute(options[, callback])`

Run traceroute.

# Usage

## Use Pingus

ESM (TypeScript)

```js
import pingus from 'pingus';
```

CJS

```js
const pingus = require('pingus');
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
  type: 'ping/tcp',
  status: 'open',
  host: 'localhost',
  ip: IP { label: '127.0.0.1' },
  ips: [ IP { label: '127.0.0.1' } ],
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
  type: 'ping/tcp',
  status: 'open',
  host: 'localhost',
  ip: IP { label: '127.0.0.1' },
  ips: [ IP { label: '127.0.0.1' } ],
  time: 1,
  port: 22,
  name: 'ssh',
  banner: 'SSH-2.0-OpenSSH_8.9p1 Ubuntu-3'
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
  type: 'ping/tcp/scan',
  status: 'finish',
  host: 'localhost',
  ip: IP { label: '127.0.0.1' },
  ips: [ IP { label: '127.0.0.1' } ],
  time: 2009,
  port: 80,
  name: 'http',
  banner: '',
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
  type: 'ping/udp',
  status: 'close',
  host: 'localhost',
  ip: IP { label: '127.0.0.1' },
  ips: [ IP { label: '127.0.0.1' } ],
  time: 2,
  port: 19132,
  name: 'minecraft-be'
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
  ip: IP { label: '127.0.0.1' },
  ips: [ IP { label: '127.0.0.1' } ],
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

## Wake on LAN

```js
// Send magic packet using UDP ping to 00-00-00-00-00-00
pingus
  .wol('00-00-00-00-00-00')
  .then((result) => {
    console.log(result);
  })
  .catch((error) => {
    throw error;
  });
```

<details><summary>Result (Console Output)</summary>

```js
{
  type: 'ping/udp',
  status: 'open',
  host: '255.255.255.255',
  ip: IP { label: '255.255.255.255' },
  ips: [ IP { label: '255.255.255.255' } ],
  time: 2,
  port: 9,
  name: 'discard'
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
  type: 'ping/icmp',
  status: 'reply',
  host: 'example.com',
  ip: IP { label: '93.184.216.34' },
  ips: [
    IP { label: '93.184.216.34' },
    IP { label: '2606:2800:0220:0001:0248:1893:25c8:1946' }
  ],
  time: 130,
  ttl: 128,
  bytes: 32,
  reply: {
    source: '93.184.216.34',
    type: 0,
    code: 0,
    typestr: 'ECHO_REPLY',
    codestr: 'NO_CODE',
    body: '767284c4'
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
  type: 'ping/icmp',
  status: 'exception',
  host: 'example.com',
  ip: IP { label: '93.184.216.34' },
  ips: [
    IP { label: '93.184.216.34' },
    IP { label: '2606:2800:0220:0001:0248:1893:25c8:1946' }
  ],
  time: 133,
  ttl: 10,
  bytes: 32,
  reply: {
    source: '152.195.76.133',
    type: 11,
    code: 0,
    typestr: 'TIME_EXCEEDED',
    codestr: 'NO_CODE',
    body: ']8X"\b\x00CQ\x00\x00\x00\x00'
  }
}
```

</details>

## Traceroute

```js
// Traceroute to example.com
new pingus.PingICMP({ host: 'example.com', timeout: 500 })
  .on('result', (result) => {
    console.log(result);
  })
  .on('error', (err, result) => {
    throw err;
  })
  .traceroute();
```

<details><summary>Result (Console Output)</summary>

```js
{
  type: 'ping/icmp/traceroute',
  status: 'finish',
  host: 'example.com',
  ip: IP { label: '93.184.216.34' },
  ips: [
    IP { label: '93.184.216.34' },
    IP { label: '2606:2800:0220:0001:0248:1893:25c8:1946' }
  ],
  time: 1040,
  ttl: 128,
  bytes: 32,
  hops: [
    { status: 'time_exceeded', ip: '10.0.0.1', ttl: 1 },
    { status: 'time_exceeded', ip: '121.175.134.1', ttl: 2 },
    { status: 'time_exceeded', ip: '112.173.92.9', ttl: 3 },
    { status: 'time_exceeded', ip: '112.174.173.177', ttl: 4 },
    { status: 'timeout', ip: null, ttl: 5 },
    { status: 'time_exceeded', ip: '112.190.28.17', ttl: 6 },
    { status: 'time_exceeded', ip: '112.174.86.130', ttl: 7 },
    { status: 'time_exceeded', ip: '112.174.88.218', ttl: 8 },
    { status: 'time_exceeded', ip: '206.72.210.112', ttl: 9 },
    { status: 'time_exceeded', ip: '152.195.76.133', ttl: 10 },
    { status: 'reply', ip: '93.184.216.34', ttl: 11 }
  ]
}
```

</details>
