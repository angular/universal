/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Type, NgModuleFactory, CompilerFactory, Compiler } from '@angular/core';
import { platformDynamicServer } from '@angular/platform-server';
import { DOCUMENT } from '@angular/common';
import { ResourceLoader } from '@angular/compiler';

import { REQUEST, ORIGIN_URL } from './tokens';
import { FileLoader } from './file-loader';
import { IEngineOptions } from './interfaces/engine-options';
import { IEngineRenderResult } from './interfaces/engine-render-result';
import { renderModuleFactory } from './platform-server-utils';

/* @internal */
export class UniversalData {
  appNode = '';
  title = '';
  scripts = '';
  styles = '';
  meta = '';
  links = '';
}

/* @internal */
let appSelector = 'app-root'; // default

/* @internal */
function _getUniversalData(doc: Document): UniversalData {

  const STYLES: string[] = [];
  const SCRIPTS: string[] = [];
  const META: string[] = [];
  const LINKS: string[] = [];

  for (let i = 0; i < doc.head.children.length; i++) {
    const element = doc.head.children[i];
    const tagName = element.tagName.toUpperCase();

    switch (tagName) {
      case 'SCRIPT':
        SCRIPTS.push(element.outerHTML);
        break;
      case 'STYLE':
        STYLES.push(element.outerHTML);
        break;
      case 'LINK':
        LINKS.push(element.outerHTML);
        break;
      case 'META':
        META.push(element.outerHTML);
        break;
      default:
        break;
    }
  }

  for (let i = 0; i < doc.body.children.length; i++) {
    const element: Element = doc.body.children[i];
    const tagName = element.tagName.toUpperCase();

    switch (tagName) {
      case 'SCRIPT':
        SCRIPTS.push(element.outerHTML);
        break;
      case 'STYLE':
        STYLES.push(element.outerHTML);
        break;
      case 'LINK':
        LINKS.push(element.outerHTML);
        break;
      case 'META':
        META.push(element.outerHTML);
        break;
      default:
        break;
    }
  }

  return {
    title: doc.title,
    appNode: doc.querySelector(appSelector)!.outerHTML,
    scripts: SCRIPTS.join('\n'),
    styles: STYLES.join('\n'),
    meta: META.join('\n'),
    links: LINKS.join('\n')
  };
}

export function ngAspnetCoreEngine(options: IEngineOptions): Promise<IEngineRenderResult> {

  if (!options.appSelector) {
    const selector = `" appSelector: '<${appSelector}></${appSelector}>' "`;
    throw new Error(`appSelector is required! Pass in ${selector},
     for your root App component.`);
  }

  const engine = new UniversalEngine();

  // Grab the DOM "selector" from the passed in Template <app-root> for example = "app-root"
  appSelector = options.appSelector.substring(1, options.appSelector.indexOf('>'));

  const compiler = engine.ɵgetCompiler();

  return new Promise((resolve, reject) => {

    try {
      const moduleOrFactory = options.ngModule;
      if (!moduleOrFactory) {
        throw new Error('You must pass in a NgModule or NgModuleFactory to be bootstrapped');
      }

      options.providers = options.providers || [];

      const extraProviders = options.providers.concat(
        [{
          provide: ORIGIN_URL,
          useValue: options.request.origin
        }, {
          provide: REQUEST,
          useValue: options.request.data.request
        }
        ]
      );

      engine.ɵgetFactory(moduleOrFactory, compiler)
        .then(factory => {
          return renderModuleFactory(factory, {
            document: options.appSelector,
            url: options.request.url,
            extraProviders: extraProviders
          });
        })
        .then(result => {
          const doc = result.moduleRef.injector.get(DOCUMENT);
          const universalData = _getUniversalData(doc);

          resolve({
            html: universalData.appNode,
            moduleRef: result.moduleRef,
            globals: {
              styles: universalData.styles,
              title: universalData.title,
              scripts: universalData.scripts,
              meta: universalData.meta,
              links: universalData.links
            }
          });
        }, (err) => {
          reject(err);
        });

    } catch (ex) {
      reject(ex);
    }

  });

}
