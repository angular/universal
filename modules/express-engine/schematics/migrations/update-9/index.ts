/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { Rule, SchematicsException } from '@angular-devkit/schematics';
import { version9UpdateRule } from '@nguniversal/common/schematics/migrations/update-9';
import { getPackageJsonDependency } from '@schematics/angular/utility/dependencies';

export default function (): Rule {
  return async host => {
    if (!getPackageJsonDependency(host, '@nguniversal/express-engine')) {
      throw new SchematicsException('Could not find dependency on @nguniversal/express-engine');
    }

    const collectionPath = require.resolve('../../collection.json');

    return version9UpdateRule(collectionPath);
  };
}
