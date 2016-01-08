// polyfills
import 'es6-promise';
import 'es6-shim';
// typescript emit metadata
import 'reflect-metadata';
// zone.js to track promises
import 'zone.js/dist/zone-microtask';
import 'zone.js/dist/long-stack-trace-zone';

// dom closure
import {Parse5DomAdapter} from 'angular2/src/platform/server/parse5_adapter';
Parse5DomAdapter.makeCurrent();
