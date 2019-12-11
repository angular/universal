/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import {Tree} from '@angular-devkit/schematics';

/** Path to the collection file for the NgUniversal schematics */
export const collectionPath = require.resolve('@schematics/angular/collection.json');

/** Create a base app used for testing. */
export async function createTestApp(runner: SchematicTestRunner,
                                    appOptions = {},
                                    host?: Tree): Promise<UnitTestTree> {
  const tree = await runner.runExternalSchematicAsync('@schematics/angular', 'workspace', {
    name: 'workspace',
    version: '6.0.0',
    newProjectRoot: 'projects',
  }, host).toPromise();

  return runner.runExternalSchematicAsync(
    '@schematics/angular', 'application',
    {
      ...appOptions,
      name: 'test-app',
      routing: true,
    },
    tree
  ).toPromise();
}
