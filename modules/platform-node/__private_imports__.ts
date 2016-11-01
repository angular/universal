import { __platform_browser_private__ as browser } from '@angular/platform-browser';
import { __core_private__ as core } from '@angular/core';
import { __compiler_private__ as compiler } from '@angular/compiler';

// This is ugly, but it is how we must export private imports like angular does internally to
// emit properly, e.g. how it is done here
// https://github.com/angular/angular/blob/master/modules/@angular/compiler/src/private_import_core.ts

// platform-browser
export const BROWSER_SANITIZATION_PROVIDERS: typeof browser.BROWSER_SANITIZATION_PROVIDERS = browser.BROWSER_SANITIZATION_PROVIDERS;
export type SharedStylesHost = typeof browser._SharedStylesHost;
export const SharedStylesHost: typeof browser.SharedStylesHost = browser.SharedStylesHost;
export type DomSharedStylesHost = typeof browser._DomSharedStylesHost;
export const DomSharedStylesHost: typeof browser.DomSharedStylesHost = browser.DomSharedStylesHost;
export type DomRootRenderer = typeof browser._DomRootRenderer;
export const DomRootRenderer: typeof browser.DomRootRenderer = browser.DomRootRenderer;
export type DomEventsPlugin = typeof browser._DomEventsPlugin;
export const DomEventsPlugin: typeof browser.DomEventsPlugin = browser.DomEventsPlugin;
export type KeyEventsPlugin = typeof browser._KeyEventsPlugin;
export const KeyEventsPlugin: typeof browser.KeyEventsPlugin = browser.KeyEventsPlugin;
export type DomAdapter = typeof browser._DomAdapter;
export const DomAdapter: typeof browser.DomAdapter = browser.DomAdapter;
export const setRootDomAdapter: typeof browser.setRootDomAdapter = browser.setRootDomAdapter;
export type HammerGesturesPlugin = typeof browser._HammerGesturesPlugin;
export const HammerGesturesPlugin: typeof browser.HammerGesturesPlugin = browser.HammerGesturesPlugin;

// core
export type ViewUtils = typeof core._ViewUtils;
export const ViewUtils: typeof core.ViewUtils = core.ViewUtils;
export type AnimationKeyframe = typeof core._AnimationKeyframe;
export const AnimationKeyframe: typeof core.AnimationKeyframe = core.AnimationKeyframe;
export type AnimationPlayer = typeof core._AnimationPlayer;
export const AnimationPlayer: typeof core.AnimationPlayer = core.AnimationPlayer;
export type AnimationStyles = typeof core._AnimationStyles;
export const AnimationStyles: typeof core.AnimationStyles = core.AnimationStyles;
export type RenderDebugInfo = typeof core._RenderDebugInfo;
export const RenderDebugInfo: typeof core.RenderDebugInfo = core.RenderDebugInfo;

// compiler
export type SelectorMatcher = typeof compiler._SelectorMatcher;
export const SelectorMatcher: typeof compiler.SelectorMatcher = compiler.SelectorMatcher;
export type CssSelector = typeof compiler._CssSelector;
export const CssSelector: typeof compiler.CssSelector = compiler.CssSelector;

var __empty = null;
export default __empty;
