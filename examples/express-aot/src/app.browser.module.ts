import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  UniversalModule,
} from 'angular2-universal/browser';

import { App, Wat } from './app';


@NgModule({
  bootstrap: [ App ],
  declarations: [ App, Wat ],
  imports: [
    UniversalModule,
    FormsModule
  ],
  providers: [

  ]
})
export class MainModule {
}
