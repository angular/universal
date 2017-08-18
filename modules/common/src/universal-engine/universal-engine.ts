import { REQUEST, RESPONSE } from './tokens';
import { Compiler, Type, NgModuleFactory, CompilerFactory, StaticProvider } from '@angular/core';
import { INITIAL_CONFIG, renderModuleFactory, platformDynamicServer } from '@angular/platform-server';
import { ResourceLoader } from '@angular/compiler';
import { ɵFileLoader as FileLoader } from './file-loader';
import * as fs from 'fs';
import { ɵRenderOptions } from './interfaces';

export class ɵUniversalEngine {

  private _compiler: Compiler;
  private get compiler(): Compiler{
    this._compiler = !this._compiler ?  this.ɵgetCompiler() : this._compiler;
    return this._compiler;
  }
  private factoryCacheMap = new Map<Type<{}>, NgModuleFactory<{}>>();
  private templateCache: { [key: string]: string } = {};

  constructor(
    //TODO(Toxicable): make non optional
    private moduleOrFactory?: Type<{}> | NgModuleFactory<{}>,
    private providers: StaticProvider[] = [],
  ) { }

  //TODO(Toxicable): make internally private
  ɵgetDocument(filePath: string): string {
    return this.templateCache[filePath] = this.templateCache[filePath] || fs.readFileSync(filePath).toString();
  }

  //TODO(Toxicable): make internally private
  ɵgetCompiler(): Compiler {
    const compilerFactory: CompilerFactory = platformDynamicServer().injector.get(CompilerFactory);
    return compilerFactory.createCompiler([
      {
        providers: [
          { provide: ResourceLoader, useClass: FileLoader, deps: [] }
        ]
      }
    ]);
  }

  //TODO(Toxicable): make internally private
  ɵgetFactory(moduleOrFactory: Type<{}> | NgModuleFactory<{}>, compiler: Compiler): Promise<NgModuleFactory<{}>> {

    // If module has been compiled AoT
    if (moduleOrFactory instanceof NgModuleFactory) {
      return Promise.resolve(moduleOrFactory);
    } else {
      //we're in JIT mode

      let moduleFactory = this.factoryCacheMap.get(moduleOrFactory);

      // If module factory is cached
      if (moduleFactory) {
        return Promise.resolve(moduleFactory);
      }

      // Compile the module and cache it
      return compiler.compileModuleAsync(moduleOrFactory)
        .then((factory) => {
          this.factoryCacheMap.set(moduleOrFactory, factory);
          return factory
        })
    }
  }

  private getReqResProviders(req: Request, res?: Response): StaticProvider[] {
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

  render(filePath: string, url: string, opts: ɵRenderOptions): Promise<string> {
    //TODO(Toxciable): move to ctor
    if (!this.moduleOrFactory) {
      throw new Error('You must pass in a NgModule or NgModuleFactory to be bootstrapped');
    }

    const extraProviders = [
      ...opts.providers || [],
      ...this.providers || [],
      ...this.getReqResProviders(opts.request, opts.response),
      [
        {
          provide: INITIAL_CONFIG,
          useValue: {
            document: this.ɵgetDocument(filePath),
            url: url
          }
        }
      ]
    ];

    return this.ɵgetFactory(this.moduleOrFactory, this.compiler)
      .then(factory => {
        return renderModuleFactory(factory, {
          extraProviders: extraProviders
        });
      });
  }
}


