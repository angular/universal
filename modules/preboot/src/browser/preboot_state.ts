import { PrebootOptions } from '../interfaces/preboot_options'

// in each client-side module, we store state in an object so we can mock
// it out during testing and easily reset it as necessary

export interface GlobalState{
  freeze:any, 
  opts:PrebootOptions,
  appstates:[AppState], 
  started:boolean,   
}

export interface AppState{
    appRoot:string,
    canComplete: boolean,      // set to false if preboot paused through an event
    completeCalled: boolean    // set to true once the completion event has been raised
}

let state:GlobalState = {
   // canComplete: true,      // set to false if preboot paused through an event
  //  completeCalled: false,  // set to true once the completion event has been raised
    freeze: null,           // only used if freeze option is passed in
    opts: null,
    appstates:null
};

export function addAppState(appRoot:string){
    // test if the appRoot exists in the options as a valid appRoot
    if ((state.opts.appRoot.constructor === Array && state.opts.appRoot.indexOf(appRoot) > -1))
      state.appstates.push({ appRoot:appRoot, canComplete:false, completeCalled:false, started:false})
}
export function getAppState(appRoot:string):AppState{
    state.appstates.forEach(state => {if(state.appRoot === appRoot)return state;});
    return undefined;
}

export var PrebootState = state;

