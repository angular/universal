/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { dirname, join, normalize, strings } from '@angular-devkit/core';
import {
  Rule,
  SchematicsException,
  Tree,
  apply,
  chain,
  externalSchematic,
  mergeWith,
  move,
  noop,
  template,
  url,
} from '@angular-devkit/schematics';
import { Schema as UniversalOptions } from '@schematics/angular/universal/schema';
import { DependencyType, addDependency, updateWorkspace } from '@schematics/angular/utility';
import { JSONFile } from '@schematics/angular/utility/json-file';
import { isStandaloneApp } from '@schematics/angular/utility/ng-ast-utils';
import { targetBuildNotFoundError } from '@schematics/angular/utility/project-targets';
import { BrowserBuilderOptions } from '@schematics/angular/utility/workspace-models';
import * as ts from 'typescript';

import {
  addInitialNavigation,
  findImport,
  getImportOfIdentifier,
  getOutputPath,
  getProject,
  stripTsExtension,
} from '../utils';

import { Schema as AddUniversalOptions } from './schema';

const SERVE_SSR_TARGET_NAME = 'serve-ssr';
const PRERENDER_TARGET_NAME = 'prerender';

function addScriptsRule(options: AddUniversalOptions): Rule {
  return async (host) => {
    const pkgPath = '/package.json';
    const buffer = host.read(pkgPath);
    if (buffer === null) {
      throw new SchematicsException('Could not find package.json');
    }

    const serverDist = await getOutputPath(host, options.project, 'server');
    const pkg = JSON.parse(buffer.toString()) as any;
    pkg.scripts = {
      ...pkg.scripts,
      'dev:ssr': `ng run ${options.project}:${SERVE_SSR_TARGET_NAME}`,
      'serve:ssr': `node ${serverDist}/main.js`,
      'build:ssr': `ng build && ng run ${options.project}:server`,
      'prerender': `ng run ${options.project}:${PRERENDER_TARGET_NAME}`,
    };

    host.overwrite(pkgPath, JSON.stringify(pkg, null, 2));
  };
}

function updateWorkspaceConfigRule(options: AddUniversalOptions): Rule {
  return () => {
    return updateWorkspace((workspace) => {
      const projectName = options.project;
      const project = workspace.projects.get(projectName);
      if (!project) {
        return;
      }

      const serverTarget = project.targets.get('server');
      serverTarget.options.main = join(
        normalize(project.root),
        stripTsExtension(options.serverFileName) + '.ts',
      );

      const serveSSRTarget = project.targets.get(SERVE_SSR_TARGET_NAME);
      if (serveSSRTarget) {
        return;
      }

      project.targets.add({
        name: SERVE_SSR_TARGET_NAME,
        builder: '@nguniversal/builders:ssr-dev-server',
        defaultConfiguration: 'development',
        options: {},
        configurations: {
          development: {
            browserTarget: `${projectName}:build:development`,
            serverTarget: `${projectName}:server:development`,
          },
          production: {
            browserTarget: `${projectName}:build:production`,
            serverTarget: `${projectName}:server:production`,
          },
        },
      });

      const prerenderTarget = project.targets.get(PRERENDER_TARGET_NAME);
      if (prerenderTarget) {
        return;
      }

      project.targets.add({
        name: PRERENDER_TARGET_NAME,
        builder: '@nguniversal/builders:prerender',
        defaultConfiguration: 'production',
        options: {
          routes: ['/'],
        },
        configurations: {
          production: {
            browserTarget: `${projectName}:build:production`,
            serverTarget: `${projectName}:server:production`,
          },
          development: {
            browserTarget: `${projectName}:build:development`,
            serverTarget: `${projectName}:server:development`,
          },
        },
      });
    });
  };
}

function updateServerTsConfigRule(options: AddUniversalOptions): Rule {
  return async (host) => {
    const project = await getProject(host, options.project);
    const serverTarget = project.targets.get('server');
    if (!serverTarget || !serverTarget.options) {
      return;
    }

    const tsConfigPath = serverTarget.options.tsConfig;
    if (!tsConfigPath || typeof tsConfigPath !== 'string') {
      // No tsconfig path
      return;
    }

    const tsConfig = new JSONFile(host, tsConfigPath);
    const filesAstNode = tsConfig.get(['files']);
    const serverFilePath = stripTsExtension(options.serverFileName) + '.ts';
    if (Array.isArray(filesAstNode) && !filesAstNode.some(({ text }) => text === serverFilePath)) {
      tsConfig.modify(['files'], [...filesAstNode, serverFilePath]);
    }
  };
}

