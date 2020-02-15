# Angular Universal Socket Engine

Framework and Platform agnostic Angular Universal rendering.

## Setup the Socket Server

To get started setting up a socket server, you should first follow the steps descriped [Angular Universal Guide](https://angular.io/guide/universal), which guides you through the setup of a node express web server.

After following the guide your app should now have a structure, similar to this:

- app
|-- src
|-- |-- app
    |-- |-- app.module.ts
        |-- **app.server.module.ts**
        |-- ..
    |-- main.ts
    |-- **main.server.ts**
|-- **server.ts**
|-- tsconfig.app.json
|-- tsconfig.json
|-- **tsconfig.server.json**

To switch from the node express server implementation to the socket engine implementation you first need to install two additional dependencies. 

`npm install @nguniversal/socket-engine @nguniversal/common --save`

Now replace the **server.ts** node express implementation, with the following code:

```js
const socketEngine = require('@nguniversal/socket-engine');

// * NOTE :: leave this as require() since this file is built Dynamically from webpack
const {AppServerModule} = require('./src/main.server');

if (AppServerModule === undefined) {
  throw new Error('Unable to load the AppServerModule. Please make sure, you have setup the "main.server.ts" entry point correctly.');
}

const port: number = parseInt(process.env.NODEPORT, 10) || 9090;
console.log('Starting the socket-server on port: ' + port);
socketEngine.startSocketEngine(AppServerModule, [], 'localhost', port);
```
This will start the socket engine which internally hosts a TCP Socket server.  
The default port is `9090` and host of `localhost`.

## Compile your app

After everything is setup, it's time to compile the app. You can simply run

`npm run build:ssr && npm run serve:ssr`

`npm run build:ssr` is a shortcut for running `ng build --prod && ng run app:server:production`, which first compiles the normal browser app and then compiles the server app, based on that output.

`npm run serve:ssr` is a shortcut for running `node dist/app/server/main.js`. 

## Notes for Localization (i18n)

If you're using the [--localize](https://angular.io/guide/i18n) option while building your app, you might not be able to use the `npm run serve:ssr` shortcut, since the compiler generates one main.js bundle for each language you compile (the compiled server app might be located in `node dist/app/server/de-DE/main.js` for example).

Furthermore, you need to be aware that you need enable localization for the compilation of the browser app AND the server app. You can do that by using the `--localize` flag or by setting `"localize": true"` in the in your `angular.json` file (within the `options` namespace).

## Usage Client

Your client can be whatever language, framework or platform you like.  
As long as it can connect to a TCP Socket (which all frameworks can) then you're good to go.

This example will use JS for simplicity
```typescript
import * as net from 'net';

const client = net.createConnection(9090, 'localhost', () => {
  console.log('connected to SSR server');
});

client.on('data', data => {
  const res = JSON.parse(data.toString()) as SocketEngineResponse;
  expect(res.id).toEqual(1);
  expect(res.html).toEqual(template);
  server.close();
  done();
});

const renderOptions = {id: 1, url: '/path', document: '<app-root></app-root>'} as SocketEngineRenderOptions;
client.write(JSON.stringify(renderOptions));
```
