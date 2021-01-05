/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {
  HTTP_INTERCEPTORS,
  HttpEvent,
  HttpHandler,
  HttpHeaders,
  HttpInterceptor,
  HttpParams,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { ApplicationRef, Injectable, NgModule } from '@angular/core';
import {
  BrowserTransferStateModule,
  StateKey,
  TransferState,
  makeStateKey
} from '@angular/platform-browser';
import { Observable, of as observableOf } from 'rxjs';
import { filter, take, tap } from 'rxjs/operators';

export interface TransferHttpResponse {
  body?: any | null;
  headers?: {[k: string]: string[]};
  status?: number;
  statusText?: string;
  url?: string;
}

function getHeadersMap(headers: HttpHeaders) {
  const headersMap: { [name: string]: string[] | null } = {};
  for (const key of headers.keys()) {
    if (headers.getAll(key) !== undefined) {
      headersMap[key] = headers.getAll(key);
    }
  }
  return headersMap;
}

@Injectable()
export class TransferHttpCacheInterceptor implements HttpInterceptor {

  private isCacheActive = true;

  private invalidateCacheEntry(url: string) {
    Object.keys(this.transferState['store'])
      .forEach(key => key.includes(url) ? this.transferState.remove(makeStateKey(key)) : null);
  }

  private makeCacheKey(method: string, url: string, params: HttpParams): StateKey<string> {
    // make the params encoded same as a url so it's easy to identify
    const encodedParams = params.keys().sort().map(k => `${k}=${params.get(k)}`).join('&');
    const key = method[0] + url + '?' + encodedParams;
    return makeStateKey<TransferHttpResponse>(key);
  }

  constructor(appRef: ApplicationRef, private transferState: TransferState) {
    // Stop using the cache if the application has stabilized, indicating initial rendering is
    // complete.
    // tslint:disable-next-line: no-floating-promises
    appRef.isStable
      .pipe(
        filter((isStable: boolean) => isStable),
        take(1)
      ).toPromise()
      .then(() => { this.isCacheActive = false; });
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const url = req.url.indexOf('://') !== -1 ? req.url : 'http://localhost:4200' + req.url;
    const storeKey = this.makeCacheKey(req.method, url, req.params);

    // Stop using the cache if there is a mutating call.
    if (!this.isAllowedRequestMethod(req)) {
      this.isCacheActive = false;
      this.invalidateCacheEntry(storeKey);
    }

    if (!this.isCacheActive && !this.transferState.hasKey(storeKey) || !this.isPostRequestAllowed(req, storeKey)) {
      // Cache is no longer active. Pass the request through.
      return next.handle(req);
    }

    if (this.transferState.hasKey(storeKey)) {
      // Request found in cache. Respond using it.
      const response = this.transferState.get(storeKey, {} as TransferHttpResponse);
      this.invalidateCacheEntry(storeKey);

      return observableOf(new HttpResponse<any>({
        body: response.body,
        headers: new HttpHeaders(response.headers),
        status: response.status,
        statusText: response.statusText,
        url: response.url,
      }));
    } else {
      // Request not found in cache. Make the request and cache it.
      const httpEvent = next.handle(req);

      return httpEvent
        .pipe(
          tap((event: HttpEvent<unknown>) => {
            if (event instanceof HttpResponse) {
              this.transferState.set(storeKey, {
                body: event.body,
                headers: getHeadersMap(event.headers),
                status: event.status,
                statusText: event.statusText,
                url: event.url || '',
              });
            }
          })
        );
    }
  }

  private isAllowedRequestMethod(req: HttpRequest<any>): boolean {
    return req.method === 'GET' || req.method === 'HEAD' || req.method === 'POST';
  }

  private isPostRequestAllowed(req: HttpRequest<any>): boolean {
    if (req.method !== 'POST') {
      return true;
    }
    return false;
  }
}

/**
 * An NgModule used in conjunction with `ServerTransferHttpCacheModule` to transfer cached HTTP
 * calls from the server to the client application.
 */
@NgModule({
  imports: [BrowserTransferStateModule],
  providers: [
    TransferHttpCacheInterceptor,
    {provide: HTTP_INTERCEPTORS, useExisting: TransferHttpCacheInterceptor, multi: true},
  ],
})
export class TransferHttpCacheModule {}
