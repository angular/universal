import {
  isString,
  isPresent,
  isBlank,
  BaseException,
  RegExpWrapper,
  CONST_EXPR
} from 'angular2/src/facade/lang';
import {ListWrapper, MapWrapper, Map, StringMapWrapper, List} from 'angular2/src/facade/collection';
import {DOM} from 'angular2/src/dom/dom_adapter';

import {SelectorMatcher, CssSelector} from 'angular2/src/render/dom/compiler/selector';

var parse5 = require('parse5');
var parser = new parse5.Parser(parse5.TreeAdapters.htmlparser2);
var serializer = new parse5.Serializer(parse5.TreeAdapters.htmlparser2);
var treeAdapter = parser.treeAdapter;

var cssParse = require('css').parse;


var _singleTagWhitelist = ['br', 'hr', 'input'];
var _mapProps = ['attribs', 'x-attribsNamespace', 'x-attribsPrefix'];
var nodeTypes = {
    element: 1,
    text: 3,
    cdata: 4,
    comment: 8
};

export class JsonElement {
  type: any;
  tagName: any;
  data: any;

  children: Array<any> = null;
  parent: JsonElement = null;
  prev:   JsonElement = null;
  next:   JsonElement = null;

  className: string;

  attribs   = {};
  classList = [];
  props     = {};
  styles    = {};

  shadowRoot = null;

  _eventListenersMap = null;
  _window = null;

  constructor(properties:any = {}) {

    Object.assign(this.props, properties);
    Object.assign(this, properties);

  }
  get firstChild() {
    return isPresent(this.children) && this.children[0] || null;
  }
  get lastChild() {
    return isPresent(this.children) && this.children[this.children.length - 1] || null;
  }
  get nodeType() {
    return nodeTypes[this.type] || nodeTypes.element;
  }

