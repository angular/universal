/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as fs from 'fs';
import { parseAngularRoutes } from 'guess-parser';
import * as path from 'path';

/**
 * Returns the union of routes, the contents of routesFile if given,
 * and the static routes extracted if shouldGuessRoutes is set to true.
 */
export function getRoutes(
  workspaceRoot: string,
  routesFile?: string,
  routes: string[] = [],
  shouldGuessRoutes?: boolean,
): string[] {
  let routesFileResult: string[] = [];
  let extractedRoutes: string[] = [];
  if (routesFile) {
    const routesFilePath = path.resolve(workspaceRoot, routesFile);

    routesFileResult = fs.readFileSync(routesFilePath, 'utf8')
      .split(/\r?\n/)
      .filter(v => !!v);
  }

  if (shouldGuessRoutes) {
    extractedRoutes = parseAngularRoutes(path.join(workspaceRoot, 'tsconfig.json'))
      .map(routeObj => routeObj.path)
      .filter(route => !route.includes('*') && !route.includes(':'));
  }

  return [...new Set([...routesFileResult, ...routes, ...extractedRoutes])];
}
