/**
 * Author: Jeff Whelpley
 * Date: 6/10/15
 *
 * This is a wrapper for the DOM that is used by preboot. We do this
 * for a few reasons. It makes the other preboot code more simple,
 * makes things easier to test (i.e. just mock out the DOM) and it
 * centralizes our DOM related interactions so we can more easily
 * add fixes for different browser quirks
 */
var state = {};
var nodeCache = {};

/**
 * Initialize the DOM state based on input
 * @param opts
 */
function init(opts) {
    state.window = opts.window || state.window || {};
    state.document = opts.document || state.window.document || {};
    state.body = opts.body || state.document.body;
    state.appRoot = opts.appRoot || state.body;
    state.serverRoot = state.clientRoot = state.appRoot;
}

/**
 * Setter for app root
 * @param appRoot
 * @param serverRoot
 * @param clientRoot
 */
function updateRoots(appRoot, serverRoot, clientRoot) {
    state.appRoot       = appRoot;
    state.serverRoot    = serverRoot;
    state.clientRoot    = clientRoot;
}

/**
 * Get a node in the document
 * @param selector
 * @returns {Element}
 */
function getDocumentNode(selector) {
    return state.document.querySelector(selector);
}

/**
 * Get one app node
 * @param selector
 * @returns {Element}
 */
function getAppNode(selector) {
    return state.appRoot.querySelector(selector);
}

/**
 * Get all app nodes for a given selector
 * @param selector
 */
function getAllAppNodes(selector) {
    return state.appRoot.querySelectorAll(selector);
}

/**
 * Get all nodes under the client root
 * @param selector
 * @returns {*|NodeList}
 */
function getClientNodes(selector) {
    return state.clientRoot.querySelectorAll(selector);
}

/**
 * Add event listener at window level
 * @param handler
 */
function onLoad(handler) {
    state.window.addEventListener('load', handler);
}

/**
 * These are global events that get passed around. Currently
 * we use the document to do this.
 * @param eventName
 * @param handler
 */
function on(eventName, handler) {
    state.document.addEventListener(eventName, handler);
}

/**
 * Dispatch an event on the document
 * @param eventName
 */
function dispatchGlobalEvent(eventName) {
    state.document.dispatchEvent(new state.window.Event(eventName));
}

/**
 * Dispatch an event on a specific node
 * @param node
 * @param eventName
 */
function dispatchNodeEvent(node, eventName) {
    node.dispatchEvent(new state.window.Event(eventName));
}

/**
 * Check to see if the app contains a particular node
 * @param node
 * @returns boolean
 */
function appContains(node) {
    return state.appRoot.contains(node);
}

/**
 * Create a new element
 * @param type
 * @param className
 * @param styles
 */
function addNodeToBody(type, className, styles) {
    var elem = state.document.createElement(type);
    elem.className = className;

    if (styles) {
        for (var key in styles) {
            if (styles.hasOwnProperty(key)) {
                elem.style[key] = styles[key];
            }
        }
    }

    return state.body.appendChild(elem);
}

/**
 * Remove a node since we are done with it
 * @param node
 */
function removeNode(node) {
    node.remove ?
        node.remove() :
        node.style.display = 'none';
}

/**
 * Get a unique key for a node in the DOM
 * @param node
 * @param rootNode - Need to know how far up we go
 */
function getNodeKey(node, rootNode) {
    var ancestors = [];
    var temp = node;
    while (temp && temp !== rootNode) {
        ancestors.push(temp);
        temp = temp.parentNode;
    }

    // push the rootNode on the ancestors
    if (temp) {
        ancestors.push(temp);
    }

    // now go backwards starting from the root
    var key = node.nodeName;
    var len = ancestors.length;
    var i, j;

    for (i = (len - 1); i >= 0; i--) {
        temp = ancestors[i];

        //key += '_d' + (len - i);

        if (temp.childNodes && i > 0) {
            for (j = 0; j < temp.childNodes.length; j++) {
                if (temp.childNodes[j] === ancestors[i - 1]) {
                    key += '_s' + (j + 1);
                    break;
                }
            }
        }
    }

    return key;
}

/**
 * Given a node from the server rendered view, find the equivalent
 * node in the client rendered view.
 *
 * @param serverNode
 */
function findClientNode(serverNode) {

    // if nothing passed in, then no client node
    if (!serverNode) { return null; }

    // we use the string of the node to compare to the client node & as key in cache
    var serverNodeKey = getNodeKey(serverNode, state.serverRoot);

    // first check to see if we already mapped this node
    var nodes = nodeCache[serverNodeKey] || [];
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].serverNode === serverNode) {
            return nodes[i].clientNode;
        }
    }

    //TODO: improve this algorithm in the future so uses fuzzy logic (i.e. not necessarily perfect match)
    var selector = serverNode.tagName;
    var className = (serverNode.className || '').replace('ng-binding', '').trim();

    if (serverNode.id) {
        selector += '#' + serverNode.id;
    }
    else if (className) {
        selector += '.' + className.replace(/ /g, '.');
    }

    var clientNodes = getClientNodes(selector);
    for (i = 0; clientNodes && i < clientNodes.length; i++) {
        var clientNode = clientNodes[i];

        //TODO: this assumes a perfect match which isn't necessarily true
        if (getNodeKey(clientNode, state.clientRoot) === serverNodeKey) {

            // add the client/server node pair to the cache
            nodeCache[serverNodeKey] = nodeCache[serverNodeKey] || [];
            nodeCache[serverNodeKey].push({
                clientNode: clientNode,
                serverNode: serverNode
            });

            return clientNode;
        }
    }

    // if we get here it means we couldn't find the client node
    return null;
}

module.exports = {
    state: state,
    nodeCache: nodeCache,

    init: init,
    updateRoots: updateRoots,
    getDocumentNode: getDocumentNode,
    getAppNode: getAppNode,
    getAllAppNodes: getAllAppNodes,
    getClientNodes: getClientNodes,
    onLoad: onLoad,
    on: on,
    dispatchGlobalEvent: dispatchGlobalEvent,
    dispatchNodeEvent: dispatchNodeEvent,
    appContains: appContains,
    addNodeToBody: addNodeToBody,
    removeNode: removeNode,
    getNodeKey: getNodeKey,
    findClientNode: findClientNode
};