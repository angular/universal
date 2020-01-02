/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Returns the concatenation of options.routes and the contents of options.routesFile.
 */
export function getRoutes(
  workspaceRoot: string,
  routesFile?: string,
  routes: string[] = [],
): string[] {
  let routesFileResult: string[] = [];
  if (routesFile) {
    const routesFilePath = path.resolve(workspaceRoot, routesFile);

    routesFileResult = fs.readFileSync(routesFilePath, 'utf8')
      .split(/\r?\n/)
      .filter(v => !!v);
  }

  return [...new Set([...routesFileResult, ...routes])];
}

/**
 * Evenly groups items in an array.
 * e.g. groupArray([1, 2, 3, 4], 2) => [[1, 2], [3, 4]]
 */
export function groupArray(array: any[], numGroups: number) {
  const groupedArray = [];
  for (let i = 0; i < numGroups; i++) {
    groupedArray.push(
      array.filter((_, index) => index % numGroups === i)
    );
  }

  return groupedArray;
}
