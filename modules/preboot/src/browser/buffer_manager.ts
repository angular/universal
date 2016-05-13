/**
 * The purpose of this module is to manage the buffering of client rendered
 * HTML to a hidden div. After the client is fully bootstrapped, this module
 * would then be used to switch the hidden client div and the visible server div.
 * Note that this technique would only work if the app root is somewhere within
 * the body tag in the HTML document.
 */
import {PrebootRef, AppState} from '../interfaces/preboot_ref';
import * as app from './app'
import * as dom from './dom'

// expose state for testing purposes
export let state = { switched: false };

/**
 * Create a second div that will be the client root for an app
 */
export function prep(appstate:AppState) {

  // server root is the app root when we get started
  let serverRoot = appstate.appRoot;

  // client root is going to be a shallow clone of the server root
  let clientRoot = serverRoot.cloneNode(false);

  // client in the DOM, but not displayed until time for switch
  clientRoot.style.display = 'none';

  // insert the client root right before the server root
  serverRoot.parentNode.insertBefore(clientRoot, serverRoot);

  // update the dom manager to store the server and client roots (first param is appRoot)
  app.updateAppRoots(appstate, serverRoot, serverRoot, clientRoot);
}

/**
 * We want to simultaneously remove the server node from the DOM
 * and display the client node
 */
export function switchBuffer(appstate:AppState) {
  

  // get refs to the roots
  let clientRoot = appstate.clientRoot || appstate.appRoot;
  let serverRoot = appstate.serverRoot || appstate.appRoot;

  // don't do anything if already switched
  if (state.switched) { return; }

  // remove the server root if not same as client and not the body
  if (serverRoot !== clientRoot && serverRoot.nodeName !== 'BODY') {
    dom.removeNode(serverRoot);
  }

  // display the client
  clientRoot.style.display = 'block';

  // update the roots; first param is the new appRoot; serverRoot now null
   app.updateAppRoots(clientRoot, null, clientRoot);

  // finally mark state as switched
  state.switched = true;
}
