/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import 'zone.js/dist/zone-node';
import { NgModuleFactoryLoader,
  NgModuleFactory, Injector, NgZone } from '@angular/core';
import { platformServer } from '@angular/platform-server';
import { ROUTES, Route } from '@angular/router';
import { Observable } from 'rxjs';
import { provideModuleMap } from '@nguniversal/module-map-ngfactory-loader';

export let loader: NgModuleFactoryLoader;

export function lsRoutes<T>(
  serverFactory: NgModuleFactory<T>,
  lazyModuleMap?: any
) {
  const ngZone = new NgZone({ enableLongStackTrace: false });
  const rootInjector = Injector.create(
    [
      { provide: NgZone, useValue: ngZone },
      provideModuleMap(lazyModuleMap)
    ],
    platformServer().injector
  );
  const moduleRef = serverFactory.create(rootInjector);
  loader = moduleRef.injector.get(NgModuleFactoryLoader);
  return Promise.all(createModule(serverFactory, rootInjector))
    .then(routes => {
        return flattenArray(flattenRouteToPath(routes));
    });
}

function flattenArray<T, V>(array: T[] | T): V[] {
  return !Array.isArray(array) ? array : [].concat.apply([], array.map(r => flattenArray(r)));
}

function flattenRouteToPath(routes: Route[]): (string[] | string)[] {
  return routes.map(route => {
    if (!route.children) {
      return route.path ? '/' + route.path : '/';
    } else {
      // extra flatten here for nested routes
      return flattenArray(flattenRouteToPath(route.children))
        .map(childRoute => (!route.path ? '' : '/' + route.path) + childRoute);
    }
  });
}

function coerceIntoPromise<T>(mightBePromise: Observable<T> | Promise<T> | T): Promise<T> {
  if (mightBePromise instanceof Observable) {
    return mightBePromise.toPromise();
  }
  return Promise.resolve(mightBePromise);
}

function extractRoute(route: Route, injector: Injector): Promise<Route> {
  if (route.loadChildren) {
    return resolveLazyChildren(route, injector);
  }
  if (route.children) {
    return Promise.all(route.children.map(r => extractRoute(r, injector)))
      .then(routes => {
        route.children = routes;
        return route;
      });
  }
  return Promise.resolve(route);
}

function resolveLazyChildren(route: Route, injector: Injector): Promise<Route> {
  let nextFactory: Promise<NgModuleFactory<any>>;
  if (typeof route.loadChildren === 'function') {
    nextFactory = coerceIntoPromise<NgModuleFactory<any>>(
      route.loadChildren() as NgModuleFactory<any> | Promise<NgModuleFactory<any>>
    );
  } else {
    nextFactory = loader.load(route.loadChildren as string);
  }
  return nextFactory
    .then(factory => Promise.all(createModule(factory, injector)))
    .then(children => {
      route.children = children;
      delete route.loadChildren;
      return route;
    });
}

function createModule<T>(factory: NgModuleFactory<T>, parentInjector: Injector): Promise<Route>[] {

  const moduleRef = factory.create(parentInjector);
  const routes = moduleRef.injector.get(ROUTES);

  return flattenArray<Route[][], Route>(routes)
    .map(route => {
      if (!route.loadChildren) {
        // no lazy loaded paths so we can return the routes directly
        return extractRoute(route, parentInjector);
      } else {
        return resolveLazyChildren(route, moduleRef.injector);
      }
    });
}
