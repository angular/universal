import { NgModule, Component, Injectable } from '@angular/core';
import {
  UniversalModule,
  NodeHttpModule,
  NodeJsonpModule,
  platformUniversalDynamic
} from 'angular2-universal/node';

import { FormsModule } from '@angular/forms';

import { App, Wat } from './app';

declare var Zone: any;

@Component({
  selector: 'another-component',
  styles: [`
    h1 {
      background-color: red;
    }
  `],
  template: `
    <h1>SERVER-RENDERED</h1>
  `
})
class AnotherComponent {}

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}

@NgModule({
  bootstrap: [ App, AnotherComponent ],
  declarations: [ App, Wat, AnotherComponent ],
  imports: [
    UniversalModule,
    FormsModule
  ]
})
export class MainModule {
  ngOnInit() {
    console.log('ngOnInit');
  }
  // ngDoCheck() {
  //   console.log('ngDoCheck');
  //   return true;
  // }
  ngOnStable() {
    console.log('ngOnStable');
  }
  ngOnRendered() {
    console.log('ngOnRendered');
  }
}

export const platform = platformUniversalDynamic();
// platform.cacheModuleFactory(MainModule);

function getConfig(document) {
  return {
    document: document,
    ngModule: MainModule,
    originUrl: 'http://localhost:3000',
    baseUrl: '/',
    requestUrl: '/',
    // preboot: false,
    preboot: { appRoot: ['app'], uglify: true },
  }
}

export function main(document, config?: any) {
  var id = config && config.id || s4();
  var cancelHandler = () => false;
  if (config && ('cancelHandler' in config)) {
    cancelHandler = config.cancelHandler;
  }
  if (cancelHandler()) { return Promise.resolve(document); }


  var zone = Zone.current.fork({
    name: 'Universal',
    properties: getConfig(document)
  });

  // nodePlatform serialize
  return zone.run(() => platform.serializeModule(Zone.current.get('ngModule'), config))
    .then((html) => {
      // console.log('\n -- serializeModule FINISHED --');
      return html;
    })
    .catch(err => {
      console.error(err);
      return document;
    });
};
