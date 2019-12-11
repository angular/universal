/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {HostTree} from '@angular-devkit/schematics';
import {SchematicTestRunner, UnitTestTree} from '@angular-devkit/schematics/testing';
import {getSystemPath, normalize, virtualFs} from '@angular-devkit/core';
import {TempScopedNodeJsSyncHost} from '@angular-devkit/core/node/testing';
import * as shx from 'shelljs';

import {collectionPath, createTestApp} from '../testing/test-app';

import {addUniversalCommonRule, AddUniversalOptions} from './index';

describe('Add Schematic Rule', () => {
  const defaultOptions: AddUniversalOptions = {
    clientProject: 'test-app',
    serverFileName: 'server.ts',
  };

  let runner: SchematicTestRunner;
  let host: TempScopedNodeJsSyncHost;
  let tree: UnitTestTree;
  let tmpDirPath: string;
  let previousWorkingDir: string;

  beforeEach(async () => {
    runner = new SchematicTestRunner('schematics', collectionPath);
    host = new TempScopedNodeJsSyncHost();

    previousWorkingDir = shx.pwd();
    tmpDirPath = getSystemPath(host.root);

    // Switch into the temporary directory path. This allows us to run
    // the schematic against our custom unit test tree.
    shx.cd(tmpDirPath);

    tree = await createTestApp(runner, {}, new HostTree(host));
  });

  afterEach(() => {
    shx.cd(previousWorkingDir);
    shx.rm('-r', tmpDirPath);
  });

  it('should update angular.json', async () => {
    await callRule();
    const contents = JSON.parse(tree.readContent('angular.json'));
    const architect = contents.projects['test-app'].architect;
    expect(architect.build.configurations.production).toBeDefined();
    expect(architect.build.options.outputPath).toBe('dist/test-app/browser');
    expect(architect.server.options.outputPath).toBe('dist/test-app/server');
    expect(architect.server.options.main).toBe('projects/test-app/server.ts');
    expect(architect['serve-ssr'].options.serverTarget).toBe('test-app:server');
    expect(architect['serve-ssr'].options.browserTarget).toBe('test-app:build');
    expect(architect['prerender'].options.serverTarget).toBe('test-app:server:production');
    expect(architect['prerender'].options.browserTarget).toBe('test-app:build:production');

    const productionConfig = architect.server.configurations.production;
    expect(productionConfig.fileReplacements).toBeDefined();
    expect(productionConfig.sourceMap).toBeDefined();
    expect(productionConfig.optimization).toBeDefined();

    const productionServeSSRConfig = architect['serve-ssr'].configurations.production;
    expect(productionServeSSRConfig.serverTarget).toBe('test-app:server:production');
    expect(productionServeSSRConfig.browserTarget).toBe('test-app:build:production');
  });

  it('should add scripts to package.json', async () => {
    await callRule();
    const {scripts} = JSON.parse(tree.readContent('package.json'));
    expect(scripts['build:ssr']).toBe('ng build --prod && ng run test-app:server:production');
    expect(scripts['serve:ssr']).toBe('node dist/test-app/server/main.js');
    expect(scripts['dev:ssr']).toBe('ng run test-app:serve-ssr');
    expect(scripts['prerender']).toBe('ng run test-app:prerender');
  });

  it('should add devDependency: @nguniversal/builders', async () => {
    await callRule();
    const {devDependencies} = JSON.parse(tree.readContent('package.json'));
    expect(Object.keys(devDependencies)).toContain('@nguniversal/builders');
  });

  it(`should update 'tsconfig.server.json' files with main file`, async () => {
    await callRule();
    const contents = JSON.parse(tree.readContent('/projects/test-app/tsconfig.server.json'));
    expect(contents.files).toEqual([
      'src/main.server.ts',
      'server.ts',
    ]);
  });

  it(`should work when server target already exists`, async () => {
    tree = await runner
      .runExternalSchematicAsync('@schematics/angular', 'universal', defaultOptions, tree)
      .toPromise();

    await callRule();

    const contents = JSON.parse(tree.readContent('/projects/test-app/tsconfig.server.json'));
    expect(contents.files).toEqual([
      'src/main.server.ts',
      'server.ts',
    ]);
  });

  fit(`should set 'initialNavigation' to enabled`, async () => {
    const routerPath = '/projects/test-app/src/app/app-routing.module.ts';
    tree.files.forEach(f => writeFile(f, tree.readContent(f)));
    await callRule();
    expect(tree.readContent(routerPath)).toContain('initialNavigation: "enabled"');
  });

  function callRule() {
    return runner.callRule(addUniversalCommonRule(defaultOptions), tree).toPromise();
  }

  function writeFile(filePath: string, content: string) {
    // Update the temp file system host to reflect the changes in the real file system.
    // This is still necessary since we depend on the real file system for parsing the
    // TypeScript project.
    host.sync.write(normalize(filePath), virtualFs.stringToFileBuffer(content));
    if (tree.exists(filePath)) {
      tree.overwrite(filePath, content);
    } else {
      tree.create(filePath, content);
    }
  }
});
