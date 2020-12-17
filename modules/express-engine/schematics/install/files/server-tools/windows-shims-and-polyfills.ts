// tslint:disable: no-string-literal
// tslint:disable: typedef
// tslint:disable: only-arrow-functions
import { createWindow } from "domino";

/**
 * overwrite existing window type for this polyfills file
 * This is needed so we can create all the needed polyfills
 * on Window without TS errors.
 */
interface Window {
  [prop: string]: any;
  // Event:Event
}

const window: Window = createWindow("");

/**
 * Set up the types for all the mocks that are attached to the global.
 */
declare var global: {
  /** Reference to the window. */
  window: Window;
  /** Reference to the document. */
  document: Document;
  /** Reference to the navigator. */
  navigator: Navigator;
  /** Reference to CSS. */
  CSS: any;
  /** Reference to Prism. */
  Prism: any;
  /** Request animation frame. */
  requestAnimationFrame: (callback: FrameRequestCallback) => number;
  /** Cancel animation frame. */
  cancelAnimationFrame: (n: number) => void;
  /** Base HTML element. */
  Element: Element;
  /** An event which takes place in the DOM */
  Event: (name: any) => Event;
  /** Hyperlink anchor element. */
  HTMLAnchorElement: (name:any) =>  HTMLAnchorElement;
  /** A keyboard event from the DOM */
  KeyboardEvent: (name: any) => KeyboardEvent;
  /** In page data request without navigating from the current URL. */
  XMLHttpRequest: XMLHttpRequest;
  /**
   * your Typescript shims should go below this comment
   */
};

/** Assign global values from domino window. */
global.window = window;
global.document = window.document;
global.navigator = window.navigator;

/**
 * Assign mock values to common global usages.
 * This will allow for extending functionality.
 */
global.CSS = window.CSS = function () {} as any;
global.Element = window.Element = (function () {} as unknown) as Element;
global.Event = window.Event = (function () {} as unknown) as (n) => Event;
global.HTMLAnchorElement = window.HTMLAnchorElement = (function () {} as unknown) as () => HTMLAnchorElement;
global.KeyboardEvent = window.KeyboardEvent = (function () {} as unknown) as () => KeyboardEvent;

/** Example mock for using Prism */
// global.Prism = undefined;

/**
 * polyfill for requestAnimationFrame.
 * The callback will be called at the end of the micro-task-queue.
 * It can not be cancelled.
 */
global.requestAnimationFrame = window.requestAnimationFrame = function rqa(
  callback: FrameRequestCallback
) {
  /**
   * use a setTimeout to mimic requestAnimantionFrame
   * it logs to console, so you can spot excessive use.
   */
  console.log(`requestAnimationFrame called`);
  return setTimeout(() => callback(performance.now())), 0;
};

/**
 * Mock for cancelAnimationFrame.
 * An empty function, animation frames can not be cancelled with this shim.
 */
global.cancelAnimationFrame = window.cancelAnimationFrame = (x?: number) => {};

/**
 * Your shims and polyfills should go below here.
 */
