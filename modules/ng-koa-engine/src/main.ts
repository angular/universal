import { resolve, dirname, isAbsolute, join } from 'path';
import * as fs from 'fs';

import * as Koa from 'koa';

import { Provider, NgModuleFactory, Type, CompilerFactory, Compiler } from '@angular/core';
import { ResourceLoader } from '@angular/compiler';
import { INITIAL_CONFIG, renderModuleFactory, platformDynamicServer } from '@angular/platform-server';

import { FileLoader } from './file-loader';
import { REQUEST, RESPONSE } from './tokens';
import { ServerResponse, ServerRequest } from 'http';

export interface RenderContext extends Koa.Context {
  render(view: any, options: RenderOptions): Promise<void>;
}

/**
 * These are the allowed options for the engine
 */
export interface NgSetupOptions {
  bootstrap: Type<{}> | NgModuleFactory<{}>;
  providers?: Provider[];
  extname?: string;
}

export interface RenderOptions extends NgSetupOptions {
  ctx: Koa.Context;
}

/**
 * This holds a cached version of each index used.
 */
const templateCache: { [key: string]: string } = {};

/**
 * Map of Module Factories
 */
const factoryCacheMap = new Map<Type<{}>, NgModuleFactory<{}>>();

export function ngKoaEngine(root: string = 'views', setupOptions: NgSetupOptions) {

  const compilerFactory: CompilerFactory = platformDynamicServer().injector.get(CompilerFactory);
  const compiler: Compiler = compilerFactory.createCompiler([
    {
      providers: [
        { provide: ResourceLoader, useClass: FileLoader }
      ]
    }
  ]);


  if (!isAbsolute(root) && module.parent) {
    root = resolve(dirname(module.parent.filename), root);
  }

  const { extname = 'html' } = setupOptions;

  return async (ctx: RenderContext, next: Function) => {
    if (ctx.render) {
      return await next();
    }

    ctx.render = async (view: any, options: RenderOptions) => {
      const moduleOrFactory = options.bootstrap || setupOptions.bootstrap;

      if (!moduleOrFactory) {
        throw new Error('You must pass in a NgModule or NgModuleFactory to be bootstrapped');
      }

      const template = `${view}.${extname}`;

      options.providers = options.providers || [];
      setupOptions.providers = setupOptions.providers || [];

      const extraProviders = setupOptions.providers.concat(
        options.providers,
        getReqResProviders(options.ctx.req, options.ctx.res),
        [
          {
            provide: INITIAL_CONFIG,
            useValue: {
              document: getDocument(join(root, template)),
              url: options.ctx.originalUrl
            }
          }
        ]
      );

      const factory = await getFactory(moduleOrFactory, compiler);
      ctx.body = await renderModuleFactory(factory, {
        extraProviders: extraProviders
      });
    };

    return await next();
  };
}

/**
 * Get a factory from a bootstrapped module/ module factory
 */
async function getFactory(
  moduleOrFactory: Type<{}> | NgModuleFactory<{}>, compiler: Compiler
): Promise<NgModuleFactory<{}>> {
  // If module has been compiled AoT
  if (moduleOrFactory instanceof NgModuleFactory) {
    return moduleOrFactory
  } else {
    let moduleFactory = factoryCacheMap.get(moduleOrFactory);

    // If module factory is cached
    if (moduleFactory) {
      return moduleFactory;
    }

    // Compile the module and cache it
    let factory = await compiler.compileModuleAsync(moduleOrFactory)
    factoryCacheMap.set(moduleOrFactory, factory);
    return factory;
  }
}

/**
 * Get providers of the request and response
 */
function getReqResProviders(req: ServerRequest, res?: ServerResponse): Provider[] {
  const providers: Provider[] = [
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
