// Facade
import {Type, isPresent} from '@angular/core/src/facade/lang';

// Compiler
import {COMPILER_PROVIDERS, XHR} from '@angular/compiler';

// Animate
import {BrowserDetails} from '@angular/platform-browser/src/animate/browser_details';
import {AnimationBuilder} from '@angular/platform-browser/src/animate/animation_builder';

// Core
import {Testability} from '@angular/core/src/testability/testability';
import {ReflectionCapabilities} from '@angular/core/src/reflection/reflection_capabilities';
import {DirectiveResolver} from '@angular/compiler';
import {
  provide,
  Provider,
  coreLoadAndBootstrap,
  ReflectiveInjector,
  PLATFORM_INITIALIZER,
  PLATFORM_COMMON_PROVIDERS,
  PLATFORM_DIRECTIVES,
  PLATFORM_PIPES,
  APPLICATION_COMMON_PROVIDERS,
  ComponentRef,
  createPlatform,
  reflector,
  ExceptionHandler,
  Renderer,
  NgZone,
  OpaqueToken
} from '@angular/core';

// Common
import {COMMON_DIRECTIVES, COMMON_PIPES, FORM_PROVIDERS} from '@angular/common';


// Platform.Dom
import {EventManager, EVENT_MANAGER_PLUGINS} from '@angular/platform-browser/src/dom/events/event_manager';
import {DomEventsPlugin} from '@angular/platform-browser/src/dom/events/dom_events';
import {KeyEventsPlugin} from '@angular/platform-browser/src/dom/events/key_events';
import {HammerGesturesPlugin} from '@angular/platform-browser/src/dom/events/hammer_gestures';
import {DomSharedStylesHost, SharedStylesHost} from '@angular/platform-browser/src/dom/shared_styles_host';
import {
  HAMMER_GESTURE_CONFIG,
  HammerGestureConfig
} from '@angular/platform-browser/src/dom/events/hammer_gestures';
import {ELEMENT_PROBE_PROVIDERS, BROWSER_SANITIZATION_PROVIDERS} from '@angular/platform-browser';
import {DOCUMENT} from '@angular/platform-browser/src/dom/dom_tokens';
import {DomRootRenderer} from '@angular/platform-browser/src/dom/dom_renderer';
import {RootRenderer} from '@angular/core/src/render/api';

import {TemplateParser} from '@angular/compiler/src/template_parser';

import {NodeDomRootRenderer_} from './dom/node_dom_renderer';
import {NodeXHRImpl} from './node_xhr_impl';
import {NodeSharedStylesHost} from './node_shared_styles_host';
import {NodeTemplateParser} from './node_template_parser';
import {NODE_PLATFORM_DIRECTIVES} from '../directives';

var CONST_EXPR = v => v;
import {Parse5DomAdapter} from '@angular/platform-server';
Parse5DomAdapter.makeCurrent(); // ensure Parse5DomAdapter is used
import {getDOM} from '@angular/platform-browser/src/dom/dom_adapter';
var DOM: any = getDOM();

export function initNodeAdapter() {
  Parse5DomAdapter.makeCurrent();
}

export const NODE_APP_PLATFORM_MARKER = new OpaqueToken('NodeAppPlatformMarker');

export const NODE_APP_PLATFORM: Array<any> = CONST_EXPR([
  ...PLATFORM_COMMON_PROVIDERS,
  new Provider(NODE_APP_PLATFORM_MARKER, {useValue: true}),
  new Provider(PLATFORM_INITIALIZER, {useValue: initNodeAdapter, multi: true}),
]);

function _exceptionHandler(): ExceptionHandler {
  return new ExceptionHandler(getDOM(), false);
}

function _document(): any {
  return getDOM().createHtmlDocument();
}