  toString() {
    var result = '';
    result += `<${ this.tagName }`;

    let attributeMap = new Map();
    let elAttrs = treeAdapter.getAttrList(element);

    for (let i = 0; i < elAttrs.length; i++) {
      let attrib = elAttrs[i];
      attributeMap.set(attrib.name, attrib.value);
    }
    // attributes in an ordered way
    var keys = [];
    MapWrapper.forEach(attributeMap, (v, k) => { keys.push(k); });
    ListWrapper.sort(keys);
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      let attValue = attributeMap.get(key);
      if (!isString(attValue)) {
        result += ` ${ key }`;
      } else {
        result += ` ${ key }="${ attValue }"`;
      }
    }
    result += '>';
    return result;
  }

  clearNodes() {
    while (this.children.length > 0) {
      this.children[0].remove();
    }
  }
  setProperty(prop, value) {
    this.props[prop] = value;
    return this;
  }
  templateAwareRoot(): any {
    return this.isTemplateElement() ? this.content() : this;
  }
  isTemplateElement(): boolean {
    return this.isElementNode() && this.tagName === 'template';
  }
  isTextNode(): boolean { return treeAdapter.isTextNode(this); }
  isCommentNode(): boolean { return treeAdapter.isCommentNode(this); }
  isElementNode(): boolean { return treeAdapter.isElementNode(this); }
  hasShadowRoot(): boolean { return isPresent(this.shadowRoot); }
  isShadowRoot(): boolean { return this.getShadowRoot() == this; }
  getShadowRoot(): any { return this.shadowRoot; }

  content(): string {
    return this.children[0];
  }
  remove(): JsonElement {
    let parent = this.parent;
    if (isPresent(parent)) {
      let index = parent.children.indexOf(this);
      parent.children.splice(index, 1);
    }
    let prev = this.prev;
    let next = this.next;
    if (isPresent(this.prev)) {
      this.prev.next = next;
    }
    if (isPresent(this.next)) {
      this.next.prev = prev;
    }
    this.prev = null;
    this.next = null;
    this.parent = null;
    return this;
  }
  addClass(classname: string) {
    var classList = this.classList;
    var index = classList.indexOf(classname);
    if (index == -1) {
      classList.push(classname);
      this.attribs['class'] = this.className = ListWrapper.join(classList, ' ');
    }
  }
  removeClass(classname: string) {
    var classList = this.classList;
    var index = classList.indexOf(classname);
    if (index > -1) {
      classList.splice(index, 1);
      this.attribs['class'] = this.className = ListWrapper.join(classList, ' ');
    }
  }

  setStyle(stylename: string, stylevalue: string) {
    let styleMap = this._readStyleAttribute;
    this._writeStyleAttribute(styleMap[stylename]);
  }
  removeStyle(stylename: string) {
    this.setStyle(stylename, null);
  }

  getText(): string {
    if (this.isTextNode()) {
      return this.data;
    } else if (isBlank(this.children) || this.children.length == 0) {
      return '';
    } else {
      var textContent = '';
      for (var i = 0; i < this.children.length; i++) {
        textContent += this.children[i].getText();
      }
      return textContent;
    }
  }
  setText(value: string) {
    if (this.isTextNode()) {
      this.data = value;
    } else {
      this.clearNodes();
      if (value !== '') { treeAdapter.insertText(this, value); }
    }
  }

  createShadowRoot() {
    this.shadowRoot = treeAdapter.createDocumentFragment();
    this.shadowRoot.parent = this;
    return this.shadowRoot;
  }

  clone() {
    let node = this;
    let nodeClone = Object.create(Object.getPrototypeOf(node));
    for (let prop in node) {
      let desc = Object.getOwnPropertyDescriptor(node, prop);
      if (desc && 'value' in desc && typeof desc.value !== 'object') {
        nodeClone[prop] = node[prop];
      }
    }
    nodeClone.parent = null;
    nodeClone.prev = null;
    nodeClone.next = null;
    nodeClone.children = null;

    _mapProps.forEach(mapName => {
      if (isPresent(node[mapName])) {
        nodeClone[mapName] = {};
        for (let prop in node[mapName]) {
          if (StringMapWrapper.contains(node[mapName], prop)) {
            nodeClone[mapName][prop] = node[mapName][prop];
          }
        }
      }
    });
    let cNodes = this.children;
    if (isPresent(cNodes)) {
      let cNodesClone = ListWrapper.createGrowableSize(cNodes.length);
      for (let i = 0; i < cNodes.length; i++) {
        let childNode = cNodes[i];
        let childNodeClone = childNode.clone();
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

  querySelector(selector: string): any { return this.querySelectorAll(selector)[0]; }

  querySelectorAll(selector: string): List<any> {
    var res = [];
    var _recursive = (result, node, selector, matcher) => {
      let cNodes = node.children;
      if (cNodes && cNodes.length > 0) {
        for (let i = 0; i < cNodes.length; i++) {
          let childNode = cNodes[i];
          if (childNode.elementMatches(selector, matcher)) {
            result.push(childNode);
          }
          _recursive(result, childNode, selector, matcher);
        }
      }
    };
    let matcher = new SelectorMatcher();
    matcher.addSelectables(CssSelector.parse(selector));
    _recursive(res, this, selector, matcher);
    return res;
  }

  elementMatches(selector: string, matcher = null): boolean {
    let node = this;
    var result = false;
    if (isPresent(selector) && selector.charAt(0) === '#') {
      result = this.getAttribute('id') === selector.substring(1);
    } else if (isPresent(selector)) {
      result = false;
      if (matcher == null) {
        matcher = new SelectorMatcher();
        matcher.addSelectables(CssSelector.parse(selector));
      }

      var cssSelector = new CssSelector();
      cssSelector.setElement(node.tagName);
      if (isPresent(node.attribs)) {
        for (let attrName in node.attribs) {
          if (StringMapWrapper.contains(node.attribs, attrName)) {
            cssSelector.addAttribute(attrName, node.attribs[attrName]);
          }
        }
      }
      for (let i = 0; i < this.classList.length; i++) {
        cssSelector.addClassName(this.classList[i]);
      }

      matcher.match(cssSelector, function(selector, cb) { result = true; });
    }
    return result;
  }

  hasAttribute(attribute: string): boolean {
    return this.attribs && this.attribs.hasOwnProperty(attribute);
  }

  getAttribute(attribute: string): string {
    return isPresent(this.attribs) && this.attribs.hasOwnProperty(attribute) ?
               this.attribs[attribute] :
               null;
  }
  setAttribute(attribute: string, value: string = null) {
    if (isPresent(attribute)) {
      this.attribs[attribute] = value;
    }
  }
  removeAttribute(attribute: string) {
    if (isPresent(attribute)) {
      this.attribs[attribute] = null;
    }
  }
  appendChild(node) {
    node.remove();
    DOM.templateAwareRoot(this).children.push(node);
    node.parent = DOM.templateAwareRoot(this);
  }
  getElementsByClassName(element, name: string): List<HTMLElement> {
    return this.querySelectorAll('.' + name);
  }

  hasClass(element, classname: string): boolean {
    return ListWrapper.contains(this.classList, classname);
  }
  on(evt, listener) {
    var listenersMap = this._eventListenersMap;

    if (isBlank(listenersMap)) {
      listenersMap = StringMapWrapper.create();
      this._eventListenersMap = listenersMap;
    }

    var listeners = StringMapWrapper.get(listenersMap, evt);
    if (isBlank(listeners)) {
      listeners = [];
    }
    listeners.push(listener);
    StringMapWrapper.set(listenersMap, evt, listeners);
  }
  onAndCancel(evt, listener): Function {
    this.on(evt, listener);
    return () => {
      ListWrapper.remove(StringMapWrapper.get(this._eventListenersMap, evt), listener);
    };
  }
  dispatchEvent(evt) {
    if (isBlank(evt.target)) {
      evt.target = this;
    }
    if (isPresent(this._eventListenersMap)) {
      var listeners: any = StringMapWrapper.get(this._eventListenersMap, evt.type);
      if (isPresent(listeners)) {
        for (let i = 0; i < listeners.length; i++) {
          listeners[i](evt);
        }
      }
    }
    if (isPresent(this.parent)) {
      this.parent.dispatchEvent(evt);
    }

    if (isPresent(this._window)) {
      DOM.dispatchEvent((<any>DOM).defaultDoc()._window, evt);
    }
  }

  _readStyleAttribute() {
    var styleMap = {};
    var attributes = this.attribs;
    if (isPresent(attributes) && attributes.hasOwnProperty("style")) {
      var styleAttrValue = attributes['style'];
      var styleList = styleAttrValue.split(/;+/g);
      for (let i = 0; i < styleList.length; i++) {
        if (styleList[i].length > 0) {
          let elems = styleList[i].split(/:+/g);
          styleMap[elems[0].trim()] = elems[1].trim();
        }
      }
    }
    return styleMap;
  }
  _writeStyleAttribute(styleMap) {
    var styleAttrValue = '';
    for (let key in styleMap) {
      var newValue = styleMap[key];
      if (isPresent(newValue) && newValue.length > 0) {
        styleAttrValue += key + ':' + styleMap[key] + ';';
      }
    }
    this.attribs['style'] = styleAttrValue;
  }
}

var nodePropertyShorthands = {
    tagName: 'name',
    childNodes: 'children',
    parentNode: 'parent',
    parentElement: 'parent',
    previousSibling: 'prev',
    nextSibling: 'next',
    nodeValue: 'data'
};

Object.keys(nodePropertyShorthands).forEach(function (key) {
  var shorthand = nodePropertyShorthands[key];

  Object.defineProperty(JsonElement.prototype, key, {
    get: function () {
      return this[shorthand] || null;
    },
    set: function (val) {
      this[shorthand] = val;
      return val;
    }
  });
});


