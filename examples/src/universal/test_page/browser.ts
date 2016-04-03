console.time('angular2/core in client');
import * as angular from 'angular2/core';
console.timeEnd('angular2/core in client');

import {BROWSER_PROVIDERS, BROWSER_APP_PROVIDERS} from 'angular2/platform/browser';
import {Http, HTTP_PROVIDERS} from 'angular2/http';

import 'rxjs/Rx';
//
import {BROWSER_HTTP_PROVIDERS} from 'angular2-universal-preview';

import {App, MyApp} from './app';

export function main() {
  var app = angular.platform(BROWSER_PROVIDERS)
    .application([
      BROWSER_APP_PROVIDERS,
      // HTTP_PROVIDERS,
      BROWSER_HTTP_PROVIDERS,
    ]);
  return Promise.all([
    app.bootstrap(App),
    // app.bootstrap(MyApp)
  ]);
}