function routingInitialNavigationRule(options: UniversalOptions): Rule {
  return async (host) => {
    const project = await getProject(host, options.project);
    const serverTarget = project.targets.get('server');
    if (!serverTarget || !serverTarget.options) {
      return;
    }

    const tsConfigPath = serverTarget.options.tsConfig;
    if (!tsConfigPath || typeof tsConfigPath !== 'string' || !host.exists(tsConfigPath)) {
      // No tsconfig path
      return;
    }

    const parseConfigHost: ts.ParseConfigHost = {
      useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
      readDirectory: ts.sys.readDirectory,
      fileExists: function (fileName: string): boolean {
        return host.exists(fileName);
      },
      readFile: function (fileName: string): string {
        return host.read(fileName).toString();
      },
    };
    const { config } = ts.readConfigFile(tsConfigPath, parseConfigHost.readFile);
    const parsed = ts.parseJsonConfigFileContent(
      config,
      parseConfigHost,
      dirname(normalize(tsConfigPath)),
    );
    const tsHost = ts.createCompilerHost(parsed.options, true);
    // Strip BOM as otherwise TSC methods (Ex: getWidth) will return an offset,
    // which breaks the CLI UpdateRecorder.
    // See: https://github.com/angular/angular/pull/30719
    tsHost.readFile = function (fileName: string): string {
      return host
        .read(fileName)
        .toString()
        .replace(/^\uFEFF/, '');
    };
    tsHost.directoryExists = function (directoryName: string): boolean {
      // When the path is file getDir will throw.
      try {
        const dir = host.getDir(directoryName);

        return !!(dir.subdirs.length || dir.subfiles.length);
      } catch {
        return false;
      }
    };
    tsHost.fileExists = function (fileName: string): boolean {
      return host.exists(fileName);
    };
    tsHost.realpath = function (path: string): string {
      return path;
    };
    tsHost.getCurrentDirectory = function () {
      return host.root.path;
    };

    const program = ts.createProgram(parsed.fileNames, parsed.options, tsHost);
    const typeChecker = program.getTypeChecker();
    const sourceFiles = program
      .getSourceFiles()
      .filter((f) => !f.isDeclarationFile && !program.isSourceFileFromExternalLibrary(f));
    const printer = ts.createPrinter();
    const routerModule = 'RouterModule';
    const routerSource = '@angular/router';

    sourceFiles.forEach((sourceFile) => {
      const routerImport = findImport(sourceFile, routerSource, routerModule);
      if (!routerImport) {
        return;
      }

      let routerModuleNode: ts.CallExpression;
      ts.forEachChild(sourceFile, function visitNode(node: ts.Node) {
        if (
          ts.isCallExpression(node) &&
          ts.isPropertyAccessExpression(node.expression) &&
          ts.isIdentifier(node.expression.expression) &&
          node.expression.name.text === 'forRoot'
        ) {
          const imp = getImportOfIdentifier(typeChecker, node.expression.expression);

          if (imp && imp.name === routerModule && imp.importModule === routerSource) {
            routerModuleNode = node;
          }
        }

        ts.forEachChild(node, visitNode);
      });

      if (routerModuleNode) {
        const print = printer.printNode(
          ts.EmitHint.Unspecified,
          addInitialNavigation(routerModuleNode),
          sourceFile,
        );

        const recorder = host.beginUpdate(sourceFile.fileName);
        recorder.remove(routerModuleNode.getStart(), routerModuleNode.getWidth());
        recorder.insertRight(routerModuleNode.getStart(), print);
        host.commitUpdate(recorder);
      }
    });
  };
}

function addDependencies(): Rule {
  return (_host: Tree) => {
    return chain([
      addDependency('@nguniversal/builders', '^0.0.0-PLACEHOLDER', {
        type: DependencyType.Dev,
      }),
      addDependency('@nguniversal/express-engine', '^0.0.0-PLACEHOLDER', {
        type: DependencyType.Default,
      }),
      addDependency('express', 'EXPRESS_VERSION', {
        type: DependencyType.Default,
      }),
      addDependency('@types/express', 'EXPRESS_TYPES_VERSION', {
        type: DependencyType.Dev,
      }),
    ]);
  };
}

function addServerFile(options: UniversalOptions, isStandalone: boolean): Rule {
  return async (host) => {
    const project = await getProject(host, options.project);
    const browserDistDirectory = await getOutputPath(host, options.project, 'build');

    return mergeWith(
      apply(url('./files'), [
        template({
          ...strings,
          ...options,
          stripTsExtension,
          browserDistDirectory,
          isStandalone,
        }),
        move(project.root),
      ]),
    );
  };
}

export default function (options: AddUniversalOptions): Rule {
  return async (host) => {
    const project = await getProject(host, options.project);
    const universalOptions = {
      ...options,
      skipInstall: true,
    };
    const clientBuildTarget = project.targets.get('build');
    if (!clientBuildTarget) {
      throw targetBuildNotFoundError();
    }

    const clientBuildOptions = (clientBuildTarget.options ||
      {}) as unknown as BrowserBuilderOptions;

    const isStandalone = isStandaloneApp(host, clientBuildOptions.main);

    delete universalOptions.serverFileName;
    delete universalOptions.serverPort;

    return chain([
      project.targets.has('server')
        ? noop()
        : externalSchematic('@schematics/angular', 'universal', universalOptions),
      addScriptsRule(options),
      updateServerTsConfigRule(options),
      updateWorkspaceConfigRule(options),
      isStandalone ? noop() : routingInitialNavigationRule(options),
      addServerFile(options, isStandalone),
      addDependencies(),
    ]);
  };
}
