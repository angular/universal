import { NgModule, NgModuleFactoryLoader } from '@angular/core'
import { TestBed, async } from '@angular/core/testing'
import { ModuleMapLoaderModule, provideModuleMap } from '../../../modules/module-map-ngfactory-loader'

@NgModule({
  declarations: []
})
export class LazyModule{}

const MODULE_MAP = { 'lazy-component': LazyModule };

describe('module-map-ngfactory-loader', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ModuleMapLoaderModule,
      ],
      providers: [
        provideModuleMap(MODULE_MAP)
      ]
    })
  })
  it('should be accessable via injector', () => {
    const loader = TestBed.get(NgModuleFactoryLoader);
    expect(loader).toBeTruthy();
  })
  it('should produce a factory in JIT mode', async(() => {
    const loader = TestBed.get(NgModuleFactoryLoader) as NgModuleFactoryLoader;
    loader.load('lazy-component')
    .then(factory => {
      expect(factory.moduleType).toEqual(LazyModule);
    })

  }))
})
