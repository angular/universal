# Angular Fastify Engine

This is a Fastify Engine for running Angular Apps on the server for server side rendering.

## Usage

`npm install @nguniversal/fastify-engine --save`

To use it, set the engine and then route requests to it

```ts
import { fastify } from 'fastify';
import { ngFastifyEngine } from '@nguniversal/fastify-engine';

const server = fastify();

server.get('*', (request, reply) => ngFastifyEngine({request, reply, bootstrap: ServerAppModule}));
```

## Configuring the URL and Document

It is possible to override the default URL and document fetched when the rendering engine
is called. To do so, simply pass in a `url` and/or `document` string to the renderer as follows:

```ts
server.get('*', (request, reply) => {
  const url = 'http://someurl.com';
  const document = '<html><head><title>New doc</title></head></html>';
  return ngFastifyEngine({
    url,
    document,
    request,
    reply,
  });
});
```

## Extra Providers

Extra Providers can be provided either on engine setup

```ts
const fastifyEngine = ngFastifyEngine({
  bootstrap: ServerAppModule,
  providers: [
    ServerService
  ]
});
```

## Advanced Usage

### Request based Bootstrap

The Bootstrap module as well as more providers can be passed on request

```ts
server.get('*', (request, reply) =>
  ngFastifyEngine({
    request,
    reply,
    bootstrap: OtherServerAppModule,
    providers: [
      OtherServerService
    ],
  })
);
```

### Using the Request and Reply

The Request and Reply objects are injected into the app via injection tokens.
You can access them by `@Inject`

```ts
import { FastifyRequest } from 'fastify';
import { REQUEST } from '@nguniversal/fastify-engine/tokens';

@Injectable()
export class RequestService {
  constructor(@Inject(REQUEST) private request: FastifyRequest) {}
}
```

If your app runs on the client side too, you will have to provide your own versions of these in the client app.
