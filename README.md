# request-as-curl
[![NPM Version](https://badge.fury.io/js/request-as-curl.png)]
(https://npmjs.org/package/request-as-curl)

[![Build Status](https://travis-ci.org/azproduction/node-request-as-curl.png?branch=master)]
(https://travis-ci.org/azproduction/node-request-as-curl)

[![Coverage Status](https://coveralls.io/repos/azproduction/node-request-as-curl/badge.png?branch=master)]
(https://coveralls.io/r/azproduction/node-request-as-curl)

[![Dependency Status](https://gemnasium.com/azproduction/request-as-curl.png)]
(https://gemnasium.com/azproduction/request-as-curl)

Serializes http.ClientRequest as curl(1) command string 

## Installation

`request-as-curl` can be installed using `npm`:

```
npm install request-as-curl
```

## Example

```js
var curlify = require('request-as-curl'),
    request = require('express'),
    data = {data: 'data'};

var req = request('http://google.com/', {method: 'POST', json: data}, function (error, response, expected) {
    // Note: req.req!
    curlify(req.req, data);
    // curl 'http://google.com' -H 'accept: application/json' -H 'content-type: application/json' -H 'connection: keep-alive' --data '{"data":"data"}' --compressed
});
```

```js
var curlify = require('request-as-curl'),
    app = require('express')();

app.get('/', function (req) {
    curlify(req);
    // curl 'http://localhost/pewpew' -H 'x-real-ip: 127.0.0.1' -H 'x-forwarded-for: 127.0.0.1' -H 'x-nginx-proxy: true' -H 'connection: close' -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:25.0) Gecko/20100101 Firefox/25.0' -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' -H 'accept-language: ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3' -H 'accept-encoding: gzip, deflate' -H 'cache-control: max-age=0' --compressed
});

app.listen();
```
