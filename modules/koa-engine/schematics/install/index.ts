/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { strings } from '@angular-devkit/core';
import { Rule, SchematicContext, Tree, apply, chain, mergeWith, move, template, url, } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { addUniversalCommonRule } from '@nguniversal/common/schematics/add';
import { getOutputPath, getProject, stripTsExtension, } from '@nguniversal/common/schematics/utils';
import { NodeDependencyType, addPackageJsonDependency, } from '@schematics/angular/utility/dependencies';
import { Schema as UniversalOptions } from './schema';

function addDependencies(options: UniversalOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    if (!options.skipInstall) {
      context.addTask(new NodePackageInstallTask());
    }
    addPackageJsonDependency(host, {
      type: NodeDependencyType.Default,
      name: '@nguniversal/koa-engine',
      version: '^0.0.0-PLACEHOLDER',
    });
    addPackageJsonDependency(host, {
      type: NodeDependencyType.Default,
      name: 'koa',
      version: 'KOA_VERSION',
    });
    addPackageJsonDependency(host, {
      type: NodeDependencyType.Default,
      name: 'koa-static',
      version: 'KOA_STATIC_VERSION',
    });
    addPackageJsonDependency(host, {
      type: NodeDependencyType.Dev,
      name: '@types/koa',
      version: 'KOA_TYPES_VERSION',
    });
    addPackageJsonDependency(host, {
      type: NodeDependencyType.Dev,
      name: '@types/koa-static',
      version: 'KOA_STATIC_TYPES_VERSION',
    });

    return host;
  };
}

function addServerFile(options: UniversalOptions): Rule {
  return async host => {
    const clientProject = await getProject(host, options.clientProject);
    const browserDistDirectory = await getOutputPath(host, options.clientProject, 'build');

    return mergeWith(apply(url('./files'), [
      template({
        ...strings,
        ...options,
        stripTsExtension,
        browserDistDirectory,
      }),
      move(clientProject.root)
    ]));
  };
}

export default function(options: UniversalOptions): Rule {
  return () => {
    return chain([
      addUniversalCommonRule(options),
      addServerFile(options),
      addDependencies(options),
    ]);
  };
}
