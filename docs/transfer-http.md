## TransferHttpCacheModule

`TransferHttpCacheModule` installs an Http interceptor that avoids duplicate `HttpClient` GET requests
on the client, for requests that were already made when the application was rendered on the server
side.

When the module is installed in the application `NgModule`, it will intercept `HttpClient` requests
on the server and store the response in the `TransferState` key-value store. This is transferred to the client, which then uses it to respond to the same `HttpClient` requests on the client.

Any requests other than GET will prevent any further requests. You may alternatively use `BrowserTransferStateModule` to write your own behaviour for caching information.

### Usage

To use the `TransferHttpCacheModule`, first install it as part of the top-level App module.

```ts
import {TransferHttpCacheModule} from '@nguniversal/common';

@NgModule({
  imports: [
    BrowserModule.withServerTransition({appId: 'my-app'}),
    TransferHttpCacheModule,
  ],
  bootstrap: [MyApp]
})
export class AppBrowserModule() {}
```

Finally, in `main.ts` change this:

```ts
...

platformBrowserDynamic().bootstrapModule(AppBrowserModule);
```

To this:

```ts
...

document.addEventListener("DOMContentLoaded", () => {
  platformBrowserDynamic()
    .bootstrapModule(AppBrowserModule)
    .catch(err => console.log(err));
});
```
