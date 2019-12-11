/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Tree} from '@angular-devkit/schematics/src/tree/interface';
import {workspaces} from '@angular-devkit/core';
import {getWorkspace} from '@schematics/angular/utility/workspace';
import {SchematicsException} from '@angular-devkit/schematics';
import * as ts from 'typescript';

export async function getProject(
  host: Tree,
  projectName: string,
): Promise<workspaces.ProjectDefinition> {
  const workspace = await getWorkspace(host);
  const project = workspace.projects.get(projectName);

  if (!project || project.extensions.projectType !== 'application') {
    throw new SchematicsException(`Universal requires a project type of 'application'.`);
  }

  return project;
}

export function stripTsExtension(file: string): string {
  return file.replace(/\.ts$/, '');
}

export async function getOutputPath(
  host: Tree,
  projectName: string,
  target: 'server' | 'build',
): Promise<string> {
  // Generate new output paths
  const project = await getProject(host, projectName);
  const serverTarget = project.targets.get(target);
  if (!serverTarget || !serverTarget.options) {
    throw new SchematicsException
      (`Cannot find 'options' for ${projectName} ${target} target.`);
  }

  const { outputPath } = serverTarget.options;
  if (typeof outputPath !== 'string') {
    throw new SchematicsException
      (`outputPath for ${projectName} ${target} target is not a string.`);
  }

  return outputPath;
}

export function findImportSpecifier(elements: ts.NodeArray<ts.ImportSpecifier>,
                                    importName: string) {
  return elements.find(element => {
    const {name, propertyName} = element;
    return propertyName ? propertyName.text === importName : name.text === importName;
  }) || null;
}

export function findImport(sourceFile: ts.SourceFile,
                    moduleName: string,
                    symbolName: string): ts.NamedImports | null {
  // Only look through the top-level imports.
  for (const node of sourceFile.statements) {
    if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier) ||
      node.moduleSpecifier.text !== moduleName) {
      continue;
    }

    const namedBindings = node.importClause && node.importClause.namedBindings;

    if (!namedBindings || !ts.isNamedImports(namedBindings)) {
      continue;
    }

    if (findImportSpecifier(namedBindings.elements, symbolName)) {
      return namedBindings;
    }
  }

  return null;
}

export type Import = {
  name: string,
  importModule: string,
  node: ts.ImportDeclaration
};

/** Gets import information about the specified identifier by using the Type checker. */
export function getImportOfIdentifier(typeChecker: ts.TypeChecker,
                                      node: ts.Identifier): Import | null {
  const symbol = typeChecker.getSymbolAtLocation(node);

  if (!symbol || !symbol.declarations.length) {
    return null;
  }

  const decl = symbol.declarations[0];

  if (!ts.isImportSpecifier(decl)) {
    return null;
  }

  const importDecl = decl.parent.parent.parent;

  if (!ts.isStringLiteral(importDecl.moduleSpecifier)) {
    return null;
  }

  return {
    // Handles aliased imports: e.g. "import {Component as myComp} from ...";
    name: decl.propertyName ? decl.propertyName.text : decl.name.text,
    importModule: importDecl.moduleSpecifier.text,
    node: importDecl
  };
}

export function addInitialNavigation(node: ts.CallExpression): ts.CallExpression {
  const existingOptions = node.arguments[1] as ts.ObjectLiteralExpression | undefined;

  // If the user has explicitly set initialNavigation, we respect that
  if (existingOptions && existingOptions.properties.find(exp =>
    ts.isPropertyAssignment(exp) && ts.isIdentifier(exp.name) &&
    exp.name.text === 'initialNavigation')) {
    return node;
  }

  const initialNavigationProperty = ts.createPropertyAssignment('initialNavigation',
    ts.createStringLiteral('enabled'));
  const properties = [initialNavigationProperty];
  const routerOptions = existingOptions ?
    ts.updateObjectLiteral(existingOptions, properties) : ts.createObjectLiteral(properties, true);
  const args = [node.arguments[0], routerOptions];
  return ts.createCall(node.expression, node.typeArguments, args);
}
