# Angular & ASP.NET Core Engine

This is an ASP.NET Core Engine for running Angular Apps on the server for server side rendering.

---

## Usage

To use it, in your boot-server file, within your `createServerRenderer` function, call the `ngAspnetCoreEngine()` engine within a `new Promise()`.


```ts
// Polyfills
import 'es6-promise';
import 'es6-shim';
import 'reflect-metadata';
import 'zone.js';

import { enableProdMode } from '@angular/core';
import { INITIAL_CONFIG } from '@angular/platform-server';

import { createServerRenderer, RenderResult } from 'aspnet-prerendering';

// Grab the (Node) server-specific NgModule
import { AppServerModule } from './app/app.server.module';

// ***** The ASPNETCore Angular Engine *****
import { ngAspnetCoreEngine } from './aspnetcore-engine';
enableProdMode();

export default createServerRenderer(params => {

    // Platform-server provider configuration
    const providers = [{
        provide: INITIAL_CONFIG,
        useValue: {
            document: '<app></app>', // * Our Root application document
            url: params.url
        }
    }];

    return new Promise((resolve, reject) => {
        // *****
        ngAspnetCoreEngine(providers, AppServerModule).then(response => {
            resolve({ 
                html: response.html,
                globals: response.globals
            });
        })
        .catch(error => reject(error));

    });

});


```

## Bootstrap

The engine also calls the ngOnBootstrap lifecycle hook of the module being bootstrapped

```ts
@NgModule({
  bootstrap: [AppComponent]
})
export class ServerAppModule {
  // Make sure to define this an arrow function to keep the lexical scope
  ngOnBootstrap = () => {
      console.log('bootstrapped');
    }
}
```