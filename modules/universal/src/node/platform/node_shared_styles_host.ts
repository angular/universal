import {Parse5DomAdapter} from '@angular/platform-server';
import {Inject, Injectable} from '@angular/core';
import {SetWrapper} from '@angular/core/src/facade/collection';
import {DOCUMENT} from '@angular/platform-browser/src/dom/dom_tokens';
import {SharedStylesHost} from '@angular/platform-browser/src/dom/shared_styles_host';

const DOM:any = Parse5DomAdapter;

@Injectable()
export class NodeSharedStylesHost extends SharedStylesHost {
  private _hostNodes = new Set<Node>();
  constructor() {
    super();
  }
  /** @internal */
  _addStylesToHost(styles: string[], host: Node) {
    for (var i = 0; i < styles.length; i++) {
      var style = styles[i];
      DOM.appendChild(host, DOM.createStyleElement(style));
    }
  }
  addHost(hostNode: Node) {
    this._addStylesToHost((<any>this)._styles, hostNode);
    this._hostNodes.add(hostNode);
  }
  removeHost(hostNode: Node) {
    SetWrapper.delete(this._hostNodes, hostNode);
  }

  onStylesAdded(additions: string[]) {
    this._hostNodes.forEach((hostNode) => {
      this._addStylesToHost(additions, hostNode);
    });
  }
}
