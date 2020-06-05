import 'zone.js';

import { ngKoaEngine } from '@nguniversal/koa-engine';

import { SOME_TOKEN } from '../testing/mock.server.module';
import {
  MockServerModuleNgFactory,
  RequestServerModuleNgFactory,
  TokenServerModuleNgFactory
} from '../testing/mock.server.module.ngfactory';

describe('test runner', () => {
  it('should render a basic template', (done) => {
    const context: any = {
      request: {},
    };
    ngKoaEngine({bootstrap: MockServerModuleNgFactory})(
        '', context, {document: '<root></root>', url: 'localhost'})
        .then(
            () => {
              expect(context.body).toContain('some template');
              done();
            },
            (err: Error) => fail(err),
        );
  });

  it('should throw when no module is passed', () => {
    const context: any = {
      request: {},
    };
    ngKoaEngine({bootstrap: null as any})(
        '', context, {document: '<root></root>', url: 'localhost'})
        .then(
            () => fail(),
            (err: Error) =>
                expect(err.message)
                    .toEqual('You must pass in a NgModule or NgModuleFactory to be bootstrapped'),
        );
  });

  it('should be able to inject REQUEST token', (done) => {
    const context: any = {
      request: {get: () => 'localhost', url: 'http://localhost:4200'},
    };
    ngKoaEngine({bootstrap: RequestServerModuleNgFactory})('', context, {
      document: '<root></root>',
    })
        .then(
            () => {
              expect(context.body).toContain('url:http://localhost:4200');
              done();
            },
            (err: Error) => fail(err),
        );
  });

  it('should be able to inject some token', (done) => {
    const someValue = {message: 'value' + new Date()};
    const context: any = {
      request: {get: () => 'localhost', url: 'http://localhost:4200'},
    };

    ngKoaEngine({
      bootstrap: TokenServerModuleNgFactory,
      providers: [{provide: SOME_TOKEN, useValue: someValue}]
    })('', context, {
      document: '<root></root>',
    })
        .then(
            () => {
              expect(context.body).toContain(someValue.message);
              done();
            },
            (err: Error) => fail(err),
        );
  });
});
