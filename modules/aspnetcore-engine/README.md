# Angular & ASP.NET Core Engine

This is an ASP.NET Core Engine for running Angular Apps on the server for server side rendering.

---

# Usage

> Things have changed since the previous ASP.NET Core & Angular Universal useage. We're no longer using TagHelpers, but now invoking the **boot-server** file from the **Home Controller** *itself*, and passing all the data down to .NET.

Within our boot-server file, things haven't changed much, you still have your `createServerRenderer()` function that's being exported (this is what's called within the Node process) which is expecting a `Promise` to be returned.

Within that promise we simply call the ngAspnetCoreEngine itself, passing in our providers Array (here we give it the current `url` from the Server, and also our Root application, which in our case is just `<app></app>`).


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

# What about on the .NET side?

Previously, this was all done with TagHelpers and you passed in your boot-server file to it: `<app asp-prerender-module="dist/boot-server.js"></app>`, but this hindered us from getting the SEO benefits of prerendering.

Because .NET has control over the Html, using the ngAspnetCoreEngine, we're able to *pull out the important pieces*, and give them back to .NET to place them through out the View.

Below is how you can invoke the boot-server file which gets everything started:

> Hopefully in the future this will be cleaned up and less code as well.

### HomeController.cs

```csharp
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

using Microsoft.AspNetCore.SpaServices.Prerendering;
using Microsoft.AspNetCore.NodeServices;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http.Features;

namespace WebApplicationBasic.Controllers
{
    public class HomeController : Controller
    {
        public async Task<IActionResult> Index()
        {
            var nodeServices = Request.HttpContext.RequestServices.GetRequiredService<INodeServices>();
            var hostEnv = Request.HttpContext.RequestServices.GetRequiredService<IHostingEnvironment>();

            var applicationBasePath = hostEnv.ContentRootPath;
            var requestFeature = Request.HttpContext.Features.Get<IHttpRequestFeature>();
            var unencodedPathAndQuery = requestFeature.RawTarget;
            var unencodedAbsoluteUrl = $"{Request.Scheme}://{Request.Host}{unencodedPathAndQuery}";

            // Prerender / Serialize application (with Universal)
            var prerenderResult = await Prerenderer.RenderToString(
                "/",
                nodeServices,
                new JavaScriptModuleExport(applicationBasePath + "/ClientApp/dist/main-server"),
                unencodedAbsoluteUrl,
                unencodedPathAndQuery,
                null,
                30000,
                Request.PathBase.ToString()
            );

            // This is where everything is now spliced out, and given to .NET in pieces
            ViewData["SpaHtml"] = prerenderResult.Html;
            ViewData["Title"] = prerenderResult.Globals["title"];
            ViewData["Styles"] = prerenderResult.Globals["styles"];
            ViewData["Meta"] = prerenderResult.Globals["meta"];
            ViewData["Links"] = prerenderResult.Globals["links"];

            // Let's render that Home/Index view
            return View();
        }

        public IActionResult Error()
        {
            return View();
        }
    }
}
```

### Startup.cs : Make sure you add NodeServices to ConfigureServices:

```csharp
public void ConfigureServices(IServiceCollection services)
{
    // ... other things ...

    services.AddNodeServices(); // <--
}
```

# What updates do our Views need now?

Now we have a whole assortment of SEO goodness we can spread around our .NET application. Not only do we have our serialized Application in a String...

We also have `<title>`, `<meta>`, `<link>'s`, and our applications `<styles>`

In our _layout.cshtml, we're going to want to pass in our different `ViewData` pieces and place these where they needed to be.

> Notice `ViewData[]` sprinkled through out. These came from our Angular application, but it returned an entire HTML document, we want to build up our document ourselves so .NET handles it!

```html
<!DOCTYPE html>
<html>
    <head>
        <base href="/" />
        <!-- Title will be the one you set in your Angular application -->
        <title>@ViewData["Title"] - AspNET.Core Angular 2+ Universal starter</title>

        @Html.Raw(ViewData["Meta"]) <!-- <meta /> tags -->
        @Html.Raw(ViewData["Links"]) <!-- <link /> tags -->
        @Html.Raw(ViewData["Styles"]) <!-- <styles /> tags -->

    </head>
    <body>
        <!-- Our Home view will be rendered here -->
        @RenderBody() 
        @RenderSection("scripts", required: false)
    </body>
</html>
```

---

# Your Home View - where the App gets displayed:

You may have seen or used a TagHelper here in the past (that's where it used to invoke the Node process and everything), but now since we're doing everything 
in the **Controller**, we only need to grab our `ViewData["SpaHtml"]` and inject it!

This `SpaHtml` was set in our HomeController, and it's just a serialized string of your Angular application, but **only** the `<app>/* inside is all serialized */</app>` part, not the entire Html, since we split that up, and let .NET build out our Document.

```html
@Html.Raw(ViewData["SpaHtml"]) <!-- magic -->

<!-- here you probably have your webpack vendor & main files as well -->
<script src="~/dist/vendor.js" asp-append-version="true"></script>
@section scripts {
    <script src="~/dist/main-client.js" asp-append-version="true"></script>
}
```

---

# What happens after the App gets server rendered?

Well now, your Client-side Angular will take over, and you'll have a fully functioning SPA. (With all these great SEO benefits of being server-rendered) !

:sparkles:

--- 

## Bootstrap

> [TODO] : This needs to be explained further

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