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

function escapeStringWin(str) {
    /* Replace quote by double quote (but not by \') because it is
     recognized by both cmd.exe and MS Crt arguments parser.

     Replace % by '%' because it could be expanded to an environment
     variable value. So %% becomes '%''%'. Even if an env variable ''
     (2 doublequotes) is declared, the cmd.exe will not
     substitute it with its value.

     Replace each backslash with double backslash to make sure
     MS Crt arguments parser won't collapse them.

     Replace new line outside of quotes since cmd.exe doesn't let
     to do it inside.
     */
    return "\"" + str.replace(/"/g, "\"\"")
        .replace(/%/g, "\"%\"")
        .replace(/\\/g, "\\\\")
        .replace(/[\r\n]+/g, "\"^$&\"") + "\"";
}

function escapeCharacter(x) {
    var code = x.charCodeAt(0);
    if (code < 256) {
        // Add leading zero when needed to not care about the next character.
        return code < 16 ? "\\x0" + code.toString(16) : "\\x" + code.toString(16);
    }
    code = code.toString(16);
    return "\\u" + ("0000" + code).substr(code.length, 4);
}

function escapeStringPosix(str) {
    if (/[^\x20-\x7E]|\'/.test(str)) {
        // Use ANSI-C quoting syntax.
        return "$\'" + str.replace(/\\/g, "\\\\")
            .replace(/\'/g, "\\\'")
            .replace(/\n/g, "\\n")
            .replace(/\r/g, "\\r")
            .replace(/[^\x20-\x7E]/g, escapeCharacter) + "'";
    } else {
        // Use single quote syntax.
        return "'" + str + "'";
    }
}

// cURL command expected to run on the same platform that DevTools run
// (it may be different from the inspected page platform).
module.exports = function (str) {
    return (process.platform === 'win32' ? escapeStringWin : escapeStringPosix)(str);
};
