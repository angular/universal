/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  Rule,
  SchematicsException,
  chain,
  Tree,
  externalSchematic,
} from '@angular-devkit/schematics';
import {removePackageJsonDependency} from '@schematics/angular/utility/dependencies';
import {getWorkspace} from '@schematics/angular/utility/workspace';
import {NodePackageInstallTask} from '@angular-devkit/schematics/tasks';
import {Builders} from '@schematics/angular/utility/workspace-models';
import {normalize, join} from '@angular-devkit/core';
import {Schema as InstallSchema} from '../../install/schema';

export function version9UpdateRule(collectionPath: string): Rule {
  return async host => {
    // the below dependencies are no longer needed in version 9
    removePackageJsonDependency(host, 'ts-loader');
    removePackageJsonDependency(host, 'webpack-cli');

    return chain([
      removePackageScriptsRule(),
      backupOldFilesRule(),
      ... await updateProjectsStructureRule(host, collectionPath),
      (tree, context) => {
        const packageChanges = tree.actions.some(a => a.path.endsWith('/package.json'));
        if (context && packageChanges) {
          context.addTask(new NodePackageInstallTask());
        }
      },
    ]);
  };
}

function removePackageScriptsRule(): Rule {
  return tree => {
    // Remove old scripts in 'package.json'
    const pkgPath = '/package.json';
    const buffer = tree.read(pkgPath);
    if (!buffer) {
      throw new SchematicsException('Could not find package.json');
    }

    const pkg = JSON.parse(buffer.toString());
    delete pkg.scripts['compile:server'];
    delete pkg.scripts['build:client-and-server-bundles'];

    tree.overwrite(pkgPath, JSON.stringify(pkg, null, 2));
  };
}

function backupOldFilesRule(): Rule {
  return async tree => {
    const workspace = await getWorkspace(tree);

    for (const [, projectDefinition] of workspace.projects) {
      const serverTarget = projectDefinition.targets.get('server');
      if (!serverTarget || serverTarget.builder !== Builders.Server) {
        // Only process those targets which have a known builder for the CLI
        continue;
      }

      const root = normalize(projectDefinition.root);

      // Backup old files
      [
        'server.ts',
        'webpack.server.config.js',
      ]
        .map(f => join(root, f))
        .filter(f => tree.exists(f))
        .forEach(f => tree.rename(f, `${f}.bak`));
    }
  };
}

async function updateProjectsStructureRule(tree: Tree, collectionPath: string): Promise<Rule[]> {
  if (!collectionPath) {
    return [];
  }

  const workspace = await getWorkspace(tree);
  const installRules: Rule[] = [];

  for (const [projectName, projectDefinition] of workspace.projects) {
    const serverTarget = projectDefinition.targets.get('server');
    if (!serverTarget || serverTarget.builder !== Builders.Server) {
      // Only process those targets which have a known builder for the CLI
      continue;
    }

    const installOptions: InstallSchema = {
      clientProject: projectName,
      // Skip install, so we only do one for the entire workspace at the end.
      skipInstall: true,
    };

    // Run the install schematic again so that we re-create the entire stucture.
    installRules.push(externalSchematic(collectionPath, 'ng-add', installOptions));
  }

  return installRules;
}
