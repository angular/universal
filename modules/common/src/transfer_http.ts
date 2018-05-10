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
    HttpRequest,
    HttpResponse
} from '@angular/common/http';
import { ApplicationRef, Injectable, NgModule, InjectionToken, Inject, ModuleWithProviders } from '@angular/core';
import { BrowserTransferStateModule, TransferState, makeStateKey, StateKey } from '@angular/platform-browser';
import { Observable, of as observableOf } from 'rxjs';
import { tap, take, filter } from 'rxjs/operators';

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

export const TRANSFER_STATE_CACHE_KEY_TRANSFORMER = new InjectionToken('TRANSFER_STATE_CACHE_KEY_TRANSFORMER');

@Injectable()
export class TransferHttpCacheInterceptor implements HttpInterceptor {

    private isCacheActive = true;

    constructor(
        appRef: ApplicationRef,
        private transferState: TransferState,
        @Inject(TRANSFER_STATE_CACHE_KEY_TRANSFORMER) private keyTransformer: (key: string) => string
    ) {
        // Stop using the cache if the application has stabilized, indicating initial rendering is
        // complete.
        appRef.isStable
            .pipe(
                filter((isStable: boolean) => isStable),
                take(1)
            ).toPromise()
            .then(() => { this.isCacheActive = false; });
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const storeKey: StateKey<TransferHttpResponse> = makeStateKey<TransferHttpResponse>(this.constructCacheKey(req));
        // Stop using the cache if there is a mutating call.
        if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'POST') {
            this.isCacheActive = false;
            this.invalidateCacheEntry(storeKey);
        }

        if (!this.isCacheActive && !this.transferState.hasKey(storeKey)) {
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
                    tap((event: HttpEvent<any>) => {
                        if (event instanceof HttpResponse) {
                            this.transferState.set(storeKey, {
                                body: event.body,
                                headers: getHeadersMap(event.headers),
                                status: event.status,
                                statusText: event.statusText,
                                // tslint:disable-next-line:no-non-null-assertion
                                url: event.url!,
                            });
                        }
                    })
                );
        }
    }

    private invalidateCacheEntry(key: StateKey<TransferHttpResponse>) {
        if (this.transferState.hasKey(key)) {
            this.transferState.remove(key);
        }
    }

    private constructCacheKey(req: HttpRequest<any>) {
        let key = `${req.method[0]}_${req.url}`;
        if (req.method === 'POST') {
            key += `_${this.hashParams(req.body)}`;
        }

        if (req.method === 'GET') {
            const hashedParams = req.params.keys().map((param: string) => {
                return { key: req.params.get(param) };
            });

            key += `_${hashedParams}`;
        }

        key = this.keyTransformer
            ? this.keyTransformer(key)
            : key;

        return key
            .replace(/[^\w\s]/gi, '_');
    }

    private hashParams(body: any) {
        let hash = 0;
        const value = JSON.stringify(body);
        if (value.length === 0) {
            return hash;
        }

        for (let i = 0; i < value.length; i++) {
            const char = value.charCodeAt(i);
            // tslint:disable-next-line:no-bitwise
            hash = ((hash << 5) - hash) + char;
            // tslint:disable-next-line:no-bitwise
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
    }
}

/**
 * An NgModule used in conjunction with `ServerTransferHttpCacheModule` to transfer cached HTTP
 * calls from the server to the client application.
 */
@NgModule({
    imports: [BrowserTransferStateModule]
})
export class TransferHttpCacheModule {
    static forRoot(cacheKeyTransformer?: (key: string) => string): ModuleWithProviders {
        return {
            ngModule: TransferHttpCacheModule,
            providers: [
                TransferHttpCacheInterceptor,
                { provide: TRANSFER_STATE_CACHE_KEY_TRANSFORMER, useValue: cacheKeyTransformer },
                { provide: HTTP_INTERCEPTORS, useExisting: TransferHttpCacheInterceptor, multi: true },
            ],
        };
    }
}
