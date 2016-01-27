
// polyfills
import from 'es6-promise';
import from 'es6-shim';
// typescript emit metadata
import from 'reflect-metadata';
// zone.js to track promises
import from 'zone.js/dist/zone-microtask';
import from 'zone.js/dist/long-stack-trace-zone';

// dom closure
import {Parse5DomAdapter} from 'angular2/src/platform/server/parse5_adapter';

Parse5DomAdapter.makeCurrent();
