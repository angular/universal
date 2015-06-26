/**
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * Listen by an explicit list of selectors mapped to a set of events
 */
var dom = require('../dom');

/**
 * Get all node events for a given set of selectors
 * @param strategy
 * @returns {Array}
 */
function getNodeEvents(strategy) {
    var nodeEvents = [];
    var eventsBySelector = strategy.eventsBySelector || {};
    var selectors = Object.keys(eventsBySelector);
    var selectorIdx, selector, elem, elems, i, j, events;

    // loop through selectors
    for (selectorIdx = 0; selectorIdx < selectors.length; selectorIdx++) {
        selector = selectors[selectorIdx];
        events = eventsBySelector[selector];
        elems = dom.getAllAppNodes(selector);

        // only do something if there are elements found
        if (elems) {

            // loop through elements
            for (i = 0; i < elems.length; i++) {
                elem = elems[i];

                // loop through events
                for (j = 0; j < events.length; j++) {
                    nodeEvents.push({
                        node:       elem,
                        eventName:  events[j]
                    });
                }
            }
        }
    }

    return nodeEvents;
}

module.exports = {
    getNodeEvents: getNodeEvents
};