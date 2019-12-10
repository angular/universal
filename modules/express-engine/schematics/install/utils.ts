/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { SchematicsException, Tree } from '@angular-devkit/schematics';
import * as ts from 'typescript';
import { findNodes } from '@schematics/angular/utility/ast-utils';

export function getTsSourceText(host: Tree, path: string): string {
  const buffer = host.read(path);
  if (!buffer) {
    throw new SchematicsException(`Could not read file (${path}).`);
  }
  return buffer.toString();
}

export function getTsSourceFile(host: Tree, path: string): ts.SourceFile {
  return ts.createSourceFile(path, getTsSourceText(host, path), ts.ScriptTarget.Latest, true);
}

export function findAppServerModuleExport(host: Tree,
                                          mainPath: string): ts.ExportDeclaration | null {
  const source = getTsSourceFile(host, mainPath);
  const exportNodes = findNodes(source, ts.SyntaxKind.ExportDeclaration);
  if (exportNodes && exportNodes.length > 0) {
    return exportNodes[0] as ts.ExportDeclaration;
  } else {
    return null;
  }
}

export function findAppServerModulePath(host: Tree, mainPath: string): string {
  const exportDeclaration = findAppServerModuleExport(host, mainPath);
  if (!exportDeclaration) {
    throw new SchematicsException('Could not find app server module export');
  }

  const moduleSpecifier = exportDeclaration.moduleSpecifier!.getText();
  return moduleSpecifier.substring(1, moduleSpecifier.length - 1);
}

export function generateExport(sourceFile: ts.SourceFile,
                               elements: string[],
                               module: string): string {
  const printer = ts.createPrinter();
  const exports = elements.map(element =>
    ts.createExportSpecifier(undefined, element));
  const namedExports = ts.createNamedExports(exports);
  const moduleSpecifier = ts.createStringLiteral(module);
  const exportDeclaration = ts.createExportDeclaration(undefined, undefined,
    namedExports, moduleSpecifier);

  return printer.printNode(ts.EmitHint.Unspecified, exportDeclaration, sourceFile);
}
