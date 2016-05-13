import { PrebootOptions } from '../interfaces/preboot_options'
import {Element} from '../interfaces/element';

// in each client-side module, we store state in an object so we can mock
// it out during testing and easily reset it as necessary

export interface GlobalState {
  apps:[AppState]
    
}
export interface AppState{
    opts:PrebootOptions,
    appRootName:string,
    freeze: any,           // only used if freeze option is passed in
    canComplete: boolean,      // set to false if preboot paused through an event
    completeCalled: boolean,    // set to true once the completion event has been raised
    started:boolean, 
    window?: any,
    document?: any,
    body?: any,
    appRoot?: Element,
    serverRoot?: Element,
    clientRoot?: Element
}

let state:GlobalState = {
   // canComplete: true,      // set to false if preboot paused through an event
  //  completeCalled: false,  // set to true once the completion event has been raised
    apps:<[AppState]>[]
};

export var PrebootState = state;

