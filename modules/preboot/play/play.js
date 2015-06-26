/**
 * Author: Jeff Whelpley
 * Date: 6/5/15
 *
 * This is for playing with the preload code
 */
var handlebars  = require('handlebars');
var Hapi        = require('hapi');
var server      = new Hapi.Server();
var preboot     = require('../src/server/preboot_server');
var generator   = require('../src/server/client_code_generator');

server.connection({ port: 3000 });

//// setup handlebars as the template engine
//handlebars.registerHelper('safe', function(val) {
//    return new handlebars.SafeString(val);
//});

server.views({
    engines:    { html: handlebars },
    path:       __dirname
});

// only one route
server.route({
    method:     'GET',
    path:       '/',

    handler: function (request, reply) {

        //NOTE: above commented out for now since we are relying on build to generate preboot
        // in future we would generate through the web and insert into the template

        reply.view('play');

        //var opts = {
        //    listen:         [{ name: 'attributes' }],
        //    replay:         [{ name: 'rerender' }],
        //    focus:          true,
        //    buffer:         false,
        //    keypress:       true,
        //    serverRoot:     'div.server',
        //    clientRoot:     'div.client',
        //};

        // generate the client code (NOTE: in prod would just generate this ahead of time)
        //preboot.getClientCode(opts)
        //    .then(function (clientCode) {
        //        reply.view('play', { prebootClientCode: clientCode });
        //    });

        // put this in head to test sending preboot client code in through template

        //reply.view('play', { prebootClientCode: generator.getPrebootOptions(opts) });

        // this would go in the template to display the
        //<script>
        //    {{safe prebootClientCode}}
        //</script>

    }
});

server.route({
    method:     'GET',
    path:       '/dist/{path*}',
    handler:    { directory: { path: './dist', listing: false, index: false } }
});

server.start(function () {
    console.log('Server running at:', server.info.uri);
});