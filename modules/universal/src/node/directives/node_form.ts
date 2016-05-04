import {
  Directive,
  ElementRef,
  OpaqueToken,
  Injectable,
  Optional,
  Inject
} from '@angular/core';

import {Renderer} from '@angular/core';
import {isPresent, CONST_EXPR} from '@angular/facade/lang';

export const APP_LOCATION: OpaqueToken = CONST_EXPR(new OpaqueToken('appLocation'));

@Directive({
  selector: 'form',
  host: {
    'method': 'POST'
  }
})
export class NodeForm {
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


    renderer.setElementAttribute(element.nativeElement, 'action', appLocation);
  }
}
