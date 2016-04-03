import {
  Http,
  Response,
  Headers,
  RequestOptions,
  ResponseOptions,
  ConnectionBackend,
  BaseRequestOptions,
  BaseResponseOptions,
  XHRBackend,
  BrowserXhr
} from 'angular2/http';
import {
  isPresent,
  isBlank,
  CONST_EXPR
} from 'angular2/src/facade/lang';

import {
  provide,
  OpaqueToken,
  Injectable,
  Optional,
  Inject,
  EventEmitter
} from 'angular2/core';

import {
  Observable
} from 'rxjs';

export const PRIME_CACHE: OpaqueToken = CONST_EXPR(new OpaqueToken('primeCache'));


@Injectable()
export class NgPreloadCacheHttp extends Http {
  prime: boolean = true;
  constructor(
    protected _backend: ConnectionBackend,
    protected _defaultOptions: RequestOptions) {
    super(_backend, _defaultOptions);
  }

  preload(url, method) {
    let newcache = (<any>window).ngPreloadCache;

    if (!newcache) {
      return method();
    } else {
      let cache = [].concat(newcache);
      let obs = new EventEmitter(false);
      var preloaded = null;

      let res;
      preloaded = newcache.shift();
      if (isPresent(preloaded)) {
        let body = preloaded._body;
        res = new ResponseOptions((<any>Object).assign({}, preloaded, { body }));

        if (preloaded.headers) {
          res.headers = new Headers(preloaded);
        }
        preloaded = new Response(res);
      }

      if (preloaded) {
        obs.next(preloaded);
        obs.complete();
        return obs;
      }

      let request = method();
      request.subscribe(obs);
      return obs;
    }
  }

  request(url: string, options): Observable<Response> {
    return this.preload(url, () => super.request(url, options));
  }

  get(url: string, options): Observable<Response> {
    return this.preload(url, () => super.get(url, options));
  }

  post(url: string, body: string, options): Observable<Response> {
    return this.preload(url, () => super.post(url, body, options));
  }

  put(url: string, body: string, options): Observable<Response> {
    return this.preload(url, () => super.put(url, body, options));
  }

  delete(url: string, options): Observable<Response> {
    return this.preload(url, () => super.delete(url, options));
  }

  patch(url: string, body: string, options): Observable<Response> {
    return this.preload(url, () => super.patch(url, body, options));
  }

  head(url: string, options): Observable<Response> {
    return this.preload(url, () => super.head(url, options));
  }
}

export const NG_PRELOAD_CACHE_PROVIDERS: Array<any> = [
  provide(Http, {
    useFactory: (xhrBackend, requestOptions) => {
      return new NgPreloadCacheHttp(xhrBackend, requestOptions);
    },
    deps: [XHRBackend, RequestOptions]
  })
];


export const BROWSER_HTTP_PROVIDERS: Array<any> = [
  BrowserXhr,
  provide(RequestOptions, {useClass: BaseRequestOptions}),
  provide(ResponseOptions, {useClass: BaseResponseOptions}),
  XHRBackend,
  ...NG_PRELOAD_CACHE_PROVIDERS
];
