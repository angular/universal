/**
 * This is the main entry point for preboot on the browser.
 * The primary methods are:
 *    init() - called automatically to initialize preboot according to options
 *    start() - when preboot should start listening to events
 *    done() - when preboot should start replaying events
 */
import * as dom from './dom';
import * as eventManager from './event_manager';
import * as bufferManager from './buffer_manager';
import * as logManager from './log';
import * as freezeSpin from './freeze/freeze_with_spinner';
import {PrebootOptions} from '../interfaces/preboot_options';
import {PrebootState, addAppState, getAppState} from './preboot_state';

// this is an impl of PrebootRef which can be passed into other client modules
// so they don't have to directly ref dom or log. this used so that users can
// write plugin strategies which get this object as an input param.
// note that log is defined this way because browserify can blank it out.
/* tslint:disable:no-empty */
let preboot = {
  appRoots:[],
  log: logManager.log || function () {}
};

let state = PrebootState;

/**
 * Once bootstrap has completed, we replay events,
 * switch buffer and then cleanup
 */
export function complete() {
  preboot.log(2, eventManager.state.events);
  // complete per appRoot
  state.opts.appRoot.forEach(appRoot => {
    let appstate = getAppState(appRoot);
    appstate.completeCalled = true; 
    if (appstate.canComplete){
      eventManager.replayEvents(preboot, state.opts);                 // replay events on browser DOM
      if (state.opts.buffer) { bufferManager.switchBuffer(preboot); } // switch from server to browser buffer
      if (state.opts.freeze) { state.freeze.cleanup(preboot); }       // cleanup freeze divs like overlay
      eventManager.cleanup(preboot, state.opts);                      // cleanup event listeners
    }
  })
}

/**
 * Get function to run once window has loaded
 */
function load() {
  let opts = state.opts;

  state.opts.appRoot.forEach(appRoot => {
    // re-initialize each approot now that we have the body
    // grab the root element
    // var root = dom.getDocumentNode(opts.appRoot);
    // make sure the app root is set
    var root = dom.getDocumentNode(appRoot);
    preboot.appRoots.push(dom.init_appRoot(appRoot, {window:window}).updateRoots(root, root, root));
  })
 
  // if we are buffering, need to switch around the divs
  if (opts.buffer) { bufferManager.prep(preboot); }

  // if we could potentially freeze the UI, we need to prep (i.e. to add divs for overlay, etc.)
  // note: will need to alter this logic when we have more than one freeze strategy
  if (opts.freeze) {
    state.freeze = opts.freeze.name === 'spinner' ? freezeSpin : opts.freeze;
    state.freeze.prep(preboot, opts);
  }

  // start listening to events
  eventManager.startListening(preboot, opts);
}

/**
 * Resume the completion process; if complete already called,
 * call it again right away
 */
function resume() {
  state.opts.appRoot.forEach(appRoot =>{
    let appstate = getAppState(appRoot);
    appstate.canComplete = true; 
    if (appstate.completeCalled){
       // using setTimeout to fix weird bug where err thrown on
       // serverRoot.remove() in buffer switch
       setTimeout(complete, 10);
    }
  });
}

/**
 * Initialization is really simple. Just save the options and set
 * the window object. Most stuff happens with start()
 */
export function init(opts: PrebootOptions) {
    state.opts = opts;
    preboot.log(1, opts);
    state.opts.appRoot.forEach(appRoot => {
      preboot.appRoots.push(dom.init_appRoot(appRoot, {window:window}))
    }); 
}

/**
 * Start preboot by starting to record events
 */
export function start() {
  let opts = state.opts;

  // we can only start once, so don't do anything if called multiple times
  if (state.started) { return; }

  state.opts.appRoot.forEach(appRoot => {
      var appRootEl = dom.init_appRoot(appRoot, {window:window});
      preboot.appRoots.push(appRootEl)
      appRootEl.onLoad(load)
      appRootEl.on(opts.pauseEvent, () => getAppState(appRoot).canComplete = false);
      appRootEl.on(opts.resumeEvent, resume);
      appRootEl.on(opts.completeEvent, complete);
  }); 
}
