import {bootstrap} from './platform/node';
import {parseDocument, serializeDocument} from './platform/document';
import {DOCUMENT} from 'angular2/platform/common_dom';

import {
  selectorRegExpFactory,
  arrayFlattenTree
} from './helper';
import {stringifyElement} from './stringify_element';

import {
  prebootConfigDefault,
  getPrebootCSS,
  createPrebootHTML,
  getBrowserCode
} from './ng_preboot';

import {isBlank, isPresent} from 'angular2/src/facade/lang';

import {SharedStylesHost} from 'angular2/src/platform/dom/shared_styles_host';

import {NgZone, DirectiveResolver, ComponentRef, Provider, Type} from 'angular2/core';
import {Http} from 'angular2/http';
import {Router} from 'angular2/router';

export function addPrebootHtml(AppComponents, htmls, prebootConfig: any = {}): any {
  if (typeof prebootConfig === 'boolean' && prebootConfig === false) {
    return htmls;
  }

  //prebootConfig.appRoots = prebootConfig.appRoots || selectorResolver(AppComponents);
  let config = prebootConfigDefault(prebootConfig);
  return getBrowserCode(config).then(code => { htmls.push(createPrebootHTML(code, config)); return htmls});
}

function waitRouter(appRef: ComponentRef): Promise<ComponentRef> {
  let injector = appRef.injector;
  let router = injector.getOptional(Router);

  return Promise.resolve(router && router._currentNavigation)
    .then(() => new Promise(resolve => setTimeout(() => resolve(appRef))));
}

export function renderDocument(
  documentHtml: string,
  componentType: Type,
  nodeProviders?: any
): Promise<string> {

  return bootstrap(componentType, [
    ...nodeProviders,
    new Provider(DOCUMENT, { useValue: parseDocument(documentHtml) })
  ])
  .then(waitRouter)
  .then((appRef: ComponentRef) => {
    let injector = appRef.injector;
    let document = injector.get(DOCUMENT);

    return serializeDocument(document);
  });
}

export function renderDocumentWithPreboot(
  documentHtml: string,
  componentType: Type,
  nodeProviders?: any,
  prebootConfig: any = {}
): Promise<string> {

  return renderDocument(documentHtml, componentType, nodeProviders)
    .then(html => addPrebootHtml(html, prebootConfig));
}


export var serverDirectiveResolver = new DirectiveResolver();

export function selectorResolver(componentType: /*Type*/ any): string {
  return serverDirectiveResolver.resolve(componentType).selector;
}


export function serializeApplication(element: any, styles: string[], cache?: any): string {
  // serialize all style hosts
  let serializedStyleHosts: string = styles.length >= 1 ? '<style>' + styles.join('\n') + '</style>' : '';

  // serialize Top Level Component
  let serializedCmp: string = stringifyElement(element);

  // serialize App Data
  let serializedData: string = isBlank(cache) ? '' : '' +
    '<script>' +
    'window.' + 'ngPreloadCache' + ' = ' +  JSON.stringify(cache, null, 2) +
    '</script>' +
  '';

  return serializedStyleHosts + serializedCmp + serializedData;
}


export function appRefSyncRender(appRef: any): string {
  // grab parse5 html element
  let element = appRef.location.nativeElement;

  // TODO: we need a better way to manage the style host for server/client
  let sharedStylesHost = appRef.injector.get(SharedStylesHost);
  let styles: Array<string> = sharedStylesHost.getAllStyles();

  let serializedApp: string = serializeApplication(element, styles);

  return serializedApp;
}

export function renderToString(AppComponents: any, nodeProviders?: any): any {
    
    var promises:Array<Promise<any>> = [];
    for (var cmp in AppComponents)
      {
        promises.push(
            bootstrap(AppComponents[cmp], nodeProviders)
            .then(waitRouter)
            .then((appRef: ComponentRef) => {
                let html = appRefSyncRender(appRef);
                appRef.dispose();
                return html
            }));
      }
  return Promise.all(promises);
}


export function renderToStringWithPreboot(AppComponents: any, nodeProviders?: any, prebootConfig: any = {}): Promise<string> {
  return renderToString(AppComponents, nodeProviders).then(htmls => addPrebootHtml(AppComponents, htmls, prebootConfig));
}
