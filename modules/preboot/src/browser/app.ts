import {Element} from '../interfaces/element';
import { PrebootOptions } from '../interfaces/preboot_options'
import { PrebootState } from './preboot_state'
import { GlobalState, AppState } from '../interfaces/preboot_ref';

let state = PrebootState;

export function initAppRoot(app:AppState, options:any) : any{
     if (app){
         app.window = options.window || app.window || {};
         app.document = options.document || (app.window && app.window.document) || {};
         app.body = options.body || (app.document && app.document.body);
         app.appRoot = options.appRoot || app.body;
         app.serverRoot = app.clientRoot = app.appRoot;
     }
}
export function updateAppRoots(app:AppState, appRoot:any, clientRoot?:any, serverRoot?:any){
    if (app){
        app.appRoot = appRoot;
        app.clientRoot = clientRoot;
        app.serverRoot = serverRoot;
    }
}

export function addApp(appRoot:string, options:PrebootOptions){
   var app = { 
       freeze:null,
       appRootName:appRoot, 
       opts:options, 
       canComplete:false, 
       completeCalled:false, 
       started:false, 
       window:null, 
       document:null, 
       body:null, 
       appRoot:null, 
       clientRoot:null, 
       serverRoot:null};
   state.apps.push(app);
   return app;    
}
export function getApp(appRoot:string):AppState{
    state.apps.forEach(state => {if(state.appRootName === appRoot)return state;});
    return undefined;
}

/**
 * Add event listener at window level
 */
export function onLoad(app:AppState, handler: Function) {
  if (app.document && app.document.readyState === 'interactive') {
    handler();
  } else {
    app.document.addEventListener('DOMContentLoaded', handler);
  }
}

/**
 * These are global events that get passed around. Currently
 * we use the document to do this.
 */
export function on(app:AppState, eventName: string, handler: Function) {
  app.document.addEventListener(eventName, handler);
}