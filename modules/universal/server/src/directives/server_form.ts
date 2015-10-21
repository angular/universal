import {
  Directive,
  ElementRef,
  OpaqueToken,
  Injectable,
  Optional,
  Inject
} from 'angular2/angular2';

import {Renderer} from 'angular2/src/core/render/render';
import {isPresent, CONST_EXPR} from 'angular2/src/core/facade/lang';
import {StringMap} from 'angular2/src/core/facade/collection';

export const APP_LOCATION: OpaqueToken = CONST_EXPR(new OpaqueToken('appLocation'));

@Directive({
  selector: 'form',
  host: {
    'method': 'POST'
  }
})
export class ServerForm {
  constructor(
    element: ElementRef,
    renderer: Renderer,
    @Optional() @Inject(APP_LOCATION) appLocation?: string) {

    let url: string = '/';
    if (typeof window === 'object' && 'location' in window) {
      // Grab Browser location if browser
      url = window.location.toString();
    }
    appLocation = isPresent(appLocation) ? appLocation : url;


    renderer.setElementAttribute(element, 'action', appLocation);
  }
}

