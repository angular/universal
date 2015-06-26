/**
 * Author: Jeff Whelpley
 * Date: 6/2/15
 *
 * Main node.js interface to the preboot library. This can be used
 * either by a command line build tool or server side code in order
 * to generate the client side preboot JS that should be inserted
 * inline into a script tag in the HEAD section of an HTML document.
 */
var clientCodeGenerator = require('./client_code_generator');

// functions exposed as API to the preboot library when required by node
module.exports = {
    getClientCodeStream: clientCodeGenerator.getClientCodeStream,
    getClientCode: clientCodeGenerator.getClientCode
};