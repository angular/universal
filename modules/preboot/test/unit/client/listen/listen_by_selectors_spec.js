/**
 * Author: Jeff Whelpley
 * Date: 6/6/15
 *
 *
 */
var name        = 'client/listen/listen_by_selectors';
var taste       = require('taste');
var strategy    = taste.target(name);
var dom         = require('../../../mock_dom');

describe('UNIT ' + name, function () {
    describe('getNodeEvents()', function () {
        it('should return nothing if nothing from query', function () {
            dom.reset();

            var config = {
                eventsBySelector: { 'div.blah': ['evt1', 'evt2'] }
            };

            var expected = [];
            var actual = strategy.getNodeEvents(config);
            actual.should.deep.equal(expected);
        });

        it('should return node events', function () {
            dom.reset({
                querySelectorAll: [
                    { name: 'one' }, { name: 'two' }
                ]
            });

            var config = {
                eventsBySelector: { 'div.blah': ['evt1', 'evt2'] }
            };
            var expected = [
                { node: { name: 'one' }, eventName: 'evt1' },
                { node: { name: 'one' }, eventName: 'evt2' },
                { node: { name: 'two' }, eventName: 'evt1' },
                { node: { name: 'two' }, eventName: 'evt2' }
            ];
            var actual = strategy.getNodeEvents(config);
            actual.should.deep.equal(expected);
        });
    });
});