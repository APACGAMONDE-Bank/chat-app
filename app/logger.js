'use strict';

var log4js = require('log4js');
var config = require('../config');

// Setup logger
log4js.configure(config.LOG4JS_CONFIG, {});
var logger = log4js.getLogger('dev');

module.exports = logger;
