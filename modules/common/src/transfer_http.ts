import {
  HTTP_INTERCEPTORS,
  HttpEvent,
  HttpHandler,
  HttpHeaders,
  HttpInterceptor,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { ApplicationRef, Injectable, NgModule } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { filter } from 'rxjs/operator/filter';
import { first } from 'rxjs/operator/first';
import { toPromise } from 'rxjs/operator/toPromise';
import { _do } from 'rxjs/operator/do';

import { BrowserTransferStateModule, TransferState, makeStateKey } from '@angular/platform-browser';

export interface TransferHttpResponse {
  body?: any | null;
  headers?: { [k: string]: string[] };
  status?: number;
  statusText?: string;
  url?: string;
}

function getHeadersMap(headers: HttpHeaders) {
  const headersMap: { [name: string]: string[] } = {};
  for (const key of headers.keys()) {
    headersMap[key] = headers.getAll(key)!;
  }
  return headersMap;
}

@Injectable()
export class TransferHttpCacheInterceptor implements HttpInterceptor {
  private isCacheActive = true;

  private invalidateCacheEntry(url: string) {
    this.transferState.remove(makeStateKey<TransferHttpResponse>('G.' + url));
    this.transferState.remove(makeStateKey<TransferHttpResponse>('H.' + url));
  }

  constructor(appRef: ApplicationRef, private transferState: TransferState) {
    // Stop using the cache if the application has stabilized, indicating initial rendering is
    // complete.
    toPromise.call(first.call(filter.call(appRef.isStable, (isStable: boolean) => isStable))).then(() => {
      this.isCacheActive = false;
    });
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Stop using the cache if there is a mutating call.
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      this.isCacheActive = false;
      this.invalidateCacheEntry(req.url);
    }

    if (!this.isCacheActive) {
      // Cache is no longer active. Pass the request through.
      return next.handle(req);
    }

    const key = (req.method === 'GET' ? 'G.' : 'H.') + req.url;
    const storeKey = makeStateKey<TransferHttpResponse>(key);

    if (this.transferState.hasKey(storeKey)) {
      // Request found in cache. Respond using it.
      const response = this.transferState.get(storeKey, {} as TransferHttpResponse);
      return of(
        new HttpResponse<any>({
          body: response.body,
          headers: new HttpHeaders(response.headers),
          status: response.status,
          statusText: response.statusText,
          url: response.url
        })
      );
    } else {
      // Request not found in cache. Make the request and cache it.
      const httpEvent = next.handle(req);
      return _do.call(httpEvent, (event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          this.transferState.set(storeKey, {
            body: event.body,
            headers: getHeadersMap(event.headers),
            status: event.status,
            statusText: event.statusText,
            url: event.url!
          });
        }
      });
    }
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
    { provide: HTTP_INTERCEPTORS, useExisting: TransferHttpCacheInterceptor, multi: true }
  ]
})
export class TransferHttpCacheModule {}
