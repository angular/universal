/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 6/5/15
 *
 * Used to generate client code on the server
 */
var Q           = require('q');
var _           = require('lodash');
var uglify      = require('gulp-uglify');
var insert      = require('gulp-insert');
var rename      = require('gulp-rename');
var source      = require('vinyl-source-stream');
var buffer      = require('vinyl-buffer');
var eventStream = require('event-stream');
var browserify  = require('browserify');

/* jshint camelcase: false */
var listenStrategies = { attributes: true, event_bindings: true, selectors: true };
var replayStrategies = { hydrate: true, rerender: true };
var freezeStrategies = { spinner: true };

// map of input opts to client code
var clientCodeCache = {};
var FUNC_START = 'START_FUNCTION_HERE';
var FUNC_STOP = 'STOP_FUNCTION_HERE';

/**
 * Stringify an object and include functions
 * @param obj
 */
function stringifyWithFunctions(obj) {
    var str = JSON.stringify(obj, function (key, value) {
        if (!!(value && value.constructor && value.call && value.apply)) {  // if function
            return FUNC_START + value.toString() + FUNC_STOP;
        }
        else {
            return value;
        }
    });

    // now we have to replace all the functions
    var startFuncIdx = str.indexOf(FUNC_START);
    var stopFuncIdx, fn;
    while (startFuncIdx >= 0) {
        stopFuncIdx = str.indexOf(FUNC_STOP);

        // pull string out
        fn = str.substring(startFuncIdx + FUNC_START.length, stopFuncIdx);
        fn = fn.replace(/\\n/g, '\n');

        str = str.substring(0, startFuncIdx - 1) + fn + str.substring(stopFuncIdx + FUNC_STOP.length + 1);
        startFuncIdx = str.indexOf(FUNC_START);
    }

    return str;
}

/**
 * Normalize options so user can enter shorthand and it is
 * expanded as appropriate for the client code
 *
 * @param opts
 * @returns {*|{}}
 */
function normalizeOptions(opts) {
    opts = opts || {};
    opts.pauseEvent = opts.pauseEvent || 'PrebootPause';
    opts.resumeEvent = opts.resumeEvent || 'PrebootResume';
    opts.freezeEvent = opts.freezeEvent || 'PrebootFreeze';

    // set default strategies
    opts.listen = opts.listen || [];
    opts.replay = opts.replay || [];

    // if strategies are strings turn them into arrays
    if (_.isString(opts.listen)) {
        opts.listen = [{ name: opts.listen }];
    }
    else if (!_.isArray(opts.listen)) {
        opts.listen = [opts.listen];
    }

    if (_.isString(opts.replay)) {
        opts.replay = [{ name: opts.replay }];
    }
    else if (!_.isArray(opts.replay)) {
        opts.replay = [opts.replay];
    }

    // loop through strategies and convert strings to objects
    opts.listen = opts.listen.map(function (val) {
        var strategy = _.isString(val) ? { name: val } : val;

        if ((!strategy.name || !listenStrategies[strategy.name]) && !strategy.getNodeEvents) {
            throw new Error('Every listen strategy must either have a valid name or implement getNodeEvents()');
        }

        return strategy;
    });
    opts.replay = opts.replay.map(function (val) {
        var strategy = _.isString(val) ? { name: val } : val;

        if ((!strategy.name || !replayStrategies[strategy.name]) && !strategy.replayEvents) {
            throw new Error('Every listen strategy must either have a valid name or implement getNodeEvents()');
        }

        return strategy;
    });

    if (opts.freeze) {
        if (_.isString(opts.freeze) && !freezeStrategies[opts.freeze]) {
            throw new Error('Invalid freeze option: ' + opts.freeze);
        }

        opts.freezeStyles = _.merge({
            overlay: {
                className:      'preboot-overlay',
                style: {
                    position:   'absolute',
                    display:    'none',
                    zIndex:     '9999999',
                    top:        '0',
                    left:       '0',
                    width:      '100%',
                    height:     '100%'
                }
            },
            spinner: {
                className:      'preboot-spinner',
                style: {
                    position:   'absolute',
                    display:    'none',
                    zIndex:     '99999999'
                }
            }
        }, opts.freezeStyles);
    }

    // if keypress, add strategy for capturing all keypress events
    if (opts.keyPress) {
        opts.listen.push({
            name: 'selectors',
            eventsBySelector: {
                'input[type="text"],textarea':   ['keypress', 'keyup', 'keydown']
            }
        });
    }

    if (opts.focus) {
        opts.listen.push({
            name: 'selectors',
            eventsBySelector: {
                'input[type="text"],textarea':   ['focusin', 'focusout']
            },
            trackFocus: true,
            doNotReplay: true
        });
    }

    if (opts.buttonPress) {
        opts.listen.push({
            name: 'selectors',
            preventDefault: true,
            eventsBySelector: {
                'input[type="submit"],button': ['click']
            },
            dispatchEvent: opts.freezeEvent
        });
    }

    // if we want to wait pause bootstrap completion while the user is typing
    if (opts.pauseOnTyping) {
        opts.listen.push({
            name: 'selectors',
            eventsBySelector: {
                'input[type="text"]':   ['focus'],
                'textarea':             ['focus']
            },
            doNotReplay: true,
            dispatchEvent: opts.pauseEvent
        });
        opts.listen.push({
            name: 'selectors',
            eventsBySelector: {
                'input[type="text"]':   ['blur'],
                'textarea':             ['blur']
            },
            doNotReplay: true,
            dispatchEvent: opts.resumeEvent
        });
    }

    return opts;
}

