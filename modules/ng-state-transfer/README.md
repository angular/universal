# State Transfer

## installation
`npm install --save @nguniversal/state-tranfer` or `yarn add @nguniversal/state-tranfer`

**app.module.ts**
```
import { BrowserStateTransferModule } from '@nguniversal/state-tranfer';

@NgModule({
  imports: [ BrowserStateTransferModule ]
  ...
})
```

**app.server.module.ts**
```
import { ServerStateTransferModule } from '@nguniversal/state-tranfer';

@NgModule({
  imports: [ ServerStateTransferModule ]
  ...
})
```

## Usage
```
const COUNTER_STATE = 'COUNTER_STATE'

class MyCounterComponent {
  counter: number;
  constructor(stateManager: StateManager) {
    //sets up inital state, which might be grabbing state that was generated on the sevrer
    this.counter = this.stateManager.get(COUNTER_STATE, {counter: 0}).counter;

    //setup a function to be called when the App is about to be serialized on the server
    this.stateManager.onSerialize(COUNTER_STATE, () => {counter: this.counter});
  }
  click() {
    this.counter++;
  }
}
```