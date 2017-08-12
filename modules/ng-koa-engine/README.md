# Angular Koa@2 Engine

This is an Custom Koa@2.x Engine for running Angular Apps on the server for server side rendering.

## Usage

`npm install @nguniversal/koa-engine --save`

To use it, set the engine and then route requests to it

```ts
import * as Koa from 'koa';
import { ngKoaEngine } from '@nguniversal/koa-engine';

const app = new Koa();

// Set the engine as a koa middleware
app.use(ngKoaEngine(path.join(__dirname, 'views'), {
    bootstrap: ServerAppModule
  })
);

app.get('/**/*', (ctx: Koa.Context, next: Function) => {
  app.render('../dist/index', {
    ctx,
  });
});
```

## Extra Providers

Extra Providers can be provided either on engine setup

```ts
app.use(ngKoaEngine(path.join(__dirname, 'views'), {
  bootstrap: ServerAppModule,
  providers: [
    ServerService
  ]
}));
```

## Advanced Usage

### Request based Bootstrap

The Bootstrap module as well as more providers can be passed on request

```ts
app.get('/**/*', (ctx: Koa.Context, next: Function) => {
  app.render('../dist/index', {
    ctx,
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

### Using a async try/catch

You can also use a catch to better handle your errors

```ts
app.get('/**/*', async (ctx: Koa.Context, next: Function) => {
  try {
    await app.render('../dist/index', {
      ctx
    });
  } catch (error) {
    ctx.status = 500;
    ctx.body = error.message;
  }
});
```
