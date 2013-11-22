/*global describe, it, beforeEach, afterEach*/
/*jshint expr:true, maxstatements:30 */

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
var BODY = 'data\ndata\ndata\nдата-дада●★☆♣♥✌\x01\x17';
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
    var oldPlatform = process.platform;

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
        process.platform === oldPlatform;
        if (process.env.REQUEST_AS_CURL_COVERAGE) {
            delete require.cache[require.resolve('../lib-cov/escapeCliCommand')];
        } else {
            delete require.cache[require.resolve('../lib/escapeCliCommand')];
        }
    });

    afterEach(function (done) {
        server.close();
        setTimeout(done, 20);
    });

    it('should be able to serialize http.request', function (done) {
        var req = httpRequest({
            hostname: HOSTNAME,
            port: PORT,
            path: PATH,
            method: 'POST'
        },
        BODY,
        function (error, response, expected) {
            expect(serializeRequest(req, BODY)).to.eql(expected);
            done();
        });
    });

    it('should be able to serialize http.request with empty body', function (done) {
        var req = httpRequest({
                hostname: HOSTNAME,
                port: PORT,
                path: PATH,
                method: 'GET'
            },
            null,
            function (error, response, expected) {
                expect(serializeRequest(req)).to.eql(expected);
                done();
            });
    });

    it('should be able to serialize PUT http.request', function (done) {
        var req = httpRequest({
                hostname: HOSTNAME,
                port: PORT,
                path: PATH,
                method: 'PUT'
            },
            null,
            function (error, response, expected) {
                expect(serializeRequest(req)).to.eql(expected);
                done();
            });
    });

    it('should be able to serialize empty request', function () {
        expect(serializeRequest()).to.eql('curl \'http://localhost\' --compressed');
    });

    it('should be able to serialize https request', function () {
        expect(serializeRequest({
            headers: {
                host: 'localhost:443'
            }
        })).to.eql('curl \'https://localhost:443\' --compressed');
    });

    it('should be able to serialize broken ClientRequest', function (done) {
        var req = new http.get('http://' + HOSTNAME + ':' + PORT + PATH, function () {
            delete req._header;
            expect(serializeRequest(req)).to.eql('curl \'http://localhost:54321/p/a/t/h?query=string\' --compressed');
            done();
        });
    });

    it('should be able to escape query for win32', function (done) {
        process.platform = 'win32';
        var req = httpRequest({
                hostname: HOSTNAME,
                port: PORT,
                path: PATH,
                method: 'POST'
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
            method: 'POST',
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
            method: 'POST',
            json: BODY_JSON
        },
        function (error, response, expected) {
            expect(serializeRequest(req.req, BODY_JSON)).to.eql(expected);
            done();
        });
    });
});
