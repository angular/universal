/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as fs from 'fs';
import { Request, Response } from 'express';

import { NgModuleFactory, Type, StaticProvider } from '@angular/core';
import { ɵCommonEngine as CommonEngine } from '@nguniversal/common/engine';
import { REQUEST, RESPONSE } from '@nguniversal/express-engine/tokens';

/**
 * These are the allowed options for the engine
 */
export interface NgSetupOptions {
  bootstrap: Type<{}> | NgModuleFactory<{}>;
  providers?: StaticProvider[];
}

/**
 * These are the allowed options for the render
 */
export interface RenderOptions extends NgSetupOptions {
  req: Request;
  res?: Response;
  url?: string;
  document?: string;
}

/**
 * This holds a cached version of each index used.
 */
const templateCache: { [key: string]: string } = {};

/**
 * This is an express engine for handling Angular Applications
 */
export function ngExpressEngine(setupOptions: NgSetupOptions) {
  const engine = new CommonEngine(setupOptions.bootstrap, setupOptions.providers);

  return function (filePath: string,
                   options: RenderOptions,
                   callback: (err?: Error | null, html?: string) => void) {
    try {
      if (!setupOptions.bootstrap && !options.bootstrap) {
        throw new Error('You must pass in a NgModule or NgModuleFactory to be bootstrapped');
      }

      const req = options.req;
      options.url = options.url || `${req.protocol}://${(req.get('host') || '')}${req.originalUrl}`;
      options.document = options.document || getDocument(filePath);

      options.providers = options.providers || [];
      options.providers = options.providers.concat(getReqResProviders(options.req, options.res));

      engine.render(options)
        .then(html => callback(null, html))
        .catch(callback);
    } catch (err) {
      callback(err);
    }
  };
}

/**
 * Get providers of the request and response
 */
function getReqResProviders(req: Request, res?: Response): StaticProvider[] {
  const providers: StaticProvider[] = [
    {
      provide: REQUEST,
      useValue: req
    }
  ];
  if (res) {
    providers.push({
      provide: RESPONSE,
      useValue: res
    });
  }
  return providers;
}

/**
 * Get the document at the file path
 */
function getDocument(filePath: string): string {
  return templateCache[filePath] = templateCache[filePath] || fs.readFileSync(filePath).toString();
}
