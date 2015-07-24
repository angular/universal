import {
  isPresent,
  isBlank,
  BaseException,
  RegExpWrapper,
  CONST_EXPR
} from 'angular2/src/facade/lang';
import {ListWrapper, MapWrapper, Map, StringMapWrapper, List} from 'angular2/src/facade/collection';
import {DOM} from 'angular2/src/dom/dom_adapter';

import {SelectorMatcher, CssSelector} from 'angular2/src/render/dom/compiler/selector';

var _singleTagWhitelist = ['br', 'hr', 'input'];

export class JsonElement {
  children: Array<JsonElement> = [];
  parent: JsonElement = null;
  prev:   JsonElement = null;
  next:   JsonElement = null;

  attribs   = {};
  classList = [];
  props     = {};
  styles    = {};

  constructor(public tagName: string, properties = {}) {

    Object.assign(this.props, properties);
    this.children = properties.children || this.children;

  }

  toString() {
    var result = '';
    result += `<${ this.tagName }`;

    // attributes in an ordered way
    var attributeMap = DOM.attributeMap(el);
    var keys = [];
    MapWrapper.forEach(attributeMap, (v, k) => { keys.push(k); });
    ListWrapper.sort(keys);
    for (let i = 0; i < keys.length; i++) {
      var key = keys[i];
      var attValue = attributeMap.get(key);
      if (!isString(attValue)) {
        result += ` ${ key }`;
      } else {
        result += ` ${ key }="${ attValue }"`;
      }
    }
    result += '>';
    return result
  }

  setProperty(prop, value) {
    this.props[prop] = value;
    return this;
  }

  remove(): JsonElement {
    var parent = this.parent;
    console.log('parent', parent.constructor.name)
    if (parent) {
      var index = parent.children.indexOf(el);
      parent.children.splice(index, 1);
    }
    if (this.prev) {
      this.prev.next = next;
    }
    if (this.next) {
      this.next.prev = prev;
    }
    this.prev = null;
    this.next = null;
    this.parent = null;
    return this;
  }

  clone() {
    var props = Object.assign({}, this.props);
    var nodeClone = new JsonElement(this.tagName, props);
    var cNodes = this.children;
    if (cNodes) {
      var cNodesClone = ListWrapper.createGrowableSize(cNodes.length);
      for (var i = 0; i < cNodes.length; i++) {
        var childNode = cNodes[i];
        var childNodeClone = childNode.clone();
        cNodesClone[i] = childNodeClone;
        if (i > 0) {
          childNodeClone.prev = cNodesClone[i - 1];
          cNodesClone[i - 1].next = childNodeClone;
        }
        childNodeClone.parent = nodeClone;
      }
      nodeClone.children = cNodesClone;
    }
    return nodeClone;
  }

  querySelector(el, selector: string): any { return this.querySelectorAll(el, selector)[0]; }

  querySelectorAll(el, selector: string): List<any> {
    var res = [];
    var _recursive = (result, node, selector, matcher) => {
      var cNodes = node.children;
      if (cNodes && cNodes.length > 0) {
        for (var i = 0; i < cNodes.length; i++) {
          var childNode = cNodes[i];
          if (this.elementMatches(childNode, selector, matcher)) {
            result.push(childNode);
          }
          _recursive(result, childNode, selector, matcher);
        }
      }
    };
    var matcher = new SelectorMatcher();
    matcher.addSelectables(CssSelector.parse(selector));
    _recursive(res, el, selector, matcher);
    return res;
  }

  elementMatches(node, selector: string, matcher = null): boolean {
    var result = false;
    if (selector && selector.charAt(0) == "#") {
      result = this.getAttribute(node, 'id') == selector.substring(1);
    } else if (selector) {
      var result = false;
      if (matcher == null) {
        matcher = new SelectorMatcher();
        matcher.addSelectables(CssSelector.parse(selector));
      }

      var cssSelector = new CssSelector();
      cssSelector.setElement(this.tagName(node));
      if (node.attribs) {
        for (var attrName in node.attribs) {
          cssSelector.addAttribute(attrName, node.attribs[attrName]);
        }
      }
      var classList = this.classList(node);
      for (var i = 0; i < classList.length; i++) {
        cssSelector.addClassName(classList[i]);
      }

      matcher.match(cssSelector, function(selector, cb) { result = true; });
    }
    return result;
  }

  hasAttribute(attribute: string): boolean {
    return this.attribs && this.attribs.hasOwnProperty(attribute);
  }

  getAttribute(attribute: string): string {
    return this.attribs && this.attribs.hasOwnProperty(attribute) ?
               this.attribs[attribute] :
               null;
  }
  setAttribute(element, attribute: string, value: string) {
    if (attribute) {
      element.attribs[attribute] = value;
    }
  }

  appendChild(node) {
    node.remove();
    DOM.templateAwareRoot(this).children.push(node);
    node.parent = DOM.templateAwareRoot(this);
  }
  getElementsByClassName(element, name: string): List<HTMLElement> {
    return this.querySelectorAll(element, "." + name);
  }

  hasClass(element, classname: string): boolean {
    return ListWrapper.contains(this.classList, classname);
  }

  get firstChild() {
    var children = this.children;
    return children && children[0] || null;
  }

  get lastChild() {
    var children = this.children;
    return children && children[children.length - 1] || null;
  }

}

