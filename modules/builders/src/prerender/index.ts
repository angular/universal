/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { BuilderOutput, createBuilder, BuilderContext, targetFromTargetString } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { Schema as BuildWebpackPrerenderSchema } from './schema';

import { fork } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export type BuilderOutputWithPaths = JsonObject & BuilderOutput & {
  baseOutputPath: string;
  outputPaths: string[];
  outputPath: string;
};

/**
 * Determines the range of items for the given bucket id so
 * that the number of items in each bucket is evenly distributed.
 */
function getRange(id: number, numBuckets: number, numItems: number) {
  const remainder = numItems % numBuckets;
  const minBucketSize = Math.floor(numItems / numBuckets);

  const startShift = id < remainder ? id : remainder;
  const endShift = id < remainder ? (id + 1) : remainder;

  const startIndex = id * minBucketSize + startShift;
  const endIndex = (id + 1) * minBucketSize + endShift;

  return { startIndex, endIndex };
}

/**
 * Renders each route in options.routes and writes them to
 * <route>/index.html for each output path in the browser result.
 */
async function _renderUniversal(
  options: BuildWebpackPrerenderSchema,
  context: BuilderContext,
  browserResult: BuilderOutputWithPaths,
  serverResult: BuilderOutputWithPaths,
): Promise<BuilderOutputWithPaths> {
  // We need to render the routes for each locale from the browser output.
  for (const outputPath of browserResult.outputPaths) {
    const workerFile = path.join(__dirname, 'render.js');
    const localeDirectory = path.relative(browserResult.baseOutputPath, outputPath);
    const browserIndexOutputPath = path.join(outputPath, 'index.html');
    const indexHtml = fs.readFileSync(browserIndexOutputPath, 'utf8');

    const { baseOutputPath = '' } = serverResult;
    const serverBundlePath = path.join(baseOutputPath, localeDirectory, 'main.js');
    if (!fs.existsSync(serverBundlePath)) {
      throw new Error(`Could not find the main bundle: ${serverBundlePath}`);
    }

    const numProcesses = Math.min(os.cpus().length, options.routes!.length);
    context.logger.info(`\nPrerendering ${options.routes!.length} route(s) to ${outputPath}`);

    const childProcesses = Array.from({ length: numProcesses }, (_, idx) => {
      const { startIndex, endIndex } = getRange(idx, numProcesses, options.routes!.length);
      const routes = options.routes!.slice(startIndex, endIndex);
      return new Promise((resolve, reject) => {
        const child = fork(workerFile, [
          indexHtml,
          serverBundlePath,
          outputPath,
          ...routes,
        ]);

        child.on('message', data => {
          if (data.success) {
            context.logger.info(`CREATE ${data.outputIndexPath} (${data.bytes} bytes)`);
          } else {
            context.logger.error(`Unable to render ${data.outputIndexPath}`);
          }
        });

        child.on('exit', () => resolve(child));
        child.on('error', reject);
      });
    });

    // Wait for all of the forked processes to finish.
    await Promise.all(childProcesses);
  }
  return browserResult;
}

/**
 * Builds the browser and server, then renders each route in options.routes
 * and writes them to prerender/<route>/index.html for each output path in
 * the browser result.
 */
export async function _prerender(
  options: JsonObject & BuildWebpackPrerenderSchema,
  context: BuilderContext
): Promise<BuilderOutput> {
  if (!options.routes || options.routes.length === 0) {
    throw new Error('No routes found. Specify routes to render using `prerender.options.routes` in angular.json.');
  }
  const browserTarget = targetFromTargetString(options.browserTarget);
  const serverTarget = targetFromTargetString(options.serverTarget);

  const browserTargetRun = await context.scheduleTarget(browserTarget, {
    watch: false,
    serviceWorker: false,
  });
  const serverTargetRun = await context.scheduleTarget(serverTarget, {
    watch: false,
  });

  try {
    const [browserResult, serverResult] = await Promise.all([
      browserTargetRun.result as unknown as BuilderOutputWithPaths,
      serverTargetRun.result as unknown as BuilderOutputWithPaths,
    ]);

    if (browserResult.success === false || browserResult.baseOutputPath === undefined) {
      return browserResult;
    }
    if (serverResult.success === false) {
      return serverResult;
    }

    return await _renderUniversal(options, context, browserResult, serverResult);
  } catch (e) {
    return { success: false, error: e.message };
  } finally {
    await Promise.all([browserTargetRun.stop(), serverTargetRun.stop()]);
  }
}

export default createBuilder(_prerender);
