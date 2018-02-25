/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {StaticProvider} from '@angular/core';
import {NgSetupOptions, UniversalEngine} from '@nguniversal/common';
import {Request, Response} from 'express';
import {REQUEST, RESPONSE} from './tokens';

/** These are the allowed options for the render */
export interface RenderOptions extends NgSetupOptions {
  req: Request;
  res?: Response;
}

/** This is an express engine for handling Angular Applications */
export function ngExpressEngine(setupOptions: NgSetupOptions) {
  return function(filePath: string,
                  options: RenderOptions,
                  callback: (err?: Error | null, html?: string) => void) {
    const engine = new UniversalEngine(setupOptions.bootstrap, setupOptions.providers);
    options.providers = [...(options.providers || []),
      ...getReqResProviders(options.req, options.res)];

    try {
      engine.render(filePath, options.req.originalUrl, options)
        .then((html: string) => {
          callback(null, html);
        }, (err: any) => {
          callback(err);
        });
    } catch (err) {
      callback(err);
    }
  };
}

/** Get providers of the request and response */
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
