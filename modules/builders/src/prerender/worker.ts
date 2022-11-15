/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import type { Type } from '@angular/core';
import type * as platformServer from '@angular/platform-server';
import type { ɵInlineCriticalCssProcessor } from '@nguniversal/common/tools';
import * as fs from 'fs';
import * as path from 'path';
import { workerData } from 'worker_threads';
import { loadEsmModule } from '../utils/utils';

export interface RenderOptions {
  indexFile: string;
  deployUrl: string;
  inlineCriticalCss: boolean;
  minifyCss: boolean;
  outputPath: string;
  serverBundlePath: string;
  route: string;
}
export interface RenderResult {
  errors?: string[];
  warnings?: string[];
}

/**
 * The fully resolved path to the zone.js package that will be loaded during worker initialization.
 * This is passed as workerData when setting up the worker via the `piscina` package.
 */
const { zonePackage } = workerData as {
  zonePackage: string;
};

/**
 * Renders each route in routes and writes them to <outputPath>/<route>/index.html.
 */
async function render({
  indexFile,
  deployUrl,
  minifyCss,
  outputPath,
  serverBundlePath,
  route,
  inlineCriticalCss,
}: RenderOptions): Promise<RenderResult> {
  const result = {} as RenderResult;
  const browserIndexOutputPath = path.join(outputPath, indexFile);
  const outputFolderPath = path.join(outputPath, route);
  const outputIndexPath = path.join(outputFolderPath, 'index.html');

  const { AppServerModule, renderModule } = (await import(serverBundlePath)) as {
    renderModule: typeof platformServer.renderModule | undefined;
    AppServerModule: Type<unknown> | undefined;
  };

  if (!renderModule) {
    throw new Error(`renderModule was not exported from: ${serverBundlePath}.`);
  }

  if (!AppServerModule) {
    throw new Error(`AppServerModule was not exported from: ${serverBundlePath}.`);
  }

  const indexBaseName = fs.existsSync(path.join(outputPath, 'index.original.html'))
    ? 'index.original.html'
    : indexFile;
  const browserIndexInputPath = path.join(outputPath, indexBaseName);
  let document = await fs.promises.readFile(browserIndexInputPath, 'utf8');
  document = document.replace(
    '</html>',
    '<!-- This page was prerendered with Angular Universal -->\n</html>',
  );
  if (inlineCriticalCss) {
    // Workaround for https://github.com/GoogleChromeLabs/critters/issues/64
    document = document.replace(
      / media="print" onload="this\.media='all'"><noscript><link .+?><\/noscript>/g,
      '>',
    );
  }

  let html = await renderModule(AppServerModule, {
    document,
    url: route,
  });

  if (inlineCriticalCss) {
    const inlineCriticalCssProcessor = new InlineCriticalCssProcessor({
      deployUrl: deployUrl,
      minify: minifyCss,
    });

    const { content, warnings, errors } = await inlineCriticalCssProcessor.process(html, {
      outputPath,
    });
    result.errors = errors;
    result.warnings = warnings;
    html = content;
  }

  // This case happens when we are prerendering "/".
  if (browserIndexOutputPath === outputIndexPath) {
    const browserIndexOutputPathOriginal = path.join(outputPath, 'index.original.html');
    fs.renameSync(browserIndexOutputPath, browserIndexOutputPathOriginal);
  }

  fs.mkdirSync(outputFolderPath, { recursive: true });
  fs.writeFileSync(outputIndexPath, html);

  return result;
}

let InlineCriticalCssProcessor: typeof ɵInlineCriticalCssProcessor;
/**
 * Initializes the worker when it is first created by loading the Zone.js package
 * into the worker instance.
 *
 * @returns A promise resolving to the render function of the worker.
 */
async function initialize() {
  const { ɵInlineCriticalCssProcessor } = await loadEsmModule<
    typeof import('@nguniversal/common/tools')
  >('@nguniversal/common/tools');

  InlineCriticalCssProcessor = ɵInlineCriticalCssProcessor;

  // Setup Zone.js
  await import(zonePackage);

  // Return the render function for use
  return render;
}

/**
 * The default export will be the promise returned by the initialize function.
 * This is awaited by piscina prior to using the Worker.
 */
export default initialize();
