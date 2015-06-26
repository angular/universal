/**
 * Author: Jeff Whelpley
 * Date: 6/10/15
 *
 *
 */
var dom     = require('../src/client/dom');
var taste   = require('taste');

/**
 * Get a mock node
 * @param returns
 */
function getMockNode(returns) {
    returns = returns || {};

    return {
        querySelector:      taste.stub().returns(returns.querySelector),
        querySelectorAll:   taste.stub().returns(returns.querySelectorAll),
        addEventListener:   taste.spy(),
        dispatchEvent:      taste.spy(),
        contains:           taste.stub().returns(returns.contains),
        createElement:      taste.stub().returns(returns.createElement),
        appendChild:        taste.stub().returns(returns.appendChild),
        remove:             taste.spy(),
        cloneNode:          taste.stub().returns(returns.cloneNode),
        style: {
            display:        returns.display
        },
        parentNode: {
            insertBefore:   taste.spy()
        }
    };
}

/**
 * Reset the dom with mock values
 * @param returns
 */
function reset(returns) {
    var node = getMockNode(returns);

    dom.init({
        window:     node,
        document:   node,
        body:       node,
        appRoot:    node,
        clientRoot: node,
        serverRoot: node
    })
}

module.exports = {
    state: dom.state,
    getMockNode: getMockNode,
    reset: reset
};