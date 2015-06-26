/**
 * Author: Jeff Whelpley
 * Date: 5/1/15
 *
 * This is so we can play with the preboot code with a webserver
 */
var nodemon     = require('nodemon');
var livereload  = require('gulp-livereload');

module.exports = function (gulp, opts) {
    var shouldLiveReload = opts.livereload && opts.livereload === 'true';

    return function () {
        if (shouldLiveReload) {
            livereload.listen();
        }

        nodemon({
            script: __dirname + '/../play/play.js',
            watch:  ['src', 'dist', 'play']
        })
            .on('restart', function () {
                if (shouldLiveReload) {
                    setTimeout(function () {
                        livereload.reload();
                    }, 2000);
                }
            });

        gulp.watch(['play/play.html'], function () {
            nodemon.restart();
        });

        gulp.watch(['src/**/*.js', 'build/*.js'], ['build']);
    };
};