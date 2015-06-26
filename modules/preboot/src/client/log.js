/**
 * Author: Jeff Whelpley
 * Date: 6/19/15
 *
 * Logger for preboot that can be used when the debug
 * option is used. It will print out info about what
 * is happening during the preboot process
 */
function logOptions(opts) {
    console.log('preboot options are:');
    console.log(opts);
}

function logEvents(events) {
    console.log('preboot events captured are:');
    console.log(events);
}

function replaySuccess(serverNode, clientNode, event) {
    console.log('replaying:');
    console.log({
        serverNode: serverNode,
        clientNode: clientNode,
        event: event
    });
}

function missingClientNode(serverNode) {
    console.log('preboot could not find client node for:');
    console.log(serverNode);
}

function remainingEvents(events) {
    if (events && events.length) {
        console.log('the following events were not replayed:');
        console.log(events);
    }
}

var logMap = {
    '1': logOptions,
    '2': logEvents,
    '3': replaySuccess,
    '4': missingClientNode,
    '5': remainingEvents
};

function log() {
    if (!arguments.length) { return; }

    var id = arguments[0] + '';
    var fn = logMap[id];

    if (fn) {
        var args = arguments.length > 0 ? [].splice.call(arguments, 1) : [];
        fn.apply(null, args);
    }
}

module.exports = {
    log: log
};