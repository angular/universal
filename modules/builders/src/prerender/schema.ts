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
   * The routes to render.
   */
  routes: string[];
  /**
   * Server target to use for prerendering the app.
   */
  serverTarget: string;
}
