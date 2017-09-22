// The CLI requires this file to run tests

import { NgModule, Component } from "@angular/core";

@Component({
  selector: 'a',
  template: 'a'
})
export class AppComponent{}


@NgModule({
  declarations: [AppComponent]
})
export class AppModule{}
