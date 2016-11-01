var webpack = require('webpack');
var path = require('path');

module.exports = function(config) {
  config.target = 'node';
  config.entry =  {
    express: './src/server-express'
  },
  config.output.filename = 'server/[name]-bundle.js';
  config.output.library = 'universal';
  config.output.libraryTarget = 'commonjs2';

  config.externals = ignoreAlias(config);

  config.node = {
    global: true,
    __dirname: true,
    __filename: true,
    process: true,
    Buffer: true,
  };


  return config;
}

if (!Array.prototype.includes) {
  Array.prototype.includes = function(searchElement /*, fromIndex*/ ) {
    'use strict';
    var O = Object(this);
    var len = parseInt(O.length, 10) || 0;
    if (len === 0) {
      return false;
    }
    var n = parseInt(arguments[1], 10) || 0;
    var k;
    if (n >= 0) {
      k = n;
    } else {
      k = len + n;
      if (k < 0) {k = 0;}
    }
    var currentElement;
    while (k < len) {
      currentElement = O[k];
      if (searchElement === currentElement ||
        (searchElement !== searchElement && currentElement !== currentElement)) { // NaN !== NaN
        return true;
      }
      k++;
    }
    return false;
  };
}

function ignoreAlias (config, log) {
  if (!config) return;
  var aliass = [];
  if (Array.isArray(config)) {
    aliass = config
  } else if (('resolve' in config) && ('alias' in config.resolve)) {
    aliass = Object.keys(config.resolve.alias);
  }

  return function (context, request, cb) {
    if (aliass.includes(request)) {
      if (log) { console.log('resolve.alias', request); }
      return cb();
    }
    return checkExternal(context, request, cb);
  }
}

function checkExternal(context, request, cb) {
  // With AOT, ngfactory deep imports @angular/core/src/linker/ng_module_factory.js
  // The problem with deep imports in angular now is they use esmodules, so we need
  // to process this file and anything it depends on, so let's ensure anything @angular/
  // is processed as there are dependencies of @angular/common as well (possibly others)
  if (request.indexOf('@angular/') === 0) {
    return cb();
  }

  // Check node import
  if (!path.isAbsolute(request) && request.charAt(0) !== '.') {
    return cb(null, 'commonjs ' + request);
  }
  return cb();
}
