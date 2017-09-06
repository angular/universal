//only want this to happen on the server
import { StateTransferStoreManager, ServerStateTransferStoreManager } from "./manager";
import { NgModule } from "@angular/core";
import { BEFORE_APP_SERIALIZED } from '@angular/platform-server';

export function stateTransferInjectFactory(stateTransfer: StateTransferStoreManager) {
  return () => {
    stateTransfer.inject();
  };
}

@NgModule({
  providers: [
    {
      provide: StateTransferStoreManager,
      useClass: ServerStateTransferStoreManager
    },
    {
      provide: BEFORE_APP_SERIALIZED,
      useFactory: stateTransferInjectFactory,
      multi: true,
      deps: [
        StateTransferStoreManager,
      ]
    }
  ]
})
export class ServerStateTransferModule{}
