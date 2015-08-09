/// <reference path="../typings/tsd.d.ts" />

// FIX: reflect-metadata shim is required when using class decorators
import 'reflect-metadata';
//

import {BrowserXhr} from 'angular2/src/http/backends/browser_xhr';
import {ServerXhr} from './backends/server_xhr';

import {bind, Injectable} from 'angular2/di';

import {
  Http,
  ConnectionBackend,
  RequestOptions,
  ResponseOptions,
  BaseResponseOptions,
  BaseRequestOptions,
  MockBackend
} from 'angular2/http';

@Injectable()
export class NodeXhr extends BrowserXhr {
  abort: any;
  send: any;
  open: any;
  addEventListener: any;
  removeEventListener: any;
  response: any;
  responseText: string;
  constructor(private _serverXHR: ServerXhr) {
    super();
    this.abort = _serverXHR.abort.bind(this);
    this.send = _serverXHR.send.bind(this);
    this.open = _serverXHR.open.bind(this);
    this.addEventListener = _serverXHR.addEventListener.bind(this);
    this.removeEventListener = _serverXHR.removeEventListener.bind(this);
  }
  build() {
    return new NodeXhr();
  }
}

@Injectable()
export class NodeBackend extends MockBackend {
  constructor(private _browserXHR: BrowserXhr, private _baseResponseOptions: ResponseOptions) {
    super(_browserXHR, _baseResponseOptions);
  }
  // createConnection(request: any) {
  //   return new XHRConnection(request, this._browserXHR, this._baseResponseOptions);
  // }
}

export var httpInjectables: Array<any> = [
  bind(ConnectionBackend).toClass(NodeBackend),
  bind(BrowserXhr).toClass(NodeXhr),

  bind(RequestOptions).toClass(BaseRequestOptions),
  bind(ResponseOptions).toClass(BaseResponseOptions),
  Http
];
