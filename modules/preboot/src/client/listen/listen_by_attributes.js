/**
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * This listen strategy will look for a specific attribute which contains all the elements
 * that a given element is listening to.
 */
var dom = require('../dom');

/**
 * Get all node events with Angular event bindings
 * @param strategy
 * @returns {Array}
 */
function getNodeEvents(strategy) {
    var attributeName = strategy.attributeName || 'preboot-events';
    var elems = dom.getAllAppNodes('[' + attributeName + ']');

    // if no elements found, return empty array since no node events
    if (!elems) { return []; }

    var nodeEvents = [];
    var i, j, elem, events;

    for (i = 0; i < elems.length; i++) {
        elem = elems[i];
        events = elem.getAttribute(attributeName).split(',');

        for (j = 0; j < events.length; j++) {
            nodeEvents.push({
                node:       elem,
                eventName:  events[j]
            });
        }
    }

    return nodeEvents;
}

module.exports = {
    getNodeEvents: getNodeEvents
};