import { lsRoutes } from '@nguniversal/common/ls-routes';
import { enableProdMode, NgModule, Component, CompilerFactory, Compiler } from '@angular/core';
// import { ResourceLoader } from '@angular/compiler';
import { RouterModule, Route } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { ModuleMapLoaderModule } from '@nguniversal/module-map-ngfactory-loader';
import { ServerModule, platformDynamicServer } from '@angular/platform-server';
// import { ɵFileLoader as FileLoader } from '@nguniversal/common/engine';

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


async function createFactoryAndGetRoutes(routeConfig: Route[],
  compiler: Compiler, moduleMap: {[key: string]: any} = {} ) {

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
  const factory = await compiler.compileModuleAsync(MockServerModule);

  return lsRoutes(factory, moduleMap);
}

describe('ls-routes', () => {
  let compiler: Compiler;
  beforeAll(() => {
    enableProdMode();
    const compilerFactory = platformDynamicServer()
      .injector.get(CompilerFactory) as CompilerFactory;
    compiler = compilerFactory.createCompiler();
  });

  it('should resolve a single path', async(done) => {
    const routes = await createFactoryAndGetRoutes([
      { path: 'a' }
    ], compiler);
    expect(routes).toContain('/a');
    done();
  });
  it('should resolve a multiple paths', async(done) => {
    const routes = await createFactoryAndGetRoutes([
      { path: 'a' },
      { path: 'b' },
      { path: 'c' },
    ], compiler);
    expect(routes).toContain('/a');
    expect(routes).toContain('/b');
    expect(routes).toContain('/c');
    done();

  });
  it('should resolve nested paths', async(done) => {
    const routes = await createFactoryAndGetRoutes([
      {
        path: 'a',
        children: [
          { path: 'a-a' },
          { path: 'a-b' }
        ]
      },
    ], compiler);
    expect(routes).toContain('/a/a-a');
    expect(routes).toContain('/a/a-b');
    done();
  });
  it('should resolve a string loaded loadChildren', async(done) => {
    const moduleMap = { './ls-routes.spec.ts#LazyModule': LazyModule };
    const routes = await createFactoryAndGetRoutes([
      {
        path: 'a',
        loadChildren: './ls-routes.spec.ts#LazyModule'
      }
    ], compiler, moduleMap);
    expect(routes).toContain('/a/lazy-a');
    done();
  });
  it('should resolve a function loaded loadChildren', async(done) => {
    const routes = await createFactoryAndGetRoutes([
      {
        path: 'a',
        loadChildren: () => compiler.compileModuleSync(LazyModule)
      }
    ], compiler);
    expect(routes).toContain('/a/lazy-a');
    done();
  });
  it('should resolve a function loaded promise loadChildren', async(done) => {
    const routes = await createFactoryAndGetRoutes([
      {
        path: 'a',
        loadChildren: () => compiler.compileModuleAsync(LazyModule) as any
      }
    ], compiler);
    expect(routes).toContain('/a/lazy-a');
    done();

  });
  it('should correctly merge nested routes with empty string ', async(done) => {
    const routes = await createFactoryAndGetRoutes([
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
    ], compiler);
    expect(routes).toContain('/');
    expect(routes).toContain('/level3');
    done();
  });
});
