/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Request, Response } from 'express';

import { NgModuleFactory, Type, StaticProvider } from '@angular/core';
import { ɵUniversalEngine as UniversalEngine } from '@nguniversal/common';
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
}

/**
 * This is an express engine for handling Angular Applications
 */
export function ngExpressEngine(setupOptions: NgSetupOptions) {

  const engine = new UniversalEngine(setupOptions.bootstrap, setupOptions.providers);

  return function (filePath: string,
                   options: RenderOptions,
                   callback: (err?: Error | null, html?: string) => void) {

    options.providers = options.providers || [];

    try {
      engine.render(filePath, options.req.originalUrl, {
        request: options.req,
        response: options.res,
        providers: options.providers,
      })
        .then((html: string) => {
          callback(null, html);
        }, (err) => {
          callback(err);
        });
    } catch (err) {
      callback(err);
    }
  };
}

