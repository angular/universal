/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {ResourceLoader} from '@angular/compiler';
import {Compiler, Type, NgModuleFactory, CompilerFactory, StaticProvider} from '@angular/core';
import {INITIAL_CONFIG, renderModuleFactory, platformDynamicServer} from '@angular/platform-server';
import * as fs from 'fs';

import {FileLoader} from './file-loader';
import {RenderOptions} from './interfaces';

/**
 * A common rendering engine utility. This abstracts the logic
 * for handling the platformServer compiler, the module cache, and
 * the document loader
 */
export class UniversalEngine {

  /** Return an instance of the platformServer compiler */
  static getCompiler(): Compiler {
    const compilerFactory: CompilerFactory = platformDynamicServer().injector.get(CompilerFactory);
    return compilerFactory.createCompiler([
      {providers: [{provide: ResourceLoader, useClass: FileLoader, deps: []}]}
    ]);
  }

  private factoryCacheMap = new Map<Type<{}>, NgModuleFactory<{}>>();
  private templateCache: {[key: string]: string} = {};

  constructor(private moduleOrFactory: Type<{}> | NgModuleFactory<{}>,
              private providers: StaticProvider[] = []) {}

  /**
   * Render an HTML document for a specific URL with specified
   * render options
   */
  render(filePath: string, opts: RenderOptions): Promise<string> {
    const extraProviders = [
      ...(opts.providers || []),
      ...(this.providers || []),
      [
        {
          provide: INITIAL_CONFIG,
          useValue: {
            document: opts.document || this.getDocument(filePath),
            url: opts.url
          }
        }
      ]
    ];

    return this.getFactory()
      .then(factory => renderModuleFactory(factory, {extraProviders}));
  }

  /** Return the factory for a given engine instance */
  getFactory(): Promise<NgModuleFactory<{}>> {
    // If module has been compiled AoT
    const moduleOrFactory = this.moduleOrFactory;
    if (moduleOrFactory instanceof NgModuleFactory) {
      return Promise.resolve(moduleOrFactory);
    } else {
      // we're in JIT mode
      let moduleFactory = this.factoryCacheMap.get(moduleOrFactory);

      // If module factory is cached
      if (moduleFactory) {
        return Promise.resolve(moduleFactory);
      }

      // Compile the module and cache it
      return UniversalEngine.getCompiler().compileModuleAsync(moduleOrFactory)
        .then((factory) => {
          this.factoryCacheMap.set(moduleOrFactory, factory);
          return factory;
        });
    }
  }

  /** Retrieve the document from the cache or the filesystem */
  private getDocument(filePath: string): string {
    return this.templateCache[filePath] = this.templateCache[filePath] ||
      fs.readFileSync(filePath).toString();
  }
}
