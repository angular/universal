import * as fs from 'fs';
import * as TsHoek from './ts-hoek';

import {
  selectorRegExpFactory,
  Bootloader,
  BootloaderConfig
} from 'angular2-universal';

export interface HapiEngineExtraOptions {
  server?: boolean;
  client?: boolean;
  selector?: string;
  serializedCmp?: string;
  bootloader?: any;
  reuseProviders?: boolean;
}

export type HapiEngineConfig = BootloaderConfig & HapiEngineExtraOptions;


export var HAPI_PLATFORM = null;

export var HAPI_ANGULAR_APP = {
  template: null,
  directives: null,
  providers: null
};

export function disposeHapiPlatform() {
  if (HAPI_PLATFORM && HAPI_PLATFORM.dispose) {
    HAPI_PLATFORM.dispose();
  }
  HAPI_PLATFORM = null;
}

export function disposeHapiAngularApp() {
  HAPI_ANGULAR_APP = {
    template: null,
    directives: null,
    providers: null
  };
}

class Runtime {
  constructor(private options: HapiEngineConfig) {
  }
  render(template: string, context, done: Function) {
    context = TsHoek.applyToDefaults(context, this.options);

    // bootstrap and render component to string
    const _options = this.options;
    const _template = template || _options.template;
    const _directives = _options.directives;
    const _providers = _options.providers;
    if (!HAPI_PLATFORM) {
      disposeHapiPlatform();


      const _Bootloader = Bootloader;
      let _bootloader = _options.bootloader;
      if (_options.bootloader) {
        _bootloader = _Bootloader.create(_options.bootloader);
      } else {
        _options.template = _options.template || _template;
        _bootloader = _Bootloader.create(_options);
      }
      HAPI_PLATFORM = _bootloader;
    }
    HAPI_ANGULAR_APP.directives = _template;
    HAPI_ANGULAR_APP.directives = _directives;
    HAPI_ANGULAR_APP.providers = _options.reuseProviders !== true ? _providers : HAPI_ANGULAR_APP.providers;


    HAPI_PLATFORM.serializeApplication(HAPI_ANGULAR_APP)
      .then(html => {
        if (HAPI_PLATFORM.pendingDisposed) {
          disposeHapiPlatform();
        }
        done(null, this.buildClientScripts(html, context));
      })
      .catch(e => {
        console.error(e.stack);
        disposeHapiPlatform();
        // if server fail then return client html
        done(null, this.buildClientScripts(template, context));
      });
  }

  private bootstrapFunction(config: any): string {
    let systemConfig = (config && config.systemjs) || {};
    let url = systemConfig.componentUrl;
    return `
    <script>
      function bootstrap() {
        if (this.bootstraped) return;
        this.bootstraped = true;
        System.import("${ url }")
          .then(function(module) {
            return module.main();
          })
          .then(function() {
            preboot.complete();
            var $bootstrapButton = document.getElementById("bootstrapButton");
            if ($bootstrapButton) { $bootstrapButton.remove(); }
          });
      }
    </script>
  `;
  }


  // TODO: find better ways to configure the App initial state
  // to pay off this technical debt
  // currently checking for explicit values
  private buildClientScripts(html: string, options: any): string {
    if (!options || !options.buildClientScripts) { return html; }
    return html
      .replace(
        selectorRegExpFactory('preboot'),
        ((options.preboot === false) ? '' : this.prebootScript(options))
      )
      .replace(
        selectorRegExpFactory('angular'),
        ((options.angular === false) ? '' : this.angularScript(options))
      )
      .replace(
        selectorRegExpFactory('bootstrap'),
        ((options.bootstrap === false) ? (
          this.bootstrapButton +
          this.bootstrapFunction(options)
        ) : (
          (
            (options.client === undefined || options.server === undefined) ?
            '' : (options.client === false) ? '' : this.bootstrapButton
          ) +
          this.bootstrapFunction(options.componentUrl) +
          ((options.client === false) ? '' : this.bootstrapApp)
        ))
      );
  }

  private prebootScript(config: any): string {
    let baseUrl = (config && config.preboot && config.preboot.baseUrl) || '/preboot';
    return `
    <preboot>
      <link rel="stylesheet" type="text/css" href="${baseUrl}/preboot.css">
      <script src="${baseUrl}/preboot.js"></script>
      <script>preboot.start()</script>
    </preboot>
    `;
  }

  private angularScript(config: any): string {
    let systemConfig = (config && config.systemjs) || {};
    let baseUrl = systemConfig.nodeModules || '/node_modules';
    let newConfig = (<any>Object).assign({}, {
        baseURL: '/',
        defaultJSExtensions: true
      }, systemConfig);
    return `
    <!-- Browser polyfills -->
    <script src="${baseUrl}/zone.js/dist/zone.js"></script>
    <script src="${baseUrl}/reflect-metadata/Reflect.js"></script>
    <!-- SystemJS -->
    <script src="${baseUrl}/systemjs/dist/system.js"></script>
    <!-- Angular2: Bundle -->
    <script src="${baseUrl}/rxjs/bundles/Rx.umd.js"></script>
    <script src="${baseUrl}/@angular/core/core.umd.js"></script>
    <script src="${baseUrl}/@angular/common/common.umd.js"></script>
    <script src="${baseUrl}/@angular/compiler/compiler.umd.js"></script>
    <script src="${baseUrl}/@angular/platform-browser/platform-browser.umd.js"></script>
    <script src="${baseUrl}/@angular/platform-browser-dynamic/platform-browser-dynamic.umd.js"></script>
    <script src="${baseUrl}/@angular/router-deprecated/router-deprecated.umd.js"></script>
    <script src="${baseUrl}/@angular/http/http.umd.js"></script>
    <script type="text/javascript">
    System.config(${ JSON.stringify(newConfig) });
    </script>
    `;
  }

  private bootstrapButton: string = `
    <div id="bootstrapButton">
      <style>
       #bootstrapButton {
        z-index:999999999;
        position: absolute;
        background-color: rgb(255, 255, 255);
        padding: 0.5em;
        border-radius: 3px;
        border: 1px solid rgb(207, 206, 206);
       }
      </style>
      <button onclick="bootstrap()">
        Bootstrap Angular2 Client
      </button>
    </div>
  `;

  private bootstrapApp: string = `
    <script>
      setTimeout(function() {
        bootstrap();
      });
    </script>
  `;
}


export class hapiEngine {

  helpers: any;
  partials: any;

  constructor() {
    this.helpers = {};
    this.partials = {};
  }

  registerHelper(name, helper) {
    this.helpers[name] = helper;
  }

  registerPartial(name, partial) {
    this.partials[name] = partial;
  }

  compile(template, options, next) {
    var runtime = new Runtime(options);
    return next(null, (context, options, callback) => {
      return runtime.render(template, context, (_, html) => {
        return callback(_, html);
      });
    });
  }

}
