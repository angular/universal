/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {
  ɵCommonEngine as CommonEngine,
  ɵRenderOptions as RenderOptions,
} from '@nguniversal/common/engine';
import {NgModuleFactory, Type} from '@angular/core';
import * as grpc from 'grpc';

export interface GRPCEngineServer {
  close: () => void;
}

export interface GRPCEngineRenderOptions extends RenderOptions {
  id: number;
}

export interface GRPCEngineResponse {
  id: number;
  html: string;
}

export function startGRPCEngine(
  moduleOrFactory: Type<{}> | NgModuleFactory<{}>,
  host = 'localhost',
  port = 9090
): Promise<GRPCEngineServer> {
  // needs to be a directory up so it lines up with deployment
  const protoDescriptor = grpc.load('./grpc-engine.proto');
  return new Promise((resolve, _reject) => {
    const engine = new CommonEngine(moduleOrFactory);

    const server = new grpc.Server();
    server.addProtoService(protoDescriptor.GRPCEngine.service, {
      render: async (call: any, callback: any) => {
        const renderOptions = call.request as GRPCEngineRenderOptions;
        try {
          const html = await engine.render(renderOptions);
          callback(null, {id: renderOptions.id, html});
        } catch (error) {
          callback(null, {id: renderOptions.id, error});
        }
      }
    });
    // TODO(Toxicable): how to take credentials as input?
    server.bind(`${host}:${port}`, grpc.ServerCredentials.createInsecure());
    server.start();

    resolve({
      close: () => new Promise((res, _rej) => server.tryShutdown(() => res()))
    });
  });
}

