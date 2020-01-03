/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import "jasmine";
import * as fs from 'fs';
import * as guessParser from 'guess-parser';
import { getRoutes } from './utils';
import { PrerenderBuilderOptions } from './models';
import * as Architect from '@angular-devkit/architect';
import { Target } from '@angular-devkit/architect';
import { NullLogger } from '@angular-devkit/core/src/logger';
import { RoutingModule } from "guess-parser/dist/common/interfaces";


describe('Prerender Builder Utils', () => {
  describe('#getRoutes', () => {
    const ROUTES_FILE = './routes.txt';
    const ROUTES_FILE_CONTENT = ['/route1', '/route1', '/route2', '/route3'].join('\n');
    const ROUTES = ['/route3', '/route3', '/route4'];
    const GUESSED_ROUTES = [{ path: '/route4' }, { path: '/route5' }, { path: '/**' }, { path: '/user/:id' }];

    const CONTEXT = {
      workspaceRoot: '/path/to/angular/json',
      getTargetOptions: () => ({ tsConfig: 'tsconfig.app.json' }),
      logger: new NullLogger(),
    } as unknown as Architect.BuilderContext;

    let parseAngularRoutesSpy: jasmine.Spy;
    let loggerErrorSpy: jasmine.Spy;

    beforeEach(() => {
      spyOn(fs, 'readFileSync').and.returnValue(ROUTES_FILE_CONTENT);
      spyOn(Architect, 'targetFromTargetString').and.returnValue({} as Target);
      parseAngularRoutesSpy = spyOn(guessParser, 'parseAngularRoutes').and.returnValue(GUESSED_ROUTES as RoutingModule[]);
      loggerErrorSpy = spyOn(CONTEXT.logger, 'error');
    });

    it('Should return the union of the routes from routes, routesFile, and the extracted routes without any parameterized routes', async () => {
      const options = { routes: ROUTES, routesFile: ROUTES_FILE, guessRoutes: true } as unknown as PrerenderBuilderOptions;
      const routes = await getRoutes(options, CONTEXT);
      expect(routes).toContain('/route1');
      expect(routes).toContain('/route2');
      expect(routes).toContain('/route3');
      expect(routes).toContain('/route4');
      expect(routes).toContain('/route5');
    });

    it('Should return only the given routes', async () => {
      const options = { routes: ROUTES } as PrerenderBuilderOptions;
      const routes = await getRoutes(options, CONTEXT);
      expect(routes).toContain('/route3');
      expect(routes).toContain('/route4');
    });

    it('Should return the routes from the routesFile', async () => {
      const options = { routesFile: ROUTES_FILE } as PrerenderBuilderOptions;
      const routes = await getRoutes(options, CONTEXT);
      expect(routes).toContain('/route1');
      expect(routes).toContain('/route2');
      expect(routes).toContain('/route3');
    });

    it('Should catch errors thrown by parseAngularRoutes', async () => {
      const options = { routes: ROUTES, guessRoutes: true } as PrerenderBuilderOptions;
      parseAngularRoutesSpy.and.throwError('Test Error');
      const routes = await getRoutes(options, CONTEXT);
      expect(routes).toContain('/route3');
      expect(routes).toContain('/route4');
      expect(loggerErrorSpy).toHaveBeenCalled();
    });
  });
});
