/**
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * Listen by Angular event binding within the HTML document. This strategy
 * involves walking the DOM to find any on-*="" or ()="" attributes.
 */
var dom             = require('../dom');
var eventPattern    = /^(on\-.*)|(\(.*\))$/;
var nodeEvents      = [];

/**
 * This is from Crockford to walk the DOM (http://whlp.ly/1Ii6YbR)
 *
 * @param node The current node (to do entire document, pass in document.body)
 * @param func Function called for each node in the tree
 */
function walkDOM(node, func) {
    if (!node) { return; }

    func(node);
    node = node.firstChild;
    while (node) {
        walkDOM(node, func);
        node = node.nextSibling;
    }
}

/**
 * Check a node to see if there is an event to be handled
 * @param node
 */
function addNodeEvents(node) {
    var attrs = node.attributes;
    var attr, name;

    if (attrs) {
        for (var i = 0; i < attrs.length; i++) {
            attr = attrs[i];
            name = attr.name;

            // if attribute name doesn't match Angular event handlers, don't do anything
            if (eventPattern.test(name)) {

                // extract event name from the () or on- (TODO: replace this w regex)
                name = name.charAt(0) === '(' ?
                    name.substring(1, name.length - 1) :    // remove parenthesis
                    name.substring(3);                      // remove on-

                nodeEvents.push({
                    node:       node,
                    eventName:  name
                });
            }
        }
    }
}

/**
 * Walk the DOM adding listeners for each node that has the pattern
 */
function getNodeEvents() {
    nodeEvents.splice(0, nodeEvents.length);
    walkDOM(dom.state.body, addNodeEvents);
    return nodeEvents;
}

// only getNodeEvents called by event_manager, but other fns exposed for testing purposes
module.exports = {
    nodeEvents: nodeEvents,
    walkDOM: walkDOM,
    addNodeEvents: addNodeEvents,
    getNodeEvents: getNodeEvents
};