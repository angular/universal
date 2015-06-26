/**
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * This is the main entry point for the client side bootstrap library.
 * This will be browserified and then inlined in the head of an HTML
 * document along with a call to this module that passes in the
 * browser document object and all the options. See the
 * README for details on how this works
 */
var dom             = require('./dom');
var eventManager    = require('./event_manager');
var bufferManager   = require('./buffer/buffer_manager');
var log             = require('./log').log || function () {};

// in each client-side module, we store state in an object so we can mock
// it out during testing and easily reset it as necessary
var state = {
    canComplete: true,      // set to false if preboot paused through an event
    completeCalled: false,  // set to true once the completion event has been raised
    freeze: null,           // only used if freeze option is passed in
    opts: null,
    started: false
};

/**
 * Get a function to run once bootstrap has completed
 */
function done() {
    var opts = state.opts;

    log(2, eventManager.state.events);

    // track that complete has been called
    state.completeCalled = true;

    // if we can't complete (i.e. preboot paused), just return right away
    if (!state.canComplete) { return; }

    // else we can complete, so get started with events
    eventManager.replayEvents(opts, log);                   // replay events on client DOM
    if (opts.buffer) { bufferManager.switchBuffer(opts); }  // switch from server to client buffer
    if (opts.freeze) { state.freeze.cleanup(); }            // cleanup freeze divs like overlay
    eventManager.cleanup(opts);                             // cleanup event listeners
}

/**
 * Get function to run once window has loaded
 * @param opts
 * @returns {Function}
 */
function getOnLoadHandler(opts) {
    return function onLoad() {

        // re-initialize dom now that we have the body
        dom.init({ window: window });

        // make sure the app root is set
        dom.updateRoots(dom.getDocumentNode(opts.appRoot));

        // if we are buffering, need to switch around the divs
        if (opts.buffer) {
            bufferManager.prep(opts);
        }

        // if we could potentially freeze the UI, we need to prep (i.e. to add divs for overlay, etc.)
        if (opts.freeze) {
            state.freeze.prep(opts);
        }

        // start listening to events
        eventManager.startListening(opts);
    };
}

/**
 * Pause the completion process
 */
function pauseCompletion() {
    state.canComplete = false;
}

/**
 * Resume the completion process; if complete already called,
 * call it again right away.
 *
 * @returns {Function}
 */
function getResumeCompleteHandler() {
    return function onResume() {
        state.canComplete = true;

        if (state.completeCalled) {

            // using setTimeout to fix weird bug where err thrown on
            // serverRoot.remove() in buffer switch
            setTimeout(done, 10);
        }
    };
}

/**
 * Init preboot
 * @param opts
 */
function init(opts) {
    state.opts = opts;

    log(1, opts);

    // freeze strategy is used at this top level, so need to get ref
    state.freeze = (typeof opts.freeze === 'string') ?
        require('./freeze/freeze_with_' + opts.freeze + '.js') :
        opts.freeze;

    // set up handlers for different preboot lifecycle events
    dom.init({ window: window });
}

/**
 * Start preboot
 */
function start() {

    // we can only start once, so don't do anything if called multiple times
    if (state.started) { return; }

    // initialize the window
    dom.init({ window: window });

    // if body there, then run load handler right away, otherwise register for onLoad
    dom.state.body ?
        getOnLoadHandler(state.opts)() :
        dom.onLoad(getOnLoadHandler(state.opts));

    // set up other handlers
    dom.on(state.opts.pauseEvent, pauseCompletion);
    dom.on(state.opts.resumeEvent, getResumeCompleteHandler());
}

// only expose start
module.exports = {
    eventManager: eventManager,
    bufferManager: bufferManager,
    init: init,
    start: start,
    done: done
};
