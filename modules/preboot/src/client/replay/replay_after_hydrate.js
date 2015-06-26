/**
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * This replay strategy assumes that the client did not blow away
 * the server generated HTML and that the elements in memory for
 * preboot can be used to replay the events.
 */
var dom = require('../dom');

/**
 * Replay the events by using the same nods already in memory
 * @param events
 * @param strategy
 * @returns {Array}
 */
function replayEvents(events, strategy) {
    var i, eventData, node, event;
    var remainingEvents = [];
    events = events || [];

    for (i = 0; i < events.length; i++) {
        eventData = events[i];
        event = eventData.event;
        node = eventData.node;

        // if we should check to see if the node exists in the DOM before dispatching
        // NOTE: this can be expensive so this option is false by default
        if (strategy.checkIfExists && !dom.appContains(node)) {
            remainingEvents.push(eventData);
        }
        else {
            node.dispatchEvent(event);
        }
    }

    return remainingEvents;
}

module.exports = {
    replayEvents: replayEvents
};