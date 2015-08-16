/// <reference path="../typings/tsd.d.ts" />

import {Injectable, bind} from 'angular2/di';

// TODO: use node's webworker module
export var Worker = () => {};

export const webworkersInjectables: Array<any> = [
  bind(Worker).toClass(() => {})
];
