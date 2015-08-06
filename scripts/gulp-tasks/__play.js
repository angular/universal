/// <reference path="../../typings/node/node.d.ts"/>
'use strict';

var gulp = require('gulp'),
  paths = gulp.paths,
  config = gulp.config,
  $ = require('gulp-load-plugins')();
  
//var express = require('express');
//var livereload = require('connect-livereload');
//var reloader = require('gulp-livereload');
var serveStatic = require('serve-index');
var serveIndex = require('serve-static');
//var exec = require('child_process').exec;
//var open = require('open');
//var server = express();
var livereloadport = 35729;
var serverport = 3000;
/*
var start = function(location) {
  server.listen(serverport);
  reloader.listen({
    port: livereloadport,
    reloadPage: location
  });
  open('http://localhost:3000' + location);
  
  exec('tsc -w');
  gulp.watch('dist/** /*', ['build']);
  gulp.watch('modules/examples/** /*', function () {
    reloader.reload();
  });
}
*/

// Run webserver to try out examples
/*gulp.task('play', function(){
  return start('/');
});
gulp.task('play.preboot', function(){
  return start('/preboot_basic/preboot.html');
});
*/
gulp.task('connect', function() {
  
  var app = require('connect')()
    .use(require('connect-livereload')({
      port: livereloadport
    }))
    .use('/', serveStatic('modules/examples'))
    .use('/', serveIndex('modules/examples'));
    
  require('http').createServer(app).listen(serverport).on('listening', function() {
    console.log('Started connect web server on http://localhost:' + serverport);
  });
});

gulp.task('watch', ['connect'], function() {
  $.livereload.listen();
  //exec('tsc -w');
  gulp.watch('dist/**/*', ['build']);
  gulp.watch('modules/examples/**/*').on('change', $.livereload.changed);
});

gulp.task('serve', ['watch'], function() {
  require('opn')('http://localhost:' + serverport + '/');
});

gulp.task('serve.preboot', ['watch'], function() {
  require('opn')('http://localhost:' + serverport + '/preboot_basic/preboot.html');
});