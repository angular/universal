/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as fs from 'fs';
import { getRoutes, groupArray } from './utils';

describe('Prerender Builder Utils', () => {
  describe('#getRoutes', () => {
    const WORKSPACE_ROOT = '/path/to/angular/json';
    const ROUTES_FILE = './routes.txt';
    const ROUTES_FILE_CONTENT = ['/route1', '/route1', '/route2', '/route3'].join('\n');
    const ROUTES = ['/route3', '/route3', '/route4'];

    beforeEach(() => {
      spyOn(fs, 'readFileSync').and.returnValue(ROUTES_FILE_CONTENT);
    });

    it('Should return the deduped union of options.routes and options.routesFile - routes and routesFile defined', () => {
      const routes = getRoutes(WORKSPACE_ROOT, ROUTES_FILE, ROUTES);
      expect(routes).toEqual(['/route1', '/route2', '/route3', '/route4']);
    });

    it('Should return the deduped union of options.routes and options.routesFile - only routes defined', () => {
      const routes = getRoutes(WORKSPACE_ROOT, undefined, ROUTES);
      expect(routes).toEqual(['/route3', '/route4']);
    });

    it('Should return the deduped union of options.routes and options.routesFile - only routes file defined', () => {
      const routes = getRoutes(WORKSPACE_ROOT, ROUTES_FILE, undefined);
      expect(routes).toEqual(['/route1', '/route2', '/route3']);
    });
  });

  describe('#groupArray', () => {
    const ARRAY = [0, 1, 2, 3, 4];
    it('Should group an array into numGroups groups', () => {
      const result1 = groupArray(ARRAY, 1);
      const result2 = groupArray(ARRAY, 2);
      const result3 = groupArray(ARRAY, 3);
      const result4 = groupArray(ARRAY, 4);
      const result5 = groupArray(ARRAY, 5);
      expect(result1).toEqual([[0, 1, 2, 3, 4]]);
      expect(result2).toEqual([[0, 2, 4], [1, 3]]);
      expect(result3).toEqual([[0, 3], [1, 4], [2]]);
      expect(result4).toEqual([[0, 4], [1], [2], [3]]);
      expect(result5).toEqual([[0], [1], [2], [3], [4]]);
    });

    it('Should handle 0 or less numGroups', () => {
      const result1 = groupArray(ARRAY, 0);
      const result2 = groupArray(ARRAY, -1);
      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
    });

    // This happens when there are more groups requested than items in the array.
    it('Should leave excess groups empty', () => {
      const result = groupArray(ARRAY, 7);
      expect(result).toEqual([[0], [1], [2], [3], [4], [], []]);
    });
  });
});
