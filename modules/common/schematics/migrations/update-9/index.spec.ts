/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { callRule } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { version9UpdateRule } from './index';
import { of } from 'rxjs';
import { createTestApp, collectionPath } from '../../testing/test-app';

describe('Migration to version 9', () => {
  const schematicRunner = new SchematicTestRunner(
    'migrations',
    collectionPath,
  );

  let tree: UnitTestTree;
  beforeEach(async () => {
    tree =  await createTestApp();
    tree = await schematicRunner
      .runExternalSchematicAsync(
        '@schematics/angular',
        'universal',
        {
          clientProject: 'test-app',
        },
        tree,
      )
      .toPromise();

    // create old stucture
    tree.create('/projects/test-app/server.ts', 'server content');
    tree.create('/projects/test-app/webpack.server.config.js', 'webpack config content');

    const pkg = JSON.parse(tree.readContent('/package.json'));
    pkg.scripts['compile:server'] = '';
    pkg.scripts['build:client-and-server-bundles'] = '';

    pkg.devDependencies['webpack-cli'] = '0.0.0';
    pkg.devDependencies['ts-loader'] = '0.0.0';

    tree.overwrite('/package.json', JSON.stringify(pkg, null, 2));
  });

  it(`should backup old 'server.ts' and 'webpack.server.config.js'`, async () => {
    const newTree = await callRule(version9UpdateRule(''), of(tree), null!).toPromise();
    expect(newTree.exists('/projects/test-app/server.ts.bak')).toBeTruthy();
    expect(newTree.exists('/projects/test-app/webpack.server.config.js.bak')).toBeTruthy();
  });

  it(`should remove dependencies on 'webpack-cli' and 'ts-loader'`, async () => {
    const newTree = await callRule(version9UpdateRule(''), of(tree), null!).toPromise();
    const { devDependencies } = JSON.parse(newTree.read('/package.json')!.toString());
    expect(devDependencies['ts-loader']).toBeUndefined();
    expect(devDependencies['webpack-cli']).toBeUndefined();
  });
});
