/**
 * Author: Jeff Whelpley
 * Date: 2/25/14
 *
 * Build tasks for preboot. Most tasks either come from the
 * batter library or in the build directory in this project.
 *
 * From batter:
 *                      lint        Will run jshint over code
 *                      test        Run server side unit tests
 *                      watch       If change, will run lint
 *                      clean       Clear out dist folder
 *
 * From build dir:
 *                      test.karma  Will run karma tests
 *                      play        Run webserver with livereload for playing with example code
 *                      build       Build the client side code into the dist folder
 */
var gulp    = require('gulp');
var taste   = require('taste');
var batter  = require('batter');

batter.whip(gulp, taste, {
    targetDir: __dirname + '/src',
    unitTargetCode: 'src/**/*.js'
});