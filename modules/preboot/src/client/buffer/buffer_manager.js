/**
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * Manage the switching of buffers
 */
var dom = require('../dom');
var state = {
    switched: false
};

/**
 * Create a second div that will be the client root
 * for an app
 */
function prep() {

    // server root is the app root when we get started
    var serverRoot = dom.state.appRoot;

    // client root is going to be a shallow clone of the server root
    var clientRoot = serverRoot.cloneNode(false);

    // client in the DOM, but not displayed until time for switch
    clientRoot.style.display = 'none';

    // insert the client root right before the server root
    serverRoot.parentNode.insertBefore(clientRoot, serverRoot);

    // update the dom manager to store the server and client roots
    // first param is the appRoot
    dom.updateRoots(serverRoot, serverRoot, clientRoot);
}

/**
 * We want to simultaneously remove the server node from the DOM
 * and display the client node
 */
function switchBuffer() {

    // get refs to the roots
    var clientRoot = dom.state.clientRoot || dom.state.appRoot;
    var serverRoot = dom.state.serverRoot || dom.state.appRoot;

    // don't do anything if already switched
    if (state.switched) { return; }

    // remove the server root if not same as client and not the body
    if (serverRoot !== clientRoot && serverRoot.nodeName !== 'BODY') {
        serverRoot.remove ?
            serverRoot.remove() :
            serverRoot.style.display = 'none';
    }

    // display the client
    clientRoot.style.display = 'block';

    // update the roots; first param is the new appRoot; serverRoot now null
    dom.updateRoots(clientRoot, null, clientRoot);

    // finally mark state as switched
    state.switched = true;
}

module.exports = {
    state: state,
    prep: prep,
    switchBuffer: switchBuffer
};