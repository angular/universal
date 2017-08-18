/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as fs from 'fs';
import { Request } from 'hapi';

import { NgModuleFactory, Type, CompilerFactory, Compiler, StaticProvider } from '@angular/core';
import { ResourceLoader } from '@angular/compiler';
import {
  INITIAL_CONFIG,
  renderModuleFactory,
  platformDynamicServer
} from '@angular/platform-server';

import { FileLoader } from './file-loader';
import { REQUEST, RESPONSE } from './tokens';
import { Request } from 'hapi';
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
}

/**
 * This is an express engine for handling Angular Applications
 */
export function ngHapiEngine(options: RenderOptions) {

  const engine = new UniversalEngine(options.bootstrap, options.providers);

  if (options.req.raw.req.url === undefined) {
    return Promise.reject(new Error('url is undefined'));
  }

  const filePath = <string>options.req.raw.req.url;

  return new Promise((resolve, reject) => {
    engine.render(filePath, filePath, {
      request: options.req,
      response: options.req.raw.res,
    })
      .then((html: string) => {
        resolve(html);
      }, (err) => {
        reject(err);
      });
  });
}


