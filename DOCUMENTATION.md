# Angular2 Universal Documentation

> Note this documentation is a living document (work in progress).

  - [Setting up Universal](#setup)
    - [with NodeJS & Express](#express)
    - with NodeJS & Hapi (coming soon)
    - with ASP.NET-Core (coming soon)
  - [** Migration Guide **  (for Universal apps using Angular RC4 < or lower)](#coc)



# <a name="setup"></a> Setting up Universal

------

## <a name="express"></a> NodeJS & Express integration

With Universal it's important to understand that we need to separate our platform logic based on the Browser & Server. So what do we need to make this happen?

Typically an Angular application will have 2 main files (`app.module.ts` & `main.ts`). `app.module.ts` that creates your **root** `NgModule`, and a `main.ts` file that "bootstraps" your module to the Browser Platform (via platformBrowserDynamic().bootstrapModule). Let's rename these we can easily spot the difference between them and the *similar* server files.

    // normally "main.module.ts" - this is where our Root "NgModule" is located
    main.browser.ts

    // normally "main.ts" - this is where you "bootstrap" to the BrowserPlatform 
    // (ie: platformBrowserDynamic().bootstrapModule(AppModule);)
    client.ts
    
> Note: Of course you can merge these files into one if you prefer! Simply calling `platformBrowserDynamic().bootstrapModule(AppModule);` at the bottom of your `main.browser.ts` NgModule file if you'd like!

For our Server-side, we're going to need 2 *similar* files, but for Node in our case. 

    // similar to our main.browser.ts file
    main.node.ts 

    // Our main Express file
    // similar to our client.ts
    server.ts 

So right now we have 4 main files:

    main.browser.ts  // NgModule (browser module)
    client.ts        // Browser bootstrap
    main.node.ts     // NgModule (server module)
    server.ts        // Node platform "serialize" 

---

### Example Application : Let's look into each one and see what we need to do to make them "Universal" 

#### `main.browser.ts`

> Notice this is how you'd normally create this file. There isn't anything "Universal" here.

```

// Angular Core Modules
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule, JsonpModule } from '@angular/http';
import { FormsModule }    from '@angular/forms';

// Browser Bootstrap Module
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

// Our Root Component
import { AppComponent } from './app';
// Our Root routing & routingProviders
import { routing, appRoutingProviders } from './app';

// Browser Container (aka Module)
@NgModule({
  bootstrap    : [ AppComponent ],
  declarations : [ AppComponent, LoginComponent ],
  imports : [
    // Standard imports
    BrowserModule,
    HttpModule,
    JsonpModule,
    FormsModule,

    // Our routing import
    routing
  ],
  providers: [
    appRoutingProviders
  ]
})
export class MainModule { }

export function main() {
  // Create our browser "platform"
  // & Bootstrap our NgModule/Container to it
  return platformBrowserDynamic().bootstrapModule(MainModule);
}
```

#### `client.ts`

> Notice here we're also not doing anything special, we're just firing off that `main` function 
> from main.browser.ts which bootstraps the applications root NgModule. 
> (Like we were saying, you could just combine these 2 files if you really wanted. 
> We're separating them to follow typical Angular separation of concerns here)

```
// Important - We need to polyfill the browser with a few things Universal needs
import '@angular/universal-polyfills/browser';

import { enableProdMode } from '@angular/core';
enableProdMode();

import { main as ngApp } from './main.browser';

ngApp().then(() => {
  console.log('Our app is bootstrapped in the browser! Boo ya');
});

```

---

Now for our Server-side Node files:

### `main.node.ts`

> Notice this looks very similar to the `main.browser.ts` we're used to.
> We're just creating an NgModule and in this case "serializing" it (not boostrapping it)

> **Important** 
> Within our NgModule's `imports : []` here, we pass in our Universals 
> **Configuration** within `NodeModule.withConfig({ /* config object */})`

```
// Angular Core Modules
import { NgModule } from '@angular/core';

// *** Universal imports ***
import {
  NodeModule,
  NodeHttpModule,
  NodeJsonpModule,
  // Node "platform" (think "platformBrowserDynamic" but for the server)
  platformDynamicNode 
} from '@angular/universal';

// Our Root Component
import { AppComponent } from './app';

// We want to export the entire main function to be called from Node
export function main(document, config?: any) {

  // Universal Container (aka Module)
  @NgModule({
    // These are identical to the Browser NgModule (in main.browser.ts)
    bootstrap    : [ AppComponent ],
    declarations : [ AppComponent ],

    // As opposed to the normal "BrowserModule, HttpModule, JsonpModule" imports
    // in our Browser NgModule (found in main.browser.ts)
    // Here we need to import Node specific modules for Universal
    imports: [

      /* Normal modules etc that you have from main.browser.ts */

      // NodeModule from "@angular/universal" allows us to provide
      // a config object

      NodeModule.withConfig({

        // Our "document" which we need to pass in from Node 
        // (first param of this main function)
        document: document,
        
        originUrl: 'http://localhost:3000',
        baseUrl: '/',
        requestUrl: '/',

        // Preboot [Transfer state between Server & Client]
        // More info can be found at: https://github.com/angular/preboot#options
        preboot: {
          appRoot : [ 'app' ], // selector(s) for app(s) on the page
          uglify  : true       // uglify preboot code
        }

      }),

      // Other important Modules for Universal
      NodeHttpModule, // Universal Http 
      NodeJsonpModule // Universal JSONP 

    ],

    providers: [
      /* whatever providers you normally would of provided */
    ]
  })
  class MainModule { }

  // -----------------------
  // On the browser:
  // platformBrowserDynamic().bootstrapModule(MainModule);
  // But in Node, we don't "bootstrap" our application, we want to Serialize it!

  return platformDynamicNode().serializeModule(MainModule, config);
  // serializeModule returns a promise 
  // (just like bootstrapModule on the browser does)
  
};


```

### `server.ts`

> Notice we have those polyfills again here, but this time for Node

```
// Universal polyfills required
import '@angular/universal-polyfills/node';

// -----------
// ** USUAL Express stuff** 

// Express & Node imports
import * as path from 'path';
import * as express from 'express';

// Angular 2
import { enableProdMode } from '@angular/core';
// enable prod for faster renders
enableProdMode();

const app = express();
const ROOT = path.join(path.resolve(__dirname, '..'));

// Serve static files
app.use(express.static(ROOT, { index: false }));

// ** END of Usual Express code

// -----------

// "main" contains the NgModule container/module for Universal
// returns a serialized document string
// We're simply renaming it here, name it whatever you'd like of course
import { main as ngApp } from './main.node';

// Routes with html5pushstate
app.get('/', function (req, res, next) {

  // We're providing our initial documents html here
  // This can be done many ways, this is just for an example
  var documentHtml = `<!doctype>
    <html lang="en">
    <head>
      <title>Angular 2 Universal Starter</title>
      <meta charset="UTF-8">
      <meta name="description" content="Angular 2 Universal">
      <meta name="keywords" content="Angular 2,Universal">
      <meta name="author" content="PatrickJS">

      <link rel="icon" href="data:;base64,iVBORw0KGgo=">

      <base href="/">
    <body>

      <!-- notice our main root app component here -->
      <app>
        Loading...
      </app>

      <!-- webpack browser bundle here - whatever you have it as -->
      <script src="dist/public/browser-bundle.js"></script>
    </body>
    </html>
  `;

  return ngApp(documentHtml).then(serializedHtmlApplication => {
    // "serializedHtmlApplication" is the serialized document string 
    // after being ran through Universal
    
    // Send the html as a response
    res.status(200).send(serializedHtmlApplication);
    next();
    return serializedHtmlApplication;
  });

});

// Spawn the server
app.listen(3000, () => {
  console.log('Listening on: http://localhost:3000');
});

```

There's a few things going on here, most are being done a little differently for examples sake.
But you can see that what we're doing is serializing the application through that exported 
"main" function within `main.node.ts` (which returns a Promise), the result of that promise is our 
serialize string Application that we can now serve to the browser.
    
------


** MORE TO COME **

...
...
...

...
...
...

    
# <a name="coc"></a> Migrating from Angular rc4 and prior

> Note: expressEngine is still in the works

Prior to rc5, there were no `NgModule`'s. You also passed a config object of type `ExpressEngineConfig` 
to `res.render('index', config);` 

#### - OLD - `main.node.ts`

```
export function ngApp(req, res) {
  let baseUrl = '/';
  let url = req.originalUrl || '/';

  let config: ExpressEngineConfig = {
    directives: [
      App
    ],
    platformProviders: [
      {provide: ORIGIN_URL, useValue: 'http://localhost:3000'},
      {provide: APP_BASE_HREF, useValue: baseUrl},
    ],
    providers: [
      {provide: REQUEST_URL, useValue: url},
      NODE_HTTP_PROVIDERS,
      provideRouter(routes),
      NODE_LOCATION_PROVIDERS
    ],
    async: true,
    preboot: false // { appRoot: 'app' } // your top level app component selector
  };

  res.render('index', config);
}
```

As you may of seen [above](#express), we now can create our `NgModule({})` like normal for the 
server, but we have a new object we pass into the `imports: []` Array.

#### - NEW - `main.node.ts`

```
// .... code 

@NgModule({
  imports: [

      /* Normal modules etc that you have from main.browser.ts */

      // NodeModule from "@angular/universal" allows us to provide
      // the config object

      NodeModule.withConfig({

        // Our "document" (index.html file) which we need to pass in from Node 
        document  : document,
        
        originUrl  : 'http://localhost:3000',
        baseUrl    : '/',
        requestUrl : '/',

        // Preboot [Transfer state between Server & Client]
        // More info can be found at: https://github.com/angular/preboot#options

        preboot    : {
          appRoot : ['app'],   // selector(s) for app(s) on the page
          uglify  : true       // uglify preboot code
        }

      }),

      // **** 
      // Other important Modules for Universal

      NodeHttpModule, // Universal Http 
      NodeJsonpModule // Universal JSONP 

      // ^^ These normally were just passed into `providers: []` Array
      // in the ExpressEngineConfig object previously

    ]
})
export class ServerModule {
  // Universal events can go here
  // TODO
}

```

This is one of the main differences between previous installments of Universal.
If you look above, you can see a more detailed example of how the rest of the root platform 
files should be arranged. `main.browser.ts` is completely normal, where `client.ts` simply has 
an import for the browser polyfills Universal requires.

Go to [Setting up Universal with NodeJS & Express](#express) for the complete details.

# ... More to come!