/**
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * This replay strategy assumes that the client completely re-rendered
 * the page so reboot will need to find the element in the new client
 * rendered DOM that matches the element it has in memory.
 */
var dom = require('../dom');

/**
 * Loop through all events and replay each by trying to find a node
 * that most closely resembles the original.
 *
 * @param events
 * @param strategy
 * @param log
 * @returns {Array}
 */
function replayEvents(events, strategy, log) {
    var i, eventData, serverNode, clientNode, event;
    var remainingEvents = [];
    events = events || [];

    // loop through the events, find the appropriate client node and dispatch the event
    for (i = 0; i < events.length; i++) {
        eventData = events[i];
        event = eventData.event;
        serverNode = eventData.node;
        clientNode = dom.findClientNode(serverNode);

        if (clientNode) {
            clientNode.value = serverNode.value;  // need to explicitly set value since keypress events won't transfer
            clientNode.dispatchEvent(event);
            log(3, serverNode, clientNode, event);
        }
        else {
            log(4, serverNode);
            remainingEvents.push(eventData);
        }
    }

    return remainingEvents;
}

module.exports = {
    replayEvents: replayEvents
};