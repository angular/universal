var NodeXhr = require('../../dist/modules/server/src/http_server.js').NodeXhr;

describe("HTTP Server", function() {
  describe("NodeXhr", function() {

    xit("should return an instance of httpServer", function() {

      var nodeXhr = new NodeXhr();

      expect(nodeXhr).toBe(NodeXhr);
    });

  });
});
