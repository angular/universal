/**
 * Author: Jeff Whelpley
 * Date: 6/4/15
 *
 * Unit testing generator server
 */
var name        = 'server/client_code_generator';
var taste       = require('taste');
var generator   = taste.target(name);

describe('UNIT ' + name, function () {
    describe('stringifyWithFunctions()', function () {
        it('should stringify basic object', function () {
            var obj = { blah: 'foo' };
            var expected = JSON.stringify(obj);
            var actual = generator.stringifyWithFunctions(obj);
            actual.should.equal(expected);
        });

        it('should stringify with functions', function () {
            var obj = { blah: 'foo', zoo: function (blah) {
                return blah + 1;
            }};
            var expected = '{"blah":"foo","zoo":function (';
            var actual = generator.stringifyWithFunctions(obj);
            actual.substring(0, 30).should.equal(expected);
        });
    });

    describe('normalizeOptions()', function () {
        it('should set defaults even if nothing passed in', function () {
            var expected = {
                pauseEvent: 'PrebootPause',
                resumeEvent: 'PrebootResume',
                freezeEvent: 'PrebootFreeze',
                listen: [],
                replay: []
            };
            var actual = generator.normalizeOptions();
            actual.should.deep.equal(expected);
        });
    });

    describe('getClientCodeStream()', function () {
        it('should return some client code by default', function () {
            return generator.getClientCodeStream();
        });
    });

    describe('getClientCode()', function () {
        it('should return some client code by default', function (done) {
            generator.getClientCode()
                .then(function (code) {
                    taste.should.exist(code);
                    done();
                })
                .catch(done);
        });
    });
});
