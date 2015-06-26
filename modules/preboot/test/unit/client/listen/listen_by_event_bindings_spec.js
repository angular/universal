/**
 * Author: Jeff Whelpley
 * Date: 6/6/15
 *
 *
 */
var name        = 'client/listen/listen_by_event_bindings';
var taste       = require('taste');
var strategy    = taste.target(name);
var dom         = require('../../../mock_dom');

describe('UNIT ' + name, function () {
    describe('walkDOM()', function () {
        it('should not do anything if no node passed in', function () {
            strategy.walkDOM();
        });

        it('should walk the DOM', function () {
            var spy = taste.spy();
            var node1 = {};
            var node2 = {};
            var node3 = {};
            var node4 = {};

            node1.firstChild = node2;
            node2.nextSibling = node3;
            node3.nextSibling = node4;

            strategy.walkDOM(node1, spy);
            spy.should.have.callCount(4);
        });
    });

    describe('addNodeEvents()', function () {
        it('should not do antyhing if no attrs', function () {
            strategy.addNodeEvents({});
        });

        it('should add events for a given node', function () {
            strategy.nodeEvents.splice(0, strategy.nodeEvents.length);

            var node = {
                attributes: [
                    { name: '(click)' },
                    { name: 'zoo' },
                    { name: 'on-foo' }
                ]
            };
            var expected = [
                { node: node, eventName: 'click' },
                { node: node, eventName: 'foo' }
            ];
            strategy.addNodeEvents(node);
            strategy.nodeEvents.should.deep.equal(expected);
        });
    });

    describe('getNodeEvents()', function () {
        it('should return nothing if nothing sent in', function () {
            dom.reset();

            var opts = { document: {}};
            var expected = [];
            var actual = strategy.getNodeEvents({}, opts);
            actual.should.deep.equal(expected);
        });
    });
});