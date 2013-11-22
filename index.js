module.exports = process.env.REQUEST_AS_CURL_COVERAGE ?
    require('./lib-cov') :
    require('./lib');
