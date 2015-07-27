/// <reference path="../typings/tsd.d.ts" />

// dom closure
import {Parse5DomAdapter} from 'angular2/src/dom/parse5_adapter';
Parse5DomAdapter.makeCurrent();

import {List, ListWrapper, MapWrapper} from 'angular2/src/facade/collection';
import {DOM} from 'angular2/src/dom/dom_adapter';
import {isPresent, isString, StringWrapper} from 'angular2/src/facade/lang';

var _singleTagWhitelist = ['br', 'hr', 'input'];

export function stringifyElement(el): string {
  var result = '';
  if (el && el.tagName) {
    var tagName = el.tagName;// || DOM.tagName(el)).toLowerCase();

    // opening tag
    result += `<${ tagName }`;

    // attributes in an ordered way
    var attributeMap = DOM.attributeMap(el);
    var keys = [];
    MapWrapper.forEach(attributeMap, (v, k) => { keys.push(k); });
    ListWrapper.sort(keys);
    for (let i = 0; i < keys.length; i++) {
      var key = keys[i];
      var attValue = attributeMap.get(key);
      if (!isString(attValue)) {
        result += ` ${key}`;
      } else {
        result += ` ${key}="${attValue}"`;
      }
    }
    result += '>';

    // children
    var children = el.children || DOM.childNodes(DOM.templateAwareRoot(el));
    for (let j = 0; j < children.length; j++) {
      result += stringifyElement(children[j]);
    }

    // closing tag
    if (!ListWrapper.contains(_singleTagWhitelist, tagName)) {
      result += `</${ tagName }>`;
    }
  } else {
    result += DOM.getText(el);
  }

  return result;
}
