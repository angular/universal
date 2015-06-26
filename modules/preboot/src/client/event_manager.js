/**
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * Handling events on the client side
 */
var dom = require('./dom');
var state = {
    eventListeners: [],
    events: [],
    listening: false,
    activeNode: null
};

/**
 * For a given node, add an event listener based on the given attribute. The attribute
 * must match the Angular pattern for event handlers (i.e. either (event)='blah()' or
 * on-event='blah'
 *
 * @param strategy
 * @param node
 * @param eventName
 */
function getEventHandler(strategy, node, eventName) {
    return function (event) {

        // if we aren't listening anymore (i.e. bootstrap complete)
        // then don't capture any more events
        if (!state.listening) {
            return;
        }

        // we want to wait until client bootstraps so don't allow default action
        if (strategy.preventDefault) {
            event.preventDefault();
        }

        // if we want to raise an event that others can listen for
        if (strategy.dispatchEvent) {
            dom.dispatchGlobalEvent(strategy.dispatchEvent);
        }

        // if callback provided for a custom action when an event occurs
        if (strategy.action) {
            strategy.action(node, event, dom);
        }

        // when tracking focus keep a ref to the last active node
        if (strategy.trackFocus) {
            state.activeNode = (event.type === 'focusin') ? event.target : null;
        }

        //TODO: remove this hack after angularu presentation
        if (eventName === 'keyup' && event.which === 13 && node.attributes['(keyup.enter)']) {
            dom.dispatchGlobalEvent('PrebootFreeze');
        }

        // we will record events for later replay unless explicitly marked as doNotReplay
        if (!strategy.doNotReplay) {
            state.events.push({
                node:       node,
                event:      event,
                name:       eventName,
                time:       (new Date()).getTime()
            });
        }
    };
}

/**
 * Loop through node events and add listeners
 * @param nodeEvents
 * @param strategy
 */
function addEventListeners(nodeEvents, strategy) {
    for (var i = 0; i < nodeEvents.length; i++) {
        var nodeEvent = nodeEvents[i];
        var node = nodeEvent.node;
        var eventName = nodeEvent.eventName;
        var handler = getEventHandler(strategy, node, eventName);

        // add the actual event listener and keep a ref so we can remove the listener during cleanup
        node.addEventListener(eventName, handler);
        state.eventListeners.push({
            node:       node,
            name:       eventName,
            handler:    handler
        });
    }
}

/**
 * Add event handlers
 * @param opts
 */
function startListening(opts) {
    var listenStrategies = opts.listen || [];

    state.listening = true;
    for (var i = 0; i < listenStrategies.length; i++) {
        var strategy = listenStrategies[i];

        // we either use custom strategy or one from the listen dir
        var getNodeEvents = strategy.getNodeEvents ||
            require('./listen/listen_by_' + strategy.name + '.js').getNodeEvents;

        // get array of objs with 1 node and 1 event; add event listener for each
        var nodeEvents = getNodeEvents(strategy, dom);
        addEventListeners(nodeEvents, strategy, opts);
    }
}

/**
 * Loop through replay strategies and call replayEvents functions
 * @param opts
 * @param log
 */
function replayEvents(opts, log) {
    var replayStrategies = opts.replay || [];

    state.listening = false;
    for (var i = 0; i < replayStrategies.length; i++) {
        var strategy = replayStrategies[i];

        // we either use custom strategy or one from the listen dir
        var replayEvts = strategy.replayEvents ||
            require('./replay/replay_after_' + strategy.name + '.js').replayEvents;

        // get array of objs with 1 node and 1 event; add event listener for each
        state.events = replayEvts(state.events, strategy, log, dom);
    }

    // log any remaining events (if in debug mode)
    log(5, state.events);
}

/**
 * Go through all the event listeners and clean them up
 * by removing them from the given node (i.e. element)
 * @param opts
 */
function cleanup(opts) {
    var listener, node;

    // if we are setting focus and there is an active element, do it
    if (opts.focus && state.activeNode) {
        var activeClientNode = dom.findClientNode(state.activeNode);
        if (activeClientNode) {
            activeClientNode.focus();
        }
    }

    // cleanup the event listeners
    for (var i = 0; i < state.eventListeners.length; i++) {
        listener = state.eventListeners[i];
        node = listener.node;
        node.removeEventListener(listener.name, listener.handler);
    }

    // now remove the events
    state.events = [];
}

module.exports = {
    state: state,
    getEventHandler: getEventHandler,
    addEventListeners: addEventListeners,
    startListening: startListening,
    replayEvents: replayEvents,
    cleanup: cleanup
};