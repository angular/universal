/**
 * Author: Jeff Whelpley
 * Date: 6/6/15
 *
 *
 */
var name        = 'client/buffer/buffer_manager';
var taste       = require('taste');
var bufferMgr   = taste.target(name);
var dom         = require('../../../mock_dom');

describe('UNIT ' + name, function () {
    describe('prep()', function () {
        it('should update the DOM roots with a new client root', function () {
            var client = { style: {} };
            dom.reset({ cloneNode: client });
            bufferMgr.prep();
            dom.state.clientRoot.should.equal(client);
            dom.state.serverRoot.parentNode.insertBefore.should.have.callCount(1);
        });
    });

    describe('switchBuffer()', function () {
        it('should switch the client and server roots', function () {
            dom.reset();
            dom.state.clientRoot = dom.getMockNode();

            bufferMgr.switchBuffer();
            dom.state.appRoot.should.equal(dom.state.clientRoot);
            taste.should.not.exist(dom.state.serverRoot);
        });
    });
});