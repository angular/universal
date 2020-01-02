/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { BuilderContext, BuilderOutput, createBuilder, targetFromTargetString } from '@angular-devkit/architect';
import { fork } from 'child_process';
import { json } from '@angular-devkit/core';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import { Schema } from './schema';
import { getRoutes } from './utils';

export type PrerenderBuilderOptions = Schema & json.JsonObject;

export type PrerenderBuilderOutput = BuilderOutput;

type BuildBuilderOutput = BuilderOutput & {
  baseOutputPath: string;
  outputPaths: string[];
  outputPath: string;
};

type ScheduleBuildsOutput = BuilderOutput & {
  serverResult?: BuildBuilderOutput;
  browserResult?: BuildBuilderOutput;
};

/**
 * Schedules the server and browser builds and returns their results if both builds are successful.
 */
async function _scheduleBuilds(
  options: PrerenderBuilderOptions,
  context: BuilderContext
): Promise<ScheduleBuildsOutput> {
  const browserTarget = targetFromTargetString(options.browserTarget);
  const serverTarget = targetFromTargetString(options.serverTarget);

  const browserTargetRun = await context.scheduleTarget(browserTarget, {
    watch: false,
    serviceWorker: false,
    // todo: handle service worker augmentation
  });
  const serverTargetRun = await context.scheduleTarget(serverTarget, {
    watch: false,
  });

  try {
    const [browserResult, serverResult] = await Promise.all([
      browserTargetRun.result as unknown as BuildBuilderOutput,
      serverTargetRun.result as unknown as BuildBuilderOutput,
    ]);

    const success =
      browserResult.success && serverResult.success && browserResult.baseOutputPath !== undefined;
    const error = browserResult.error || serverResult.error as string;

    return { success, error, browserResult, serverResult };
  } catch (e) {
    return { success: false, error: e.message };
  } finally {
    await Promise.all([browserTargetRun.stop(), serverTargetRun.stop()]);
  }
}

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
  routes: string[],
  context: BuilderContext,
  browserResult: BuildBuilderOutput,
  serverResult: BuildBuilderOutput,
): Promise<BuildBuilderOutput> {
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

    const numProcesses = Math.min(os.cpus().length, routes!.length);
    context.logger.info(`\nPrerendering ${routes!.length} route(s) to ${outputPath}`);

    const childProcesses = Array.from({ length: numProcesses }, (_, idx) => {
      const { startIndex, endIndex } = getRange(idx, numProcesses, routes!.length);
      const routesSubset = routes!.slice(startIndex, endIndex);
      return new Promise((resolve, reject) => {
        const child = fork(workerFile, [
          indexHtml,
          serverBundlePath,
          outputPath,
          ...routesSubset,
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
export async function execute(
  options: PrerenderBuilderOptions,
  context: BuilderContext
): Promise<PrerenderBuilderOutput> {
  const routes = getRoutes(context.workspaceRoot, options.routesFile, options.routes);
  if (!routes.length) {
    throw new Error('No routes found.');
  }
  const result = await _scheduleBuilds(options, context);
  const { success, error, browserResult, serverResult } = result;
  if (!success || !browserResult || !serverResult) {
    return { success, error } as BuilderOutput;
  }

  return _renderUniversal(routes, context, browserResult, serverResult);
}

export default createBuilder(execute);
