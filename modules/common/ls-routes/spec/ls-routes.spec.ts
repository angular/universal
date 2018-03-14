import { lsRoutes } from '../src/ls-routes';
import { enableProdMode, NgModule, Component, CompilerFactory, Compiler } from '@angular/core';
import { async } from '@angular/core/testing';
import { ResourceLoader } from '@angular/compiler';
import { RouterModule, Route } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { ModuleMapLoaderModule } from '@nguniversal/module-map-ngfactory-loader';
import { ServerModule, platformDynamicServer } from '@angular/platform-server';

import * as fs from 'fs';

class FileLoader implements ResourceLoader {
  get(url: string): string {
    return fs.readFileSync(url).toString();
  }
}

@Component({selector: 'lazy', template: 'lazy'})
export class LazyComponent {}

@NgModule({
  imports: [RouterModule.forChild([
    {path: 'lazy-a', component: LazyComponent}
  ])],
  declarations: [ LazyComponent ]
})
export class LazyModule {}

function assignComponent(route: Route, comp: any) {
  route.component = comp;
  if (route.children) {
    route.children = route.children.map(r => assignComponent(r, comp));
  }
  return route;
}

function createTestingFactory(routeConfig: Route[], compiler: Compiler) {
  @Component({ selector: 'a', template: 'a' })
  class MockComponent { }

  @NgModule({
    imports: [
      BrowserModule,
      RouterModule.forRoot(routeConfig.map(r => assignComponent(r, MockComponent))),
    ],
    declarations: [MockComponent]
  })
  class MockModule { }
  @NgModule({
    imports: [
      ServerModule,
      MockModule,
      ModuleMapLoaderModule
    ]
  })
  class MockServerModule {}
  return compiler.compileModuleAsync(MockServerModule);
}
function createFactoryAndGetRoutes(routeConfig: Route[], compiler: Compiler, moduleMap: {[key: string]: any} = {} ) {
  // make it as easy as possible
  return createTestingFactory(routeConfig, compiler)
    .then(factory => lsRoutes('flatPaths', factory, moduleMap));
}

describe('ls-routes', () => {
  let compiler: Compiler;
  beforeAll(() => {
    enableProdMode();
    const compilerFactory = platformDynamicServer().injector.get(CompilerFactory);
    compiler = compilerFactory.createCompiler([
      {
        providers: [
          { provide: ResourceLoader, useClass: FileLoader, deps: [] }
        ]
      }
    ]);
  })

  it('should resolve a single path', async(() => {
    createFactoryAndGetRoutes([
      { path: 'a' }
    ], compiler).then(routes => {
      expect(routes).toContain('/a');
    });
  }));
  it('should resolve a multiple paths', async(() => {
    createFactoryAndGetRoutes([
      { path: 'a' },
      { path: 'b' },
      { path: 'c' },
    ], compiler).then(routes => {
      expect(routes).toContain('/a');
      expect(routes).toContain('/b');
      expect(routes).toContain('/c');
    });
  }));
  it('should resolve nested paths', async(() => {
    createFactoryAndGetRoutes([
      {
        path: 'a',
        children: [
          { path: 'a-a' },
          { path: 'a-b' }
        ]
      },
    ], compiler).then(routes => {
      expect(routes).toContain('/a/a-a');
      expect(routes).toContain('/a/a-b');
    });
  }));
  it('should resolve a string loaded loadChildren', async(() => {
    const moduleMap = { './ls-routes.spec.ts#LazyModule': LazyModule };
    createFactoryAndGetRoutes([
      {
        path: 'a',
        loadChildren: './ls-routes.spec.ts#LazyModule'
      }
    ], compiler, moduleMap).then(routes => {
      expect(routes).toContain('/a/lazy-a');
    });
  }));
  it('should resolve a function loaded loadChildren', async(() => {
    createFactoryAndGetRoutes([
      {
        path: 'a',
        loadChildren: () => compiler.compileModuleSync(LazyModule)
      }
    ], compiler).then(routes => {
      expect(routes).toContain('/a/lazy-a');
    });
  }));
  it('should resolve a function loaded promise loadChildren', async(() => {
    createFactoryAndGetRoutes([
      {
        path: 'a',
        loadChildren: () => compiler.compileModuleAsync(LazyModule) as any
      }
    ], compiler).then(routes => {
      expect(routes).toContain('/a/lazy-a');
    });
  }));
  it('should correctly merge nested routes with empty string ', async(() => {
    createFactoryAndGetRoutes([
      {
        path: '',
        children: [
          {
            path: '',
            children: [
              { path: '' },
              { path: 'level3'}
            ]
          }
        ]
      }
    ], compiler).then(routes => {
      expect(routes).toContain('/');
      expect(routes).toContain('/level3');
    });
  }));
});
