/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { BuilderContext } from '@angular-devkit/architect';
import { NullLogger } from '@angular-devkit/core/src/logger';

import { getRoutes } from './utils';
import { PrerenderBuilderOptions } from './index';

import * as fs from 'fs';

describe('Prerender Builder Utils', () => {
  describe('#getRoutes', () => {
    const WORKSPACE_ROOT = '/path/to/angular/json'
    const ROUTE_FILE = './routes.txt';
    const ROUTE_FILE_CONTENT = '/route1\n/route1\n/route2\n/route3';
    const OPTION_ROUTES = ['/route3', '/route3', '/route4'];

    let options: PrerenderBuilderOptions;
    let context: BuilderContext;
    let existsSyncSpy: jasmine.Spy;

    beforeEach(() => {
      options = {
        routeFile: ROUTE_FILE,
        routes: OPTION_ROUTES
      } as PrerenderBuilderOptions;
      context = {
        workspaceRoot: WORKSPACE_ROOT,
        logger: new NullLogger() as any,
      } as BuilderContext;
      spyOn(fs, 'readFileSync').and.returnValue(ROUTE_FILE_CONTENT);
      existsSyncSpy = spyOn(fs, 'existsSync').and.returnValue(true);
    });

    it('Should return the deduped union of options.routes and options.routeFile - routes and routeFile defined', () => {
      const routes = getRoutes(options, context);
      expect(routes).toEqual(['/route1', '/route2', '/route3', '/route4']);
    });

    it('Should return the deduped union of options.routes and options.routeFile - only routes defined', () => {
      delete options.routeFile;
      const routes = getRoutes(options, context);
      expect(routes).toEqual(['/route3', '/route4']);
    });

    it('Should return the deduped union of options.routes and options.routeFile - only routes file defined', () => {
      delete options.routes;
      const routes = getRoutes(options, context);
      expect(routes).toEqual(['/route1', '/route2', '/route3']);
    });

    it('Should throw if a route file is given but cannot be found', () => {
      existsSyncSpy.and.returnValue(false);
      expect(() => getRoutes(options, context)).toThrow();
    });
  });
});
