/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {StaticProvider} from '@angular/core';
import {NgSetupOptions, ɵUniversalEngine as UniversalEngine} from '@nguniversal/common';
import {REQUEST, RESPONSE} from '@nguniversal/common/tokens';
import {Request, Response} from 'hapi';

/** These are the allowed options for the render */
export interface RenderOptions extends NgSetupOptions {
  req: Request;
  res?: Response;
  url?: string;
  document?: string;
}

/** This is an express engine for handling Angular Applications */
export function ngHapiEngine(options: RenderOptions) {
  if (options.req.raw.req.url === undefined) {
    return Promise.reject(new Error('url is undefined'));
  }

  const engine = new UniversalEngine(options.bootstrap, options.providers);
  const filePath = <string>options.req.raw.req.url;

  options.providers = [...(options.providers || []), ...getReqResProviders(options.req)];

  if (!options.url) {
    options.url = filePath;
  }

  return new Promise((resolve, reject) => {
    engine.render(filePath, options)
      .then((html: string) => {
        resolve(html);
      }, (err: any) => {
        reject(err);
      });
  });
}

/** Get providers of the request and response */
function getReqResProviders(req: Request): StaticProvider[] {
  return [
    {
      provide: REQUEST,
      useValue: req
    },
    {
      provide: RESPONSE,
      useValue: req.raw.res
    }
  ];
}

