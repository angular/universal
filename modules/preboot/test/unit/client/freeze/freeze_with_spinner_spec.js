/**
 * Author: Jeff Whelpley
 * Date: 6/10/15
 *
 *
 */
var name        = 'client/freeze/freeze_with_spinner';
var taste       = require('taste');
var freeze      = taste.target(name);
var dom         = require('../../../mock_dom');

describe('UNIT ' + name, function () {
    describe('prep()', function () {
        it('should prep for freezing', function () {
            var newNode = dom.getMockNode();
            dom.reset({ createElement: newNode, appendChild: newNode });
            freeze.prep({});
            dom.state.body.appendChild.should.have.callCount(2);
            freeze.state.overlay.should.equal(newNode);
        });
    });

    describe('cleanup()', function () {
        it('should simply remove the nodes, overlay and spinner', function () {
            freeze.cleanup();
            taste.should.not.exist(freeze.state.overlay);
        });
    });
});