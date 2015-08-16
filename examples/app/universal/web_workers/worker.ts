/// <reference path="../../../../custom_typings/_custom.d.ts" />

// Angular 2
import {bootstrapWebworker} from 'angular2/src/web-workers/worker/application';

/*
 * Angular Modules
 */

/*
 * App Component
 * our top level component that holds all of our components
 */
import {WorkerApp} from './app';

bootstrapWebworker(WorkerApp, null);
// export function main() {
// 	debugger;;
//   return 
// }
