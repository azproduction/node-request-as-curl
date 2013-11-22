/*
 * Copyright (C) 2007, 2008 Apple Inc.  All rights reserved.
 * Copyright (C) 2008, 2009 Anthony Ricaud <rik@webkit.org>
 * Copyright (C) 2011 Google Inc. All rights reserved.
 * Copyright (C) 2013 Mikhail Davydov <i@azproduction.ru>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Computer, Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var url = require('url'),
    http = require('http'),
    ClientRequest  = http.ClientRequest,
    escapeString = require('./escapeCliCommand');

var reTextData = /^application\/(x-www-form-urlencoded|json)/,
    reHttps = /443$/;

/**
 *
 * @param {Object} request
 * @param {String} request.url
 * @param {String} request.method
 * @param {Object} request.headers
 * @param {String|Object} [request.body]
 * @return {Array}
 */
function getUrl(request) {
    var host = request.headers.host || 'localhost';
    var protocol = reHttps.test(host) ? 'https' : 'http';
    var path = request.url;

    var queryUrl = url.format({
        protocol: protocol,
        host: host
    }) + (path ? path : '');

    return [escapeString(queryUrl).replace(/[[{}\]]/g, '\\$&')];
}

/**
 *
 * @param {Object} request
 * @param {String} request.url
 * @param {String} request.method
 * @param {Object} request.headers
 * @param {String|Object} [request.body]
 * @return {Array}
 */
function getData(request) {
    var data = [];
    var requestContentType = request.headers['content-type'];
    var body = request.body;

    if (!body) {
        return data;
    }

    body = typeof body === 'object' ? JSON.stringify(body) : body;

    if (requestContentType && reTextData.test(requestContentType)) {
        data.push('--data');
    } else {
        data.push('--data-binary');
    }

    data.push(escapeString(body));

    return data;
}

/**
 *
 * @param {Object} request
 * @param {String} request.url
 * @param {String} request.method
 * @param {Object} request.headers
 * @param {String|Object} [request.body]
 * @param {Object} ignoredHeaders
 * @return {Array}
 */
function getHeaders(request, ignoredHeaders) {
    var headers = [];
    Object.keys(request.headers).forEach(function (headerName) {
        var headerValue = request.headers[headerName];
        // Translate SPDY v3 headers to HTTP headers.
        headerName = headerName.replace(/^:/, '');

        if (headerName.toLowerCase() in ignoredHeaders) {
            return;
        }
        headers.push('-H');
        headers.push(escapeString(headerName + ': ' + headerValue));
    });

    return headers;
}

function normalizeHeaders(request) {
    var requestHeaders;

    if (request instanceof ClientRequest) {
        // POST / HTTP/1.1\r\nHost: localhost:54321\r\nConnection: keep-alive\r\nTransfer-Encoding: chunked\r\n\r\n
        if (typeof request._header === 'string') {
            requestHeaders = request._header
                .split('\r\n')
                .slice(1, -2)
                .reduce(function (headers, headerString) {
                    var parts = headerString.split(':'),
                        header = parts.shift().trim().toLowerCase(),
                        value = parts.join(':').trim();

                    headers[header] = value;
                    return headers;
                }, {});
        } else {
            requestHeaders = request._headers;
        }
    } else {
        requestHeaders = request.headers;
    }
    return requestHeaders || {};
}

function normalizeUrl(request) {
    if (request instanceof ClientRequest) {
        return request.path;
    }

    return request.url;
}

function normalize(request, body) {
    request = request || {};

    return {
        method: request.method || 'GET',
        url: normalizeUrl(request),
        headers: normalizeHeaders(request),
        body: body
    };
}

/**
 *
 * @param {Object} request
 * @param {String} request.url
 * @param {String} request.method
 * @param {Object} request.headers
 * @param {String|Object} [request.body]
 *
 * @returns {string}
 */
function serializeHttpRequestAsCurl(request) {
    var command = ['curl'];
    // These headers are derived from URL (except 'version') and would be added by cURL anyway.
    var ignoredHeaders = {'host': 1, 'method': 1, 'path': 1, 'scheme': 1, 'version': 1};
    var inferredMethod = 'GET';

    // URL
    command = command.concat(getUrl(request));

    // DATA
    var data = getData(request);
    if (data.length) {
        inferredMethod = 'POST';
        ignoredHeaders['content-length'] = 1;
    }

    // METHOD
    if (request.method !== inferredMethod) {
        command.push('-X', request.method);
    }

    // HEADERS & DATA
    command = command.concat(getHeaders(request, ignoredHeaders))
        .concat(data)
        .concat('--compressed');

    return command.join(' ');
}

/**
 * Serializes http.ClientRequest as curl(1) command string
 *
 * @param {http.ClientRequest|http.IncomingMessage|*} request
 * @param {string|object} [body]
 *
 * @returns {string}
 */
module.exports = function (request, body) {
    return serializeHttpRequestAsCurl(normalize(request, body));
};

module.exports.serialize = serializeHttpRequestAsCurl;
