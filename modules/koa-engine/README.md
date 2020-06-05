# Angular Koa Engine

This is a Koa Engine for running Angular Apps on the server for server side rendering.

## Usage

`npm install @nguniversal/koa-engine --save`

To use it, set the engine and then route requests to it

```ts
import * as Koa from 'koa';
import { ngKoaEngine } from '@nguniversal/koa-engine';

const app = new Koa();

// Renderer function that will use the Universal engine to render a response
const render = ngKoaEngine({
  bootstrap: AppServerModule,
});

app.use(async ctx => {
  await render(indexPath, ctx);
});
```

## Configuring the URL and Document

It is possible to override the default URL and document fetched when the rendering engine
is called. To do so, simply pass in a `url` and/or `document` string to the renderer as follows:

```ts
app.use(async ctx => {
  const url = 'http://someurl.com';
  const document = '<html><head><title>New doc</title></head></html>';
  await render(indexPath, ctx, {
    document,
    url,
  });
});
```

## Extra Providers

Extra Providers can be provided either on engine setup

```ts
const render = ngKoaEngine({
  bootstrap: AppServerModule,
  providers: [
    ServerService
  ]
});
```

## Advanced Usage

### Request based Bootstrap

The Bootstrap module as well as more providers can be passed on request

```ts
app.use(async ctx => {
  await render(indexPath, ctx, {
    bootstrap: OtherServerAppModule,
    providers: [
      OtherServerService
    ]
  });
});
```

### Using the Request and Response

The Request and Response objects are injected into the app via injection tokens.
You can access them by @Inject

```ts
import { Request } from 'koa';
import { REQUEST } from '@nguniversal/koa-engine/tokens';

@Injectable()
export class RequestService {
  constructor(@Inject(REQUEST) private request: Request) {}
}
```

If your app runs on the client side too, you will have to provide your own versions of these in the client app.

### Using a Custom Callback

You can also use a try/catch to better handle your errors

```ts
app.use(async ctx => {
  try {
    await render(indexPath, ctx);
  } catch (error) {
    ctx.status = 500;
    ctx.body = error.message;
  }
});
```