/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

export interface Schema {
  /**
   * Target to build.
   */
  browserTarget: string;
  /**
   * Whether or not the builder should extract routes and guess which paths to render.
   */
  guessRoutes?: boolean;
  /**
   * The number of cpus to use. Defaults to all but one.
   */
  htmlMinifyOptionsFile?: string;
  /**
   * The number of cpus to use. Defaults to all but one.
   */
  numProcesses?: number;
  /**
   * The routes to render.
   */
  routes?: string[];
  /**
   * The path to a file containing routes separated by newlines.
   */
  routesFile?: string;
  /**
   * Server target to use for prerendering the app.
   */
  serverTarget: string;
}
