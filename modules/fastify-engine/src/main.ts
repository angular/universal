/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { StaticProvider } from '@angular/core';
import { ɵCommonEngine, ɵRenderOptions } from '@nguniversal/common/engine';
import { REPLY, REQUEST } from '@nguniversal/fastify-engine/tokens';
import { FastifyReply, FastifyRequest } from 'fastify';

/**
 * These are the allowed options for the engine
 */
export interface NgSetupOptions extends ɵRenderOptions {
  request: FastifyRequest;
  reply: FastifyReply;
}

/**
 * This is a fastify engine for handling Angular Applications
 */
export function ngFastifyEngine(
  options: Readonly<NgSetupOptions>
): Promise<string> {
  const moduleOrFactory = options.bootstrap;

  if (!moduleOrFactory) {
    throw new Error('You must pass in a NgModule or NgModuleFactory to be bootstrapped');
  }

  const request = options.request;
  const engine = new ɵCommonEngine(options.bootstrap, options.providers);

  const renderOptions = { ...options } as ɵRenderOptions;

  renderOptions.documentFilePath = options.documentFilePath || request.url;
  renderOptions.url = options.url || `${request.protocol}://${request.hostname}${request.url}`;
  renderOptions.providers = [...(renderOptions.providers || []), getRequestProviders(options.request, options.reply)];

  options.reply.type('text/html');

  return engine.render(renderOptions);
}

/**
 * Get providers of the request and reply
 */
function getRequestProviders(
  request: FastifyRequest,
  reply: FastifyReply
): StaticProvider[] {
  return [
    {
      provide: REQUEST,
      useValue: request
    },
    {
      provide: REPLY,
      useValue: reply
    }
  ];
}
