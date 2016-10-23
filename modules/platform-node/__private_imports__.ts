import { __platform_browser_private__ } from '@angular/platform-browser';
import { __core_private__ } from '@angular/core';
import {
  SelectorMatcher as SelectorMatcher211, 
  CssSelector as CssSelector211 } from '@angular/compiler';

// PRIVATE
const {
  BROWSER_SANITIZATION_PROVIDERS,
  SharedStylesHost,
  DomSharedStylesHost,
  DomRootRenderer,
  DomEventsPlugin,
  KeyEventsPlugin,
  DomAdapter,
  setRootDomAdapter,
  HammerGesturesPlugin
} = __platform_browser_private__;

const {
  view_utils,
  AnimationKeyframe,
  AnimationPlayer,
  AnimationStyles,
  RenderDebugInfo
} = __core_private__;

let SelectorMatcher;
let CssSelector;

if (SelectorMatcher211 && CssSelector211) {
  SelectorMatcher = SelectorMatcher211;
  CssSelector = CssSelector211;
} else {
  const _compiler_private_  = require('@angular/compiler').__compiler_private__;
  SelectorMatcher = _compiler_private_.SelectorMatcher;
  CssSelector = _compiler_private_.CssSelector;
}


// @internal
export {
  // platform-browser
  BROWSER_SANITIZATION_PROVIDERS,
  SharedStylesHost,
  DomSharedStylesHost,
  DomRootRenderer,
  DomEventsPlugin,
  DomAdapter,
  setRootDomAdapter,
  KeyEventsPlugin,
  HammerGesturesPlugin,

  // compiler
  SelectorMatcher,
  CssSelector,

  // core
  view_utils,
  AnimationKeyframe,
  AnimationPlayer,
  AnimationStyles,
  RenderDebugInfo,

}

var __empty = null;

export default __empty;
