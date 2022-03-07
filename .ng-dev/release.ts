import { ReleaseConfig } from '@angular/dev-infra-private/ng-dev/release/config';
import { join } from 'path';

/** Configuration for the `ng-dev release` command. */
export const release: ReleaseConfig = {
  representativeNpmPackage: '@nguniversal/common',
  npmPackages: [
    { name: '@nguniversal/builders' },
    { name: '@nguniversal/common' },
    { name: '@nguniversal/express-engine' },
  ],
  releaseNotes: {
    groupOrder: ['@nguniversal/common', '@nguniversal/builders', '@nguniversal/express-engine'],
  },
  publishRegistry: 'https://wombat-dressing-room.appspot.com',
  releasePrLabels: ['action: merge'],
  buildPackages: () => {
    // The buildTargetPackages function is loaded at runtime as the loading the script causes an
    // invocation of bazel.
    const { buildTargetPackages } = require(join(__dirname, '../scripts/package-builder.js'));
    return buildTargetPackages('dist/release-output', 'Release', /* isRelease */ true);
  },
};
