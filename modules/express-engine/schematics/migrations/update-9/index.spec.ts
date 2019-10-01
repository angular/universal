/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { EmptyTree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';

describe('Migration to version 9', () => {
  const schematicRunner = new SchematicTestRunner(
    'migrations',
    require.resolve('../migration-collection.json'),
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
    pkg.devDependencies['@nguniversal/express-engine'] = '0.0.0';

    tree.overwrite('/package.json', JSON.stringify(pkg, null, 2));
  });

  it(`should backup old 'server.ts' and 'webpack.server.config.js'`, async () => {
    const newTree =
      await schematicRunner.runSchematicAsync('update-9', {}, tree.branch()).toPromise();

    expect(newTree.exists('/server.ts.bak')).toBeTruthy();
    expect(newTree.exists('/webpack.server.config.js.bak')).toBeTruthy();
  });

  it(`should create new 'server.ts'`, async () => {
    const newTree =
      await schematicRunner.runSchematicAsync('update-9', {}, tree.branch()).toPromise();

    expect(newTree.exists('/server.ts')).toBeTruthy();
    const serverContent = newTree.readContent('/server.ts');
    expect(serverContent).toContain('function run()');
    expect(serverContent).toContain(`export * from './src/main.server'`);
  });

  it(`should add 'server.ts' to 'tsconfig.server.json' files`, async () => {
    const newTree =
      await schematicRunner.runSchematicAsync('update-9', {}, tree.branch()).toPromise();

    const contents = JSON.parse(newTree.readContent('/tsconfig.server.json'));
    expect(contents.files).toEqual([
      'src/main.server.ts',
      'server.ts',
    ]);
  });

  it(`should remove dependencies on 'webpack-cli' and 'ts-loader'`, async () => {
    const newTree =
      await schematicRunner.runSchematicAsync('update-9', {}, tree.branch()).toPromise();

    const { devDependencies } = JSON.parse(newTree.readContent('/package.json'));
    expect(devDependencies['ts-loader']).toBeUndefined();
    expect(devDependencies['webpack-cli']).toBeUndefined();
  });

  it(`should update 'package.json' scripts`, async () => {
    const newTree =
      await schematicRunner.runSchematicAsync('update-9', {}, tree.branch()).toPromise();

    const { scripts } = JSON.parse(newTree.readContent('/package.json'));
    expect(scripts['build:client-and-server-bundles']).toBeUndefined();
    expect(scripts['compile:server']).toBeUndefined();
    expect(scripts['build:ssr'])
      .toBe('ng build --prod && ng run migration-app:server:production');
    expect(scripts['serve:ssr']).toBe('node dist/migration-app/server/main.js');
  });

  describe('mono-repo', () => {
    beforeEach(async () => {
      tree = await schematicRunner
        .runExternalSchematicAsync(
          '@schematics/angular',
          'application',
          {
            name: 'migration-app-two',
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
            clientProject: 'migration-app-two',
          },
          tree,
        )
        .toPromise();

      // create old stucture
      tree.create('/projects/migration-app-two/server.ts', 'server content');
      tree.create('/projects/migration-app-two/webpack.server.config.js', 'webpack content');
    });

    it(`should backup old 'server.ts' and 'webpack.server.config.js'`, async () => {
      const newTree =
        await schematicRunner.runSchematicAsync('update-9', {}, tree.branch()).toPromise();

      expect(newTree.exists('/projects/migration-app-two/server.ts.bak')).toBeTruthy();
      expect(newTree.exists('/projects/migration-app-two/webpack.server.config.js.bak'))
        .toBeTruthy();
    });

    it(`should create new 'server.ts'`, async () => {
      const newTree =
        await schematicRunner.runSchematicAsync('update-9', {}, tree.branch()).toPromise();

      expect(newTree.exists('/projects/migration-app-two/server.ts')).toBeTruthy();
      const serverContent = newTree.readContent('/projects/migration-app-two/server.ts');
      expect(serverContent).toContain('function run()');
      expect(serverContent).toContain(`export * from './src/main.server'`);
    });

    it(`should add 'server.ts' to 'tsconfig.server.json' files`, async () => {
      const newTree =
        await schematicRunner.runSchematicAsync('update-9', {}, tree.branch()).toPromise();

      const contents =
        JSON.parse(newTree.readContent('/projects/migration-app-two/tsconfig.server.json'));
      expect(contents.files).toEqual([
        'src/main.server.ts',
        'server.ts',
      ]);
    });
  });
});
