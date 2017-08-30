import { Injectable, Inject, APP_ID, PLATFORM_ID} from "@angular/core";
import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT } from '@angular/platform-browser';

const STATE_TRANSFER_TOKEN = 'NGU_STATE_TRANSFER_TOKEN';
type StateTransferWindow = { [key: string]: string } & Window

@Injectable()
export class StateTransferStoreManager {
  get(token: string, defaultValue: object) {
    return this.states.get(token) || defaultValue;
  }
  protected states = new Map<string, () => object>();

  //need to declare these so they are accessable on both server and browser
  //however thye only do something on the server
  onSeralize(token: string, stateFn: () => any) {
    //noop
    //ts complains otherwise
    token;
    stateFn;
  }
  inject() {
    //noop
  }

}

@Injectable()
export class ServerStateTransferStoreManager extends StateTransferStoreManager{
  constructor(
    @Inject(DOCUMENT) private document: any,
    @Inject(APP_ID) private appId: string,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    super();
    if (isPlatformBrowser(platformId)) {
      const stores = JSON.parse((window as StateTransferWindow)[`${this.appId}-${STATE_TRANSFER_TOKEN}`]);
      Object.keys(stores).forEach(key => {
        this.states.set(key, stores[key]);
      })
    }
  }
  private seralizeFunctions = new Map<string, () => object>();

  onSeralize(token: string, stateFn: () => any) {
    this.seralizeFunctions.set(token, stateFn);
  }

  inject() {
    const state: { [key: string]: object } = {}
    this.states.forEach((fn, token) => {
      //execute the function and assign the result
      state[token] = fn();
    })

    const stateString = JSON.stringify(state);
    const transferKey = `${this.appId}-${STATE_TRANSFER_TOKEN}`;

    const script = this.document.createElement('script')

    script.innerHTML(`window['${transferKey}']=${stateString}`);

    // https://github.com/angular/universal/issues/793
    script.setAttribute('nonce', transferKey);
    this.document.head.appendChild(script);

  }
}

