import {
  Connection,
  ConnectionBackend,
  Headers,
  ReadyState,
  Request,
  RequestMethod,
  Response,
  ResponseOptions,
  ResponseType
} from 'angular2/http';
import * as utils from 'angular2/src/http/http_utils';
import {isPresent} from 'angular2/src/facade/lang';
import {Injectable, NgZone} from 'angular2/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import * as http from 'http';
import * as https from 'https';
import * as url from 'url';

import {ORIGIN_URL, BASE_URL} from '../../common';

export class NodeConnection implements Connection {
  public readyState: ReadyState;
  public request: Request;
  public response: Observable<Response>;

  constructor(req: Request, baseResponseOptions?: ResponseOptions, ngZome?: NgZone) {
    this.request = req;

    let reqInfo: any = url.parse(req.url);
    reqInfo.method = RequestMethod[req.method].toUpperCase();

    if (isPresent(req.headers)) {
      reqInfo.headers = {};
      req.headers.forEach((values, name) => reqInfo.headers[name] = values.join(','));
    }

    this.response = new Observable(responseObserver => {
      let nodeReq;
      ngZome.run(() => {
        // http or https
        let xhrHttp: any = http;
        if (reqInfo.protocol === 'https:') {
          xhrHttp = https;
        }

        nodeReq = xhrHttp.request(reqInfo, (res: http.IncomingMessage) => {
          let body = '';
          res.on('data', (chunk) => body += chunk);

          let status = res.statusCode;
          let headers = new Headers(res.headers);
          let url = res.url;

          res.on('end', () => {
            let responseOptions = new ResponseOptions({body, status, headers, url});
            let response = new Response(responseOptions);

            if (utils.isSuccess(status)) {
              ngZome.run(() => {
                responseObserver.next(response);
              });
              ngZome.run(() => {
                responseObserver.complete();
              });
              return;
            }
            ngZome.run(() => {
              responseObserver.error(response);
            });
          });
        });
      });

      let onError = (err) => {
        let responseOptions = new ResponseOptions({body: err, type: ResponseType.Error});
        if (isPresent(baseResponseOptions)) {
          responseOptions = baseResponseOptions.merge(responseOptions);
        }
        ngZome.run(() => {
          responseObserver.error(new Response(responseOptions));
        });
      };

      nodeReq.on('error', onError);

      nodeReq.write(req.text());
      nodeReq.end();

      return () => {
        nodeReq.removeListener('error', onError);
        nodeReq.abort();
      };
    });
  }
}


@Injectable()
export class NodeBackend implements ConnectionBackend {
  constructor(
    private _baseResponseOptions: ResponseOptions,
    private _ngZone: NgZone) {}

  public createConnection(request: Request): NodeConnection {
    return new NodeConnection(request, this._baseResponseOptions, this._ngZone);
  }
}
