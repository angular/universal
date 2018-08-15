/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {SchematicTestRunner, UnitTestTree} from '@angular-devkit/schematics/testing';
import * as path from 'path';
import {Schema as ApplicationOptions} from '@schematics/angular/application/schema';
import {Schema as WorkspaceOptions} from '@schematics/angular/workspace/schema';
import {Schema as UniversalOptions} from './schema';

describe('Universal Schematic', () => {
  const schematicRunner = new SchematicTestRunner(
    '@schematics/angular',
    path.join(__dirname, '../collection.json'),
  );
  const defaultOptions: UniversalOptions = {
    clientProject: 'bar',
  };
  // const workspaceUniversalOptions: UniversalOptions = {
  //   clientProject: 'workspace',
  // };

  const workspaceOptions: WorkspaceOptions = {
    name: 'workspace',
    newProjectRoot: 'projects',
    version: '6.0.0',
  };

  const appOptions: ApplicationOptions = {
    name: 'bar',
    inlineStyle: false,
    inlineTemplate: false,
    routing: false,
    style: 'css',
    skipTests: false,
    skipPackageJson: false,
  };

  const initialWorkspaceAppOptions: ApplicationOptions = {
    name: 'workspace',
    projectRoot: '',
    inlineStyle: false,
    inlineTemplate: false,
    routing: false,
    style: 'css',
    skipTests: false,
    skipPackageJson: false,
  };

  let appTree: UnitTestTree;

  beforeEach(() => {
    appTree = schematicRunner.runSchematic('workspace', workspaceOptions);
    appTree = schematicRunner.runSchematic('application', initialWorkspaceAppOptions, appTree);
    appTree = schematicRunner.runSchematic('application', appOptions, appTree);
  });

  it('should add dependency: @nguniversal/module-map-ngfactory-loader', () => {
    const tree = schematicRunner.runSchematic('universal', defaultOptions, appTree);
    const filePath = '/package.json';
    const contents = tree.readContent(filePath);
    expect(contents).toMatch(/\"@nguniversal\/module-map-ngfactory-loader\": \"/);
  });

  it('should add dependency: @nguniversal/express-engine', () => {
    const tree = schematicRunner.runSchematic('universal', defaultOptions, appTree);
    const filePath = '/package.json';
    const contents = tree.readContent(filePath);
    expect(contents).toMatch(/\"@nguniversal\/express-engine\": \"/);
  });

  it('should add dependency: express', () => {
    const tree = schematicRunner.runSchematic('universal', defaultOptions, appTree);
    const filePath = '/package.json';
    const contents = tree.readContent(filePath);
    expect(contents).toMatch(/\"express\": \"/);
  });

  it('should install npm dependencies', () => {
    schematicRunner.runSchematic('universal', defaultOptions, appTree);
    expect(schematicRunner.tasks.length).toBe(1);
    expect(schematicRunner.tasks[0].name).toBe('node-package');
    expect((schematicRunner.tasks[0].options as {command: string}).command).toBe('install');
  });
});
