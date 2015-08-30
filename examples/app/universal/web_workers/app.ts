/// <reference path="../../../../custom_typings/_custom.d.ts" />



import {ViewEncapsulation} from 'angular2/angular2';
import {ElementRef, Component, Directive, View, Injectable, Renderer} from 'angular2/angular2';
import {StringWrapper} from 'angular2/src/facade/lang';
import {bootstrap} from 'angular2/src/web-workers/ui/application';

@Injectable()
class GreetingService {
  greeting: string = 'hello';
}

@Component({
  selector: 'app',
  viewBindings: [GreetingService]
})
@View({
  encapsulation: ViewEncapsulation.NONE,
  template: `<div class="greeting">{{greeting}} <span>world</span>!</div>`
})
export class WorkerApp {
  greeting: string;
  lastKey: string = '(none)';

  constructor(service: GreetingService) { this.greeting = service.greeting; }

  changeGreeting(): void { this.greeting = 'howdy'; }

  onKeyDown(event): void { this.lastKey = StringWrapper.fromCharCode(event.keyCode); }
}
