import {join} from 'path';
import {getSubdirectoryNames} from './secondary-entry-points';
import {buildConfig} from './build-config';

/** Method that converts dash-case strings to a camel-based string. */
export const dashCaseToCamelCase =
  (str: string) => str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

/** List of potential secondary entry-points for the ASP.NET Core engine. */
const aspSecondaryEntryPoints = getSubdirectoryNames(join(buildConfig.packagesDir, 'aspnetcore-engine'));

/** List of potential secondary entry-points for the Common module. */
const commonSecondaryEntryPoints = getSubdirectoryNames(join(buildConfig.packagesDir, 'common'));

/** List of potential secondary entry-points for the Express engine. */
const expressSecondaryEntryPoints = getSubdirectoryNames(join(buildConfig.packagesDir, 'express-engine'));

/** List of potential secondary entry-points for the Hapi engine. */
const hapiSecondaryEntryPoints = getSubdirectoryNames(join(buildConfig.packagesDir, 'hapi-engine'));

/** List of potential secondary entry-points for the ASP.NET Core. */
const mmnlSecondaryEntryPoints = getSubdirectoryNames(join(buildConfig.packagesDir,
  'module-map-ngfactory-loader'));


/** Object with all ASP.NET Core engine entry points in the format of Rollup globals. */
const rollupAspEntryPoints = aspSecondaryEntryPoints
  .reduce((globals: any, entryPoint: string) => {
    globals[`@nguniversal/aspnetcore-engine/${entryPoint}`] =
      `nguniversal.asp.${dashCaseToCamelCase(entryPoint)}`;
    return globals;
}, {});

/** Object with all Common module entry points in the format of Rollup globals. */
const rollupCommonEntryPoints = commonSecondaryEntryPoints
  .reduce((globals: any, entryPoint: string) => {
    globals[`@nguniversal/common/${entryPoint}`] =
      `nguniversal.common.${dashCaseToCamelCase(entryPoint)}`;
    return globals;
  }, {});

/** Object with all Express engine entry points in the format of Rollup globals. */
const rollupExpressEntryPoints = expressSecondaryEntryPoints
  .reduce((globals: any, entryPoint: string) => {
    globals[`@nguniversal/express-engine/${entryPoint}`] =
      `nguniversal.express.${dashCaseToCamelCase(entryPoint)}`;
    return globals;
  }, {});

/** Object with all Hapi engine entry points in the format of Rollup globals. */
const rollupHapiEntryPoints = hapiSecondaryEntryPoints
  .reduce((globals: any, entryPoint: string) => {
    globals[`@nguniversal/hapi-engine/${entryPoint}`] =
      `nguniversal.hapi.${dashCaseToCamelCase(entryPoint)}`;
    return globals;
  }, {});

/** Object with all ASP.NET Core entry points in the format of Rollup globals. */
const rollupMmnlEntryPoints = mmnlSecondaryEntryPoints
  .reduce((globals: any, entryPoint: string) => {
    globals[`@nguniversal/module-map-ngfactory-loader/${entryPoint}`] =
      `nguniversal.mmnl.${dashCaseToCamelCase(entryPoint)}`;
    return globals;
  }, {});

/** Map of globals that are used inside of the different packages. */
export const rollupGlobals = {
  'tslib': 'tslib',
  'fs': 'fs',

  '@angular/animations': 'ng.animations',
  '@angular/core': 'ng.core',
  '@angular/common': 'ng.common',
  '@angular/common/http': 'ng.common.http',
  '@angular/compiler': 'ng.compiler',
  '@angular/forms': 'ng.forms',
  '@angular/router': 'ng.router',
  '@angular/platform-browser': 'ng.platformBrowser',
  '@angular/platform-server': 'ng.platformServer',
  '@angular/platform-browser-dynamic': 'ng.platformBrowserDynamic',
  '@angular/platform-browser/animations': 'ng.platformBrowser.animations',
  '@angular/core/testing': 'ng.core.testing',
  '@angular/common/testing': 'ng.common.testing',
  '@angular/common/http/testing': 'ng.common.http.testing',
  '@angular/material': 'ng.material',
  '@angular/cdk': 'ng.cdk',
  '@angular/cdk/platform': 'ng.cdk.platform',

  // Some packages are not really needed for the UMD bundles, but for the missingRollupGlobals rule.
  '@nguniversal': 'nguniversal',

  // Include secondary entry-points of the modules
  ...rollupAspEntryPoints,
  ...rollupCommonEntryPoints,
  ...rollupExpressEntryPoints,
  ...rollupHapiEntryPoints,
  ...rollupMmnlEntryPoints,

  'rxjs/BehaviorSubject': 'Rx',
  'rxjs/Observable': 'Rx',
  'rxjs/Subject': 'Rx',
  'rxjs/Subscription': 'Rx',
  'rxjs/Observer': 'Rx',
  'rxjs/Subscriber': 'Rx',
  'rxjs/Scheduler': 'Rx',
  'rxjs/ReplaySubject': 'Rx',

  'rxjs/observable/combineLatest': 'Rx.Observable',
  'rxjs/observable/forkJoin': 'Rx.Observable',
  'rxjs/observable/fromEvent': 'Rx.Observable',
  'rxjs/observable/merge': 'Rx.Observable',
  'rxjs/observable/of': 'Rx.Observable',
  'rxjs/observable/throw': 'Rx.Observable',
  'rxjs/observable/defer': 'Rx.Observable',

  'rxjs/operators/filter': 'Rx.operators',
  'rxjs/operators/map': 'Rx.operators',
  'rxjs/operators/take': 'Rx.operators',
  'rxjs/operators/tap': 'Rx.operators',
};
