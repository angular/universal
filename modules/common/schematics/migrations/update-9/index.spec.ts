/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { EmptyTree, callRule } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { version9UpdateRule } from './index';
import { of } from 'rxjs';

describe('Migration to version 9', () => {
  const schematicRunner = new SchematicTestRunner(
    'migrations',
    require.resolve('../../collection.json'),
  );

  let tree: UnitTestTree;
  beforeEach(async () => {
    tree = new UnitTestTree(new EmptyTree());
    tree = await schematicRunner
      .runExternalSchematicAsync(
        '@schematics/angular',
        'ng-new',
        {
          name: 'migration-app',
          version: '1.2.3',
          directory: '.',
          style: 'css',
        },
        tree,
      )
      .toPromise();
    tree = await schematicRunner
      .runExternalSchematicAsync(
        '@schematics/angular',
        'universal',
        {
          clientProject: 'migration-app',
        },
        tree,
      )
      .toPromise();

    // create old stucture
    tree.create('/server.ts', 'server content');
    tree.create('/webpack.server.config.js', 'webpack config content');

    const pkg = JSON.parse(tree.readContent('/package.json'));
    pkg.scripts['compile:server'] = '';
    pkg.scripts['build:client-and-server-bundles'] = '';

    pkg.devDependencies['webpack-cli'] = '0.0.0';
    pkg.devDependencies['ts-loader'] = '0.0.0';

    tree.overwrite('/package.json', JSON.stringify(pkg, null, 2));
  });

  it(`should backup old 'server.ts' and 'webpack.server.config.js'`, async () => {
    const newTree = await callRule(version9UpdateRule(''), of(tree), null!).toPromise();
    expect(newTree.exists('/server.ts.bak')).toBeTruthy();
    expect(newTree.exists('/webpack.server.config.js.bak')).toBeTruthy();
  });

  it(`should remove dependencies on 'webpack-cli' and 'ts-loader'`, async () => {
    const newTree = await callRule(version9UpdateRule(''), of(tree), null!).toPromise();
    const { devDependencies } = JSON.parse(newTree.read('/package.json')!.toString());
    expect(devDependencies['ts-loader']).toBeUndefined();
    expect(devDependencies['webpack-cli']).toBeUndefined();
  });
});
