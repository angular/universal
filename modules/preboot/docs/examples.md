# Examples

Some examples of integrations to preboot

## Template

The play server template when you are inlining preboot client-side code may look like this:

```html
<html>
<head>
    <script>
        {{safe prebootClientCode}}
    </script>
</head>
<body>
    
</body>
</html>
```

Where the generated preboot code is inlined in the HEAD of the HTML document on the server.

## Express

```
var express     = require('express');
var exphbs      = require('express-handlebars');
var preboot     = require('preboot');
var Handlebars  = require('handlebars');

var hbs = expressHandlebars.create({
  defaultLayout: 'main',
  handlebars: Handlebars,
  helpers: {
    safe: function(val) {
      return new Handlebars.SafeString(val);
    }
  }
});

var app = express();
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

app.get('/', function (req, res) {
    var opts = {};  // see options section below
    
    preboot.getClientCode(opts)  // can pass callback to second param if you don't like promises
        .then(function (clientCode) {
            res.render('play', { prebootClientCode: clientCode });
        });
});

app.listen(3000);
```

## Hapi

```
var preboot = require('preboot');
var Hapi = require('hapi');
var server = new Hapi.Server();
var handlebars = require('handlebars');

handlebars.registerHelper('safe', function(val) {
    return new handlebars.SafeString(val);
});

server.views({
    engines:    { html: handlebars },
    path:       __dirname
});

server.connection({ port: 3000 });

server.route(
    method:     'GET',
    path:       '/',
    handler: function (request, reply) {
        var opts = {};  // see options section below

        preboot.getClientCode(opts)  // can pass callback to second param if you don't like promises
            .then(function (clientCode) {
                reply.view('play', { prebootClientCode: clientCode });
            });
    }
);
```

## Gulp

Although it is preferable to inline your preboot code for performance reasons, you
can build a file that you include as an external file ref. Here is an example of a 
Gulp task to do this:

```
var preboot = require('preboot');
var opts = {};  // see options section below

gulp.task('preboot', function () {
    return preboot.getClientCodeStream(opts)
        .pipe(gulp.dest('dist'));
});
```

The gulp task would output a client-side JavaScript file, preboot.js in dist that can 
then be referenced in your web page:

```
<script src="dist/preboot.js"></script>
```

## Angular 1

Work in progress, but will be using re-render replay strategy. Will be useful when combining your Angular 1.x app
with [Jangular](https://github.com/gethuman/jangular), [Angular Server](https://github.com/saymedia/angularjs-server)
or one of the headless browser solutions out there. Note, however, that preboot will not work as well if
your server rendering solution delivers a cached page that doesn't match up with the client rendered view. The more
different your client view is from your server view, the harder it is for preboot to figure out how to translate
an event from a particular server view element to its corresponding client view element.

## Angular 2

Work in progress, but update soon at [AngularU](https://angularu.com/ng/session/2015sf/angular-2-server-rendering).

This is a sample configuration that we are considering for Angular 2:

```
preboot.getClientCode({
    appRoot:     'app',          // selector for Angular root element
    replay:      'rerender',     // Angular will re-render the view
    freeze:      'spinner',      // show spinner w button click & freeze page
    focus:       true,           // maintain focus after re-rendering
    buffer:      true,           // client app will write to hidden div until bootstrap complete
    keyPress:    true,           // all keystrokes in text elements recorded
    buttonPress: true            // when button pressed, record and freeze page
});
```

## React

We need help putting together an example. If you are interested, please [contact me](https://twitter.com/jeffwhelpley).

Note, though, that since react keeps server rendered elements on the page, you can use the 'hydrate' replay
strategy which is faster and more accurate than the rerender strategy.

## Ember

We need help putting together an example. If you are interested, please [contact me](https://twitter.com/jeffwhelpley).

Note, though, that since react keeps server rendered elements on the page, you can use the 'hydrate' replay
strategy which is faster and more accurate than the rerender strategy.

## Listen Strategy

You can use one of the [listen strategies that comes with preboot](strategies.md#listen-strategies), 
but here is an example of a custom one:
 
```
preboot.getClientCode({
    listen: {
        
        // listen for 'click' events on all elements with a class of 'foo'
        getNodeEvents: function (strategy, dom) {
            var fooElems = dom.getAllAppNodes('.foo');
            return fooElems.map(function (fooElem) {
                return {
                    node:  fooElem,
                    event: 'click'
                };
            });
        },
        
        // for this strategy we won't replay but instead just do some custom action
        doNotReplay: true,
        
        // whenever 'foo' elements get a 'click' event, remove it and display a message
        action: function (node, event, dom) {
            dom.removeNode(node);
            alert('Removed!');
        }
    }
});
``` 

Note that you can have multipled strategies, so you can use an array of custom listen objects instead of just one.

## Replay Strategy

You can use one of the [replay strategies that comes with preboot](strategies.md#replay-strategies), 
but here is an example of a custom one:
 
```
preboot.getClientCode({
    replay: {
        
        // simply dispatch the events on the nodes in memory
        replayEvents: function (events, strategy, dom) {
            for (var i = 0; i < events.length; i++) {
                events[i].node.dispatchEvent(events[i].event);
            }
            
            return [];  // return any events that couldn't be replayed for whatever reason
        },
        
        // don't bother checking to see if the node is still in the DOM
        checkIfExists: false
    }
});
``` 

Note that you can have multipled strategies, so you can use an array of custom replay objects instead of just one.

## Freeze Strategy

You can use the [freeze strategy that comes with preboot](strategies.md#freeze-strategies), 
but here is an example of a custom one:
 
```
preboot.getClientCode({
    freeze: {
        
        //TODO: flush out this example...include dom in prep params
        
        prep: function (opts) {

        },
        
        cleanup: function () {
        
        }
    }
});
``` 

