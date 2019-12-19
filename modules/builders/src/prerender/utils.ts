/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { BuilderContext } from '@angular-devkit/architect';
import { PrerenderBuilderOptions } from './index';

import * as fs from 'fs';
import * as path from 'path';

/**
 * Returns the concatenation of options.routes and the contents of options.routeFile.
 */
export function getRoutes(
  options: PrerenderBuilderOptions,
  context: BuilderContext
) {
  let routes = options.routes || [];
  if (options.routeFile) {
    const routeFilePath = path.resolve(context.workspaceRoot, options.routeFile);

    // Should blow up if a route file is given and we couldn't find it.
    if (!fs.existsSync(routeFilePath)) {
      throw new Error(`Could not find file ${routeFilePath}`);
    }

    routes = fs.readFileSync(routeFilePath!, 'utf8')
      .split('\n')
      .filter(v => !!v)
      .concat(routes);
  }
  return Array.from(new Set(routes));
}
