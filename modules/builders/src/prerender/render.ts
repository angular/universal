/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as fs from 'fs';
import * as path from 'path';

const args = process.argv.slice(2);
const pid = parseInt(args[0]);
const numProcesses = parseInt(args[1]);
const indexHtml = args[2];
const serverBundlePath = args[3];
const browserOutputPath = args[4];
const allRoutes = args.slice(5);

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
 * Handles importing the server bundle.
 */
async function getServerBundle(bundlePath: string) {
  const {
    AppServerModule,
    AppServerModuleNgFactory,
    renderModule,
    renderModuleFactory,
  } = await import(bundlePath);

  if (renderModuleFactory && AppServerModuleNgFactory) {
    // Happens when in ViewEngine mode.
    return {
      renderModuleFn: renderModuleFactory,
      AppServerModuleDef: AppServerModuleNgFactory,
    };
  }

  if (renderModule && AppServerModule) {
    // Happens when in Ivy mode.
    return {
      renderModuleFn: renderModule,
      AppServerModuleDef: AppServerModule,
    };
  }
  throw new Error(`renderModule method and/or AppServerModule were not exported from: ${serverBundlePath}.`);
}

/**
 * Renders each route in routes and writes them to <outputPath>/<route>/index.html.
 */
export async function renderRoutes(
  routes: Array<string>,
  baseHtml: string,
  outputPath: string,
  bundlePath: string,
  ) {
  const { renderModuleFn, AppServerModuleDef } = await getServerBundle(bundlePath);
  const browserIndexOutputPath = path.join(outputPath, 'index.html');
  for (const route of routes) {
    const renderOpts = {
      document: baseHtml + '<!-- This page was prerendered with Angular Universal -->',
      url: route,
    };
    const html = await renderModuleFn(AppServerModuleDef, renderOpts);

    const outputFolderPath = path.join(outputPath, route);
    const outputIndexPath = path.join(outputFolderPath, 'index.html');

    // This case happens when we are prerendering "/".
    if (browserIndexOutputPath === outputIndexPath) {
      const browserIndexOutputPathOriginal = path.join(outputPath, 'index.original.html');
      fs.writeFileSync(browserIndexOutputPathOriginal, baseHtml);
    }

    try {
      fs.mkdirSync(outputFolderPath, { recursive: true });
      fs.writeFileSync(outputIndexPath, html);
      const bytes = Buffer.byteLength(html).toFixed(0);
      process.send!({ success: true, outputIndexPath, bytes });
    } catch (e) {
      process.send!({ success: false, outputIndexPath });
    }
  }
}

const { startIndex: start, endIndex: end } = getRange(pid, numProcesses, allRoutes.length);
const routeSubset = allRoutes.slice(start, end);

renderRoutes(routeSubset, indexHtml, browserOutputPath, serverBundlePath);
