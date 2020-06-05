/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NgModuleFactory, StaticProvider, Type } from '@angular/core';
import {
  ɵCommonEngine as CommonEngine,
  ɵRenderOptions as RenderOptions
} from '@nguniversal/common/engine';
import { REQUEST, RESPONSE } from '@nguniversal/koa-engine/tokens';
import { Context, Request, Response } from 'koa';

/**
 * These are the allowed options for the engine
 */
export interface NgSetupOptions {
  bootstrap: Type<{}>|NgModuleFactory<{}>;
  providers?: StaticProvider[];
}

/**
 * This is a Koa engine for handling Angular Applications
 */
export function ngKoaEngine(setupOptions: Readonly<NgSetupOptions>) {
  const engine = new CommonEngine(setupOptions.bootstrap, setupOptions.providers);

  return async (filePath: string, ctx: Context, options: Readonly<Partial<RenderOptions>> = {}) => {
    const moduleOrFactory = options.bootstrap || setupOptions.bootstrap;
    if (!moduleOrFactory) {
      throw new Error('You must pass in a NgModule or NgModuleFactory to be bootstrapped');
    }

    const {request, response} = ctx;
    const renderOptions: RenderOptions =
        Object.assign({bootstrap: setupOptions.bootstrap}, options);

    renderOptions.url = renderOptions.url ||
        `${request.protocol}://${(request.get('host') || '')}${request.originalUrl}`;
    renderOptions.documentFilePath = renderOptions.documentFilePath || filePath;
    renderOptions.providers =
        (renderOptions.providers || []).concat(getReqResProviders(request, response));

    ctx.body = await engine.render(renderOptions);
  };
}

/**
 * Get providers of the request and response
 */
function getReqResProviders(req: Request, res?: Response): StaticProvider[] {
  const providers: StaticProvider[] = [{provide: REQUEST, useValue: req}];
  if (res) {
    providers.push({provide: RESPONSE, useValue: res});
  }

  return providers;
}
