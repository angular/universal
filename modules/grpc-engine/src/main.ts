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
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';

// don't move this file without understanding the below reasoning
//
// we assume the dir structure between this file and grpc-engine.proto
// this is handled by including the file into unit tests with `data = []`
// for publishing we understand that:
// - fesm5, fesm2015 will all work
// - but esm5 and esm2015 will be broken
// if the structure of ng_package change it may break this
//
// also don't change the name of the file since users have to reference it by name
const GRPC_ENGINE_PROTO_FILENAME = 'grpc-engine.proto';
const protoPath = path.join(__dirname, '..', GRPC_ENGINE_PROTO_FILENAME);
const packageDefinition = protoLoader.loadSync(protoPath, {});
const grpcEngineProto = grpc.loadPackageDefinition(packageDefinition).grpcengine;

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
  host = '0.0.0.0',
  port = 9090,
  creds: grpc.ServerCredentials,
): Promise<GRPCEngineServer> {
  // needs to be a directory up so it lines up with deployment
  return new Promise((resolve, _reject) => {
    const engine = new CommonEngine(moduleOrFactory);
    const server = new grpc.Server();

    server.addProtoService(grpcEngineProto.SSR.service, {
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
    server.bind(`${host}:${port}`, creds);
    server.start();

    resolve({
      close: () => new Promise((res, _rej) => server.tryShutdown(() => res()))
    });
  });
}

