/*global describe, it, beforeEach, afterEach*/
/*jshint expr:true*/

var serializeRequest = require('..'),
    express = require('express'),
    stringify = require('json-stringify-safe'),
    http = require('http'),
    url = require('url'),
    request = require('request'),
    expect = require('chai').expect;

var PORT = 54321;
var HOSTNAME = 'localhost';
var PATH = '/p/a/t/h?query=string';
var METHOD = 'POST';
var BODY = 'data\ndata\ndata';
var BODY_JSON = {
    pewpew: {
        ololo: []
    }
};

var httpRequest = function (options, content, cb) {
    var req = http.request(options, function (res) {
        res.setEncoding('utf8');

        var body = '';
        res.on('data', function (chunk) {
            body += chunk;
        });
        res.on('end', function () {
            cb(null, res, body);
        });
    });

    req.on('error', cb);

    if (content) {
        req.write(content);
    }
    req.end();

    return req;
};

describe('request-as-curl', function () {
    var app, server;
    beforeEach(function(done) {
        app = express();
        app.all('*', function (req, res) {
            var body = '';
            req.on('data', function (chunk) {
                body += chunk;
            });
            req.on('end', function () {
                res.send(serializeRequest(req, body));
            });
        });
        server = app.listen(PORT, function () {
            done();
        });
    });

    afterEach(function (done) {
        server.close();
        setTimeout(done, 0);
    });

    it('should be able to serialize http.request', function (done) {
        var req = httpRequest({
            hostname: HOSTNAME,
            port: PORT,
            path: PATH,
            method: METHOD
        },
        BODY,
        function (error, response, expected) {
            expect(serializeRequest(req, BODY)).to.eql(expected);
            done();
        });
    });

    it('should be able to serialize npm request module', function (done) {
        var req = request('http://' + HOSTNAME + ':' + PORT + PATH,
        {
            method: METHOD,
            body: BODY
        },
        function (error, response, expected) {
            expect(serializeRequest(req.req, BODY)).to.eql(expected);
            done();
        });
    });

    it('should be able to serialize npm request module with data json', function (done) {
        var req = request('http://' + HOSTNAME + ':' + PORT + PATH,
        {
            method: METHOD,
            json: BODY_JSON
        },
        function (error, response, expected) {
            expect(serializeRequest(req.req, BODY_JSON)).to.eql(expected);
            done();
        });
    });
});
