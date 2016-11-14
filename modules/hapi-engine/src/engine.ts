import { platformUniversalDynamic } from 'angular2-universal';
import { PrebootOptions } from 'preboot';

declare var Zone: any;

export interface IHapiEngineConfig {
  asyncDestroy: boolean;

  document?: string;
  DOCUMENT?: string;
  cancelHandler?: () => boolean;
  CANCEL_HANDLER?: () => boolean;
  req?: any;
  REQ?: any;
  res?: any;
  RES?: any;
  time?: boolean;
  TIME?: boolean;
  id?: string;
  ID?: string;
  ngModule?: any;
  precompile?: boolean;
  preboot?: PrebootOptions;
  cancel?: boolean;
  CANCEL?: boolean;
  requestUrl?: string;
  REQUEST_URL?: string;
  originUrl?: string;
  ORIGIN_URL?: string;
  baseUrl?: string;
  BASE_URL?: string;
  cookie?: string;
  COOKIE?: string;
}

export interface IHapiCompileOptions {
  platform?: any,
  providers?: any
};

export interface IHapiContext extends IHapiEngineConfig  {
  request?: any,
};


export type THapiEngineRenderer = (context: IHapiContext, runtimeOptions: any, callback: (err: any, renderedContent: any) => void) => void;

// @internal
function s4() {
  return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}

export class HapiEngine {
  private _defaultCompileOptions: IHapiCompileOptions = {
    platform: (providers) => platformUniversalDynamic(providers),
    providers: []
  };

  private _defaultConfig: IHapiEngineConfig = {
    precompile: true,
    time: false,
    asyncDestroy: true,
    id: s4(),
    ngModule: null
  };

  compile = (template: string, compileOptions: IHapiCompileOptions & IHapiEngineConfig, next: (err: any, renderer: THapiEngineRenderer) => void): void => {
    if (!next) {
      throw new Error('Only async template compilation is supported');
    }

    const mergedCompileOptions: IHapiCompileOptions & IHapiEngineConfig = Object.assign(
      {},
      this._defaultCompileOptions,
      this._defaultConfig,
      compileOptions
    );

    const mergedConfig = Object.assign({}, mergedCompileOptions);
    delete mergedConfig.platform;
    delete mergedConfig.providers;

    const { platform, providers, ngModule } = mergedCompileOptions;
    const platformRef: any = platform(providers);

    if (ngModule) {
      platformRef.cacheModuleFactory(ngModule);
    }

    const rendererWrapper: THapiEngineRenderer = (context, runtimeOptions, callback) => {
      // engine config specified in reply.view context
      const mergedContext = Object.assign({}, mergedConfig, context);

      // runtime variables passed from compile to renderer
      const mergedRuntimeOptions = Object.assign({}, runtimeOptions, { platformRef, template });

      this._renderer(mergedContext, mergedRuntimeOptions, callback);
    };

    next(null, rendererWrapper);
  }

  private _renderer: THapiEngineRenderer = (context, runtimeOptions, callback) => {
    const { platformRef, template } = runtimeOptions;

    if (!context.ngModule) {
      throw new Error('Please provide your main module as ngModule as the context in reply.view("index", { ngModule: MainModule }) or in Vision configuration as { compileConfig: { ngModule: MainModule } }');
    }

    if (!context.request || !(context.req && context.res)) {
      throw new Error('Please provide request as the context in reply.view("index", { request })');
    }

    const rendererConfig = Object.assign({}, context);
    delete rendererConfig.request;

    const { request } = context;

    const req = rendererConfig.req || request.raw.req;
    const res = rendererConfig.res || request.raw.res;

    const requestUrl = rendererConfig.requestUrl || req.url;
    const originUrl = rendererConfig.originUrl || req.headers.host;
    const baseUrl = rendererConfig.baseUrl || '/';
    const cookie = rendererConfig.cookie || req.headers.cookie;

    const DOCUMENT: string = template;
    // TODO(gdi2290): breaking change for context globals
    // document = parseDocument(document);
    const document = DOCUMENT;
    const cancelHandler = () => Zone.current.get('cancel');

    const config: IHapiEngineConfig = Object.assign({}, rendererConfig, {
      cancel: false,
      req,
      res,
      requestUrl,
      originUrl,
      baseUrl,
      cookie,
      DOCUMENT,
      document,
      cancelHandler
    });

    req.on('close', () => config.cancel = true);

    const zone = Zone.current.fork({
      name: 'UNIVERSAL request',
      properties: config
    });

    // convert to string
    zone.run(() => (config.precompile ?
      platformRef.serializeModule(config.ngModule, config) :
      platformRef.serializeModuleFactory(config.ngModule, config)
    )
    .then(html => {
      if (typeof html !== 'string' || config.cancel) {
        callback(null, DOCUMENT);
      } else {
        callback(null, html);
      }
    })
    .catch(e => {
      console.log(e.stack);

      // if server fail then return client html
      callback(null, DOCUMENT);
    }));

  }
}

const hapiEngine = new HapiEngine();

export default hapiEngine;
