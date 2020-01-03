/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { BuilderContext, targetFromTargetString } from '@angular-devkit/architect';
import * as fs from 'fs';
import { parseAngularRoutes } from 'guess-parser';
import * as path from 'path';

import { PrerenderBuilderOptions } from './models';

/**
 * Returns the union of routes, the contents of routesFile if given,
 * and the static routes extracted if guessRoutes is set to true.
 */
export async function getRoutes(
  options: PrerenderBuilderOptions,
  context: BuilderContext,
): Promise<string[]> {
  let routes: string[] = options.routes ? options.routes : [];

  if (options.routesFile) {
    const routesFilePath = path.resolve(context.workspaceRoot, options.routesFile);
    routes = routes.concat(
      fs.readFileSync(routesFilePath, 'utf8')
        .split(/\r?\n/)
        .filter(v => !!v)
    );
  }

  if (options.guessRoutes) {
    const browserTarget = targetFromTargetString(options.browserTarget);
    const { tsConfig } = await context.getTargetOptions(browserTarget);
    if (tsConfig) {
      try {
        routes = routes.concat(
          parseAngularRoutes(path.join(context.workspaceRoot, tsConfig as string))
            .map(routeObj => routeObj.path)
            .filter(route => !route.includes('*') && !route.includes(':'))
        );
      } catch (e) {
        context.logger.error('Unable to extract routes from application.', e);
      }
    }
  }

  return [...new Set(routes)];
}
