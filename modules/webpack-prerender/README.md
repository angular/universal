# angular2-webpack-prerender

This webpack plugin is meant to be used together with a prerender entry file 
exporting two functions:
- `getBootloader`, which returns a Bootloader
- `serialize`, which takes a Bootloader and a template string

```
// ./src/prerender-entry-file.ts
import 'angular2-universal-polyfills';
import { provide } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { 
  REQUEST_URL, 
  ORIGIN_URL, 
  Bootloader, 
  BootloaderConfig, 
  AppConfig 
} from 'angular2-universal';
import { AppComponent } from './app/';

const bootloaderConfig: BootloaderConfig = {
  platformProviders: [
    provide(ORIGIN_URL, {
      useValue: 'http://localhost:4200' // full urls are needed for node xhr
    }),
    provide(APP_BASE_HREF, { useValue: '/' }),
  ],
  async: true,
  preboot: false
}

const appConfig: AppConfig = {
  directives: [
    // The component that will be pre-rendered
    AppComponent
  ],
  providers: [
    // What URL should Angular be treating the app as if navigating
    provide(REQUEST_URL, { useValue: '/' })
  ]
}

export function getBootloader() : Bootloader  {
  return new Bootloader(bootloaderConfig);
}

export function serialize(bootloader: Bootloader, template: string) : string {
  appConfig.template = template;
  return bootloader.serializeApplication(appConfig);
}
```

Then configure the plugin with the template you want to pre-render, the path
to your prerender entry file, and the path to your app files: 

```

plugins: [
  // (...)
  new PrerenderWebpackPlugin({
    templatePath: 'index.html',
    configPath: path.resolve(__dirname, './src/prerender-entry-file.ts'),
    appPath: path.resolve(__dirname, './src/') 
  })
]
```

Note: although this plugin does not have a dependency on `angular2-universal`,
the configuration file does. Make sure to install it.