/**
 * Get the client code as a stream. The tricky parts here is how we
 * will only include the code in the final bundle that is actually
 * being referenced.
 *
 * @param opts See README for details
 * @returns {*}
 */
function getClientCodeStream(opts) {
    opts = normalizeOptions(opts);
    var listenStrategiesRequired = {};
    var replayStrategiesRequired = {};
    var freezeStrategiesRequired = {};

    // client code entry file
    var b = browserify({
        entries: [__dirname + '/../client/preboot_client.js'],
        standalone: 'preboot',
        basedir: __dirname + '../client',
        browserField: false
    });

    // add the listen strategy files to the bundle
    var i, strategy, name;
    for (i = 0; i < opts.listen.length; i++) {
        strategy = opts.listen[i];
        name = strategy.name;

        if (listenStrategies[name] && !listenStrategiesRequired[name]) {
            b.require(__dirname + '/../client/listen/listen_by_' + name + '.js',
                { expose: './listen/listen_by_' + name + '.js' });
            listenStrategiesRequired[name] = true;
        }
    }

    // add the replay strategy files to teh bundle
    for (i = 0; i < opts.replay.length; i++) {
        strategy = opts.replay[i];
        name = strategy.name;

        if (replayStrategies[name] && !replayStrategiesRequired[name]) {
            b.require(__dirname + '/../client/replay/replay_after_' + name + '.js',
                { expose: './replay/replay_after_' + name + '.js' });
            replayStrategiesRequired[name] = true;
        }
    }

    var freeze = opts.freeze;
    if (freeze && _.isString(freeze) && freezeStrategies[freeze] && !freezeStrategiesRequired[freeze]) {
        b.require(__dirname + '/../client/freeze/freeze_with_' + freeze + '.js',
            { expose: './freeze/freeze_with_' + freeze + '.js' });
        freezeStrategiesRequired[freeze] = true;
    }

    // remove the buffer code if we are not calling it
    if (!opts.buffer) {
        b.ignore('./src/client/buffer/buffer_manager.js');  // need to do relative from process.cwd()
    }

    if (!opts.debug) {
        b.ignore('./src/client/log.js');  // need to do relative from process.cwd()
    }

    var outputStream = b.bundle()
        .pipe(source('src/client/preboot_client.js'))
        .pipe(buffer())
        .pipe(insert.append('\n\npreboot.init(' + stringifyWithFunctions(opts) + ');\n\n'))
        .pipe(rename('preboot.js'));

    // uglify if the option is passed in
    return opts.uglify ? outputStream.pipe(uglify()) : outputStream;
}

/**
 * Get client code as a string
 * @param opts See README for details
 * @param done
 * @return Promise
 */
function getClientCode(opts, done) {
    var deferred = Q.defer();
    var clientCode = '';

    // check cache first
    var cacheKey = JSON.stringify(opts);
    if (clientCodeCache[cacheKey]) {
        return new Q(clientCodeCache[cacheKey]);
    }

    // get the client code
    getClientCodeStream(opts)
        .pipe(eventStream.map(function (file, cb) {
            clientCode += file.contents;
            cb(null, file);
        }))
        .on('error', function (err) {
            if (done) {
                done(err);
            }

            deferred.reject(err);
        })
        .on('end', function () {
            if (done) {
                done(null, clientCode);
            }

            clientCodeCache[cacheKey] = clientCode;
            deferred.resolve(clientCode);
        });

    return deferred.promise;
}

module.exports = {
    stringifyWithFunctions: stringifyWithFunctions,
    normalizeOptions: normalizeOptions,
    getClientCodeStream: getClientCodeStream,
    getClientCode: getClientCode
};