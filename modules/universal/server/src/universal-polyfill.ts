
// polyfills
export * from 'es6-promise';
export * from 'es6-shim';
// typescript emit metadata
export * from 'reflect-metadata';
// zone.js to track promises
export * from 'zone.js/dist/zone-microtask';
export * from 'zone.js/dist/long-stack-trace-zone';

// dom closure
import {Parse5DomAdapter} from 'angular2/src/platform/server/parse5_adapter';

Parse5DomAdapter.makeCurrent();
