/**
 * Author: Jeff Whelpley
 * Date: 6/9/15
 *
 * Freeze by showing a spinner
 */
var dom = require('../dom');
var eventManager = require('../event_manager');

var state = {
    overlay: null,
    spinner: null
};

/**
 * Create the overlay and spinner nodes
 * @param opts
 */
function prep(opts) {
    var freezeStyles = opts.freezeStyles || {};
    var overlayStyles = freezeStyles.overlay || {};
    var spinnerStyles = freezeStyles.spinner || {};

    // add the overlay and spinner to the end of the body
    state.overlay = dom.addNodeToBody('div', overlayStyles.className, overlayStyles.style);
    state.spinner = dom.addNodeToBody('div', spinnerStyles.className, spinnerStyles.style);

    // when a freeze event occurs, show the overlay and spinner
    dom.on(opts.freezeEvent, function () {
        var activeNode = eventManager.state.activeNode;
        if (activeNode) {
            state.spinner.style.top = activeNode.offsetTop;
            state.spinner.style.left = activeNode.offsetLeft;

            if (!opts.noOverlayBlur) {
                activeNode.blur();
            }
        }

        state.overlay.style.display = 'block';
        state.spinner.style.display = 'block';

        setTimeout(function () {
            if (state.overlay) {
                state.overlay.style.display = 'none';
            }
            if (state.spinner) {
                state.spinner.style.display = 'none';
            }
        }, 4000);
    });
}

/**
 * Remove the overlay and spinner
 */
function cleanup() {
    dom.removeNode(state.overlay);
    dom.removeNode(state.spinner);

    state.overlay = null;
    state.spinner = null;
}

module.exports = {
    state: state,
    prep: prep,
    cleanup: cleanup
};