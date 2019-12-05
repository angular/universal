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

import { Buffer } from 'buffer';
import * as fs from 'fs';
import * as path from 'path';

export type BuilderOutputWithPaths = JsonObject & BuilderOutput & {
  baseOutputPath: string;
  outputPaths: string[];
  outputPath: string;
};

/**
 * A wrapper for import to make unit tests possible.
 */
export function _importWrapper(importPath: string) {
  return import(importPath);
}

/**
 * Renders each route in options.routes and writes them to
 * <route>/index.html for each output path in the browser result.
 */
export async function _renderUniversal(
  options: BuildWebpackPrerenderSchema,
  context: BuilderContext,
  browserResult: BuilderOutputWithPaths,
  serverResult: BuilderOutputWithPaths,
): Promise<BuilderOutputWithPaths> {
  // We need to render the routes for each locale from the browser output.
  for (const outputPath of browserResult.outputPaths) {
    const localeDirectory = path.relative(browserResult.baseOutputPath, outputPath);
    const browserIndexOutputPath = path.join(outputPath, 'index.html');
    const indexHtml = fs.readFileSync(browserIndexOutputPath, 'utf8');
    const { AppServerModuleDef, renderModuleFn } =
      await exports._getServerModuleBundle(options, context, serverResult, localeDirectory);

    context.logger.info(`\nPrerendering ${options.routes.length} route(s) to ${outputPath}`);

    // Render each route and write them to <route>/index.html.
    for (const route of options.routes) {
      const renderOpts = {
        document: indexHtml,
        url: route,
      };
      const html = await renderModuleFn(AppServerModuleDef, renderOpts);

      const outputFolderName = route === '/' ? 'index' : route;
      const outputFolderPath = path.join(outputPath, outputFolderName);
      const outputIndexPath = path.join(outputFolderPath, 'index.html');

      // There will never conflicting output folders
      // because items in options.routes must be unique.
      try {
        fs.mkdirSync(outputFolderPath);
        fs.writeFileSync(outputIndexPath, html);
        const bytes = Buffer.byteLength(html).toFixed(0);
        context.logger.info(
          `CREATE ${outputFolderName}/index.html (${bytes} bytes)`
        );
      } catch (e) {
        context.logger.error(`unable to render ${outputFolderName}/index.html`);
      }
    }
  }
  return browserResult;
}

/**
 * If the app module bundle path is not specified in options.appModuleBundle,
 * this method searches for what is usually the app module bundle file and
 * returns its server module bundle.
 *
 * Throws if no app module bundle is found.
 */
export async function _getServerModuleBundle(
  options: BuildWebpackPrerenderSchema,
  context: BuilderContext,
  serverResult: BuilderOutputWithPaths,
  browserLocaleDirectory: string,
) {
  let serverBundlePath;
  if (options.appModuleBundle) {
    serverBundlePath = path.join(context.workspaceRoot, options.appModuleBundle);
  } else {
    const { baseOutputPath = '' } = serverResult;
    const outputPath = path.join(baseOutputPath, browserLocaleDirectory);

    if (!fs.existsSync(outputPath)) {
      throw new Error(`Could not find server output directory: ${outputPath}.`);
    }

    const files = fs.readdirSync(outputPath, 'utf8');
    const re = /^main\.(?:[a-zA-Z0-9]{20}\.)?(?:bundle\.)?js$/;
    const maybeMain = files.filter(x => re.test(x))[0];

    if (!maybeMain) {
      throw new Error('Could not find the main bundle.');
    } else {
      serverBundlePath = path.join(outputPath, maybeMain);
    }
  }

  const {
    AppServerModule,
    AppServerModuleNgFactory,
    renderModule,
    renderModuleFactory,
  } = await exports._importWrapper(serverBundlePath);

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
 * Builds the browser and server, then renders each route in options.routes
 * and writes them to prerender/<route>/index.html for each output path in
 * the browser result.
 */
export async function _prerender(
  options: JsonObject & BuildWebpackPrerenderSchema,
  context: BuilderContext
): Promise<BuilderOutput> {
  if (!options.routes || options.routes.length === 0) {
    throw new Error('No routes found. options.routes must contain at least one route to render.');
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

    return await exports._renderUniversal(options, context, browserResult, serverResult);
  } catch (e) {
    return { success: false, error: e.message };
  } finally {
    await Promise.all([browserTargetRun.stop(), serverTargetRun.stop()]);
  }
}

export default createBuilder(_prerender);