export const NODE_APP_COMMON_PROVIDERS: Array<any> = CONST_EXPR([
  ...APPLICATION_COMMON_PROVIDERS,
  ...FORM_PROVIDERS,
  ...BROWSER_SANITIZATION_PROVIDERS,
  new Provider(PLATFORM_PIPES, {useValue: COMMON_PIPES, multi: true}),
  new Provider(PLATFORM_DIRECTIVES, {useValue: COMMON_DIRECTIVES, multi: true}),
  new Provider(ExceptionHandler, {useFactory: _exceptionHandler, deps: []}),
  ...NODE_PLATFORM_DIRECTIVES,
  new Provider(DOCUMENT, {useFactory: () => _document }),

  new Provider(EVENT_MANAGER_PLUGINS, {useClass: DomEventsPlugin, multi: true}),
  new Provider(EVENT_MANAGER_PLUGINS, {useClass: KeyEventsPlugin, multi: true}),
  new Provider(EVENT_MANAGER_PLUGINS, {useClass: HammerGesturesPlugin, multi: true}),
  new Provider(HAMMER_GESTURE_CONFIG, {useClass: HammerGestureConfig}),
  new Provider(DomRootRenderer, {useClass: NodeDomRootRenderer_}),
  new Provider(RootRenderer, {useExisting: DomRootRenderer}),
  new Provider(SharedStylesHost, {useExisting: NodeSharedStylesHost}),
  new Provider(DomSharedStylesHost, {useExisting: NodeSharedStylesHost}),
  NodeSharedStylesHost,
  Testability,
  BrowserDetails,
  AnimationBuilder,
  EventManager,
  ...ELEMENT_PROBE_PROVIDERS
]);

/**
 * An array of providers that should be passed into `application()` when bootstrapping a component.
 */
export const NODE_APP_PROVIDERS: Array<any> = CONST_EXPR([
  ...NODE_APP_COMMON_PROVIDERS,
  ...COMPILER_PROVIDERS,

  new Provider(TemplateParser, {useClass: NodeTemplateParser}),
  new Provider(XHR, {useClass: NodeXHRImpl}),
]);

/**
 *
 */
export function bootstrap(
  appComponentType: Type,
  customAppProviders: Array<any> = null,
  customComponentProviders: Array<any> = null): Promise<ComponentRef<any>> {

  reflector.reflectionCapabilities = new ReflectionCapabilities();

  let appProviders: Array<any> = [
    ...NODE_APP_PROVIDERS,

    new Provider(DOCUMENT, {
      useFactory: (directiveResolver, sharedStylesHost) => {
        // TODO(gdi2290): determine a better for document on the server
        let selector = directiveResolver.resolve(appComponentType);
        let serverDocument = DOM.createHtmlDocument();
        let el = DOM.createElement(selector);
        DOM.appendChild(serverDocument.body, el);
        sharedStylesHost.addHost(serverDocument.head);
        return serverDocument;
      },
      deps: [DirectiveResolver, NodeSharedStylesHost]
    }),

    ...(isPresent(customAppProviders) ? customAppProviders : [])
  ];

  let componentProviders: Array<any> = [
    ...(isPresent(customComponentProviders) ? customComponentProviders : [])
  ];

  let platform = createPlatform(ReflectiveInjector.resolveAndCreate(NODE_APP_PLATFORM));
  return coreLoadAndBootstrap(platform.injector, appComponentType);
}


export function buildReflector(): void {
  reflector.reflectionCapabilities = new ReflectionCapabilities();
}

export function buildNodeProviders(providers?: Array<any>): Array<any> {
  return [
    ...NODE_APP_PLATFORM,
    ...(isPresent(providers) ? providers : [])
  ];
}

export function buildNodeAppProviders(document?: any, providers?: Array<any>): Array<any> {
  return [
    ...NODE_APP_PROVIDERS,
    (isPresent(document) && document) ? [
      new Provider(DOCUMENT, {
        useFactory: (sharedStylesHost) => {
          sharedStylesHost.addHost(document.head);
          return document;
        },
        deps: [NodeSharedStylesHost]
      })
    ] : [],
    ...(isPresent(providers) && providers) ? providers : []
  ];
}

export function buildNodePlatformProviders(
  appComponentType: Type,
  providers?: Array<any>): Array<any> {

  return [
    ...NODE_APP_PLATFORM,
    ...(isPresent(providers) ? providers : [])
  ];
}
