import {PrebootOptions} from './preboot_options';
import {Element} from './element';

export interface GlobalState {
  apps:[AppState]   
}

export interface AppState {
    opts:PrebootOptions,
    appRootName:string,
    freeze: any,           // only used if freeze option is passed in
    canComplete: boolean,      // set to false if preboot paused through an event
    completeCalled: boolean,    // set to true once the completion event has been raised
    started:boolean, 
    window?: any,
    document?: any,
    body?: any,
    appRoot?: any,
    serverRoot?: any,
    clientRoot?: any,
    activeNode?: any;               // copied from prebootref for strategies
    selection?: CursorSelection;    // copied from prebootref for strategies
}

/*
export interface DomState {
  window?: Element;
  document?: Element;
  body?: Element;
  appRoot?: Element;
  serverRoot?: Element;
  clientRoot?: Element;
}
*/

export interface CursorSelection {
  start?: number;
  end?: number;
  direction?: string;
}

// interface for the dom wrapper
export interface Dom {
  getDocumentNode?(app:AppState): Element;
  getAppNode?(app:AppState, selector: string): Element;
  getNodeKey?(node: Element, rootNode: Element): string;
  getAllAppNodes?(app:AppState, selector: string): Element[];
  getClientNodes?(app:AppState, selector: string): Element[];
  onLoad?(handler: Function);
  on?(eventName: string, handler: Function);
  dispatchGlobalEvent(app:AppState, eventName: string);
  dispatchNodeEvent(app:AppState, node: Element, eventName: string);
  appContains(app:AppState, node: Element): Boolean;
  addNodeToBody(app:AppState, type: string, className: string, styles: Object): Element;
  removeNode?(node: Element);
  findClientNode(app:AppState, serverNode: Element, nodeKey?: any): Element ;
  getSelection?(node: Element): CursorSelection;
  setSelection?(node: Element, selection: CursorSelection);
}

/*
// interface for preboot modules available to strategies
export interface PrebootRef {
  dom: Dom;
  log?: Function;
  activeNode?: any;
  time?: number;
  selection?: CursorSelection;
}
*/
