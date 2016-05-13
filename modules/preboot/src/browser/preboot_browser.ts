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
import {Element} from '../interfaces/element';
import {PrebootOptions} from '../interfaces/preboot_options';
import { addApp, on, onLoad, getApp, initAppRoot, updateAppRoots} from './app'
import {PrebootState, AppState} from './preboot_state';


let state = PrebootState;

/**
 * Once bootstrap has completed, we replay events,
 * switch buffer and then cleanup
 */
export function complete() {
  // preboot.log(2, eventManager.state.events);
  // complete per appRoot
  state.apps.forEach(app => {
    app.completeCalled = true; 
    if (app.canComplete){
      eventManager.replayEvents(null, app.opts);                 // replay events on browser DOM
      if (app.opts.buffer) { bufferManager.switchBuffer(null); } // switch from server to browser buffer
      if (app.opts.freeze) { app.freeze.cleanup(null); }       // cleanup freeze divs like overlay
      eventManager.cleanup(null, app.opts);                      // cleanup event listeners
    }
  })
}

/**
 * Get function to run once window has loaded
 */
function load() {
  state.apps.forEach(app => {
    // re-initialize each approot now that we have the body
    // grab the root element
    // var root = dom.getDocumentNode(opts.appRoot);
    // make sure the app root is set
    var root = dom.getDocumentNode(app.appRootName);
    initAppRoot(app, {window:window})
    updateAppRoots(app, root, root, root);
  
 
    // if we are buffering, need to switch around the divs
    if (app.opts.buffer) { bufferManager.prep(null); }

    // if we could potentially freeze the UI, we need to prep (i.e. to add divs for overlay, etc.)
    // note: will need to alter this logic when we have more than one freeze strategy
    if (app.opts.freeze) {
    app.freeze = app.opts.freeze.name === 'spinner' ? freezeSpin : app.opts.freeze;
    app.freeze.prep(null, app.opts);
 
    // start listening to events
    eventManager.startListening(null, app.opts);
  });
}

/**
 * Resume the completion process; if complete already called,
 * call it again right away
 */
function resume() {
  state.apps.forEach(app =>{
    app.canComplete = true; 
    if (app.completeCalled){
       // using setTimeout to fix weird bug where err thrown on
       // serverRoot.remove() in buffer switch
       setTimeout(complete, 10);
    }
  });
}

/**
 * Initialization is really simple. Just save the options and set
 * the window object. Most stuff happens with start()
 * *
 * To call multiple times like init('app1', {}), init('app2', {})
 */
export function init(appRoot:string, opts: PrebootOptions) {
   var app = addApp(appRoot, opts);
   initAppRoot(app, {window:window});  
}

/**
 * Start preboot by starting to record events
 */
export function start(appName?:string) {
  //let opts = state.opts;
  if (appName !== undefined){ startApp(getApp(appName)); }
  else { state.apps.forEach(app => { if (app.appRootName === appName) { startApp(app); }}) }
}

function startApp(app:AppState){
   // we can only start once, so don't do anything if called multiple times
   if (app.started) { return }
   
   initAppRoot(app, {window:window});
  
   onLoad(app, load)
   on(app, app.opts.pauseEvent, () => app.canComplete = false);
   on(app, app.opts.resumeEvent, resume);
   on(app, app.opts.completeEvent, complete);  
}
