import {ListWrapper, MapWrapper, Map, StringMapWrapper, List} from 'angular2/src/facade/collection';
import {isPresent, isBlank, BaseException, stringify} from 'angular2/src/facade/lang';
import {DOM} from 'angular2/src/dom/dom_adapter';
import {DomProtoView} from 'angular2/src/render/dom/view/proto_view';
import {RenderViewRef, RenderEventDispatcher} from 'angular2/src/render/api';
import {camelCaseToDashCase} from 'angular2/src/render/dom/util';


var parse5 = require('parse5');
var parser = new parse5.Parser(parse5.TreeAdapters.htmlparser2);
var serializer = new parse5.Serializer(parse5.TreeAdapters.htmlparser2);
var treeAdapter = parser.treeAdapter;

var cssParse = require('css').parse;


export function resolveInternalJsonView(viewRef: RenderViewRef): JsonView {
  return (<JsonViewRef>viewRef)._view;
}

export class JsonViewRef extends RenderViewRef {
  constructor(public _view: JsonView) { super(); }
}

export class JsonView {
  tagName;
  parent: JsonView;
  children: Array<JsonView> = [];

  attrs     = {};
  classList = [];
  props     = {};
  styles    = {};

  attrsDash     = {};
  classListDash = [];

  hydrated: boolean = false;
  eventDispatcher: RenderEventDispatcher = null;
  eventHandlerRemovers: List<Function> = [];

  constructor(public proto: DomProtoView, public boundTextNodes: List<Node>,
              public boundElements: Element[]) {}

  setElementProperty(elementIndex: number, propertyName: string, value: any) {
    DOM.setProperty(this.boundElements[elementIndex], propertyName, value);
  }

  setElementAttribute(elementIndex: number, attributeName: string, value: string) {

    var dashCasedAttributeName = camelCaseToDashCase(attributeName);

    var element = this.boundElements[elementIndex];
    if (isPresent(value)) {
      this.attrs[attributeName] = value;
      this.attrsDash[dashCasedAttributeName] = value;

      DOM.setAttribute(element, dashCasedAttributeName, stringify(value));
    } else {
      this.attrs[attributeName] = null;
      this.attrsDash[dashCasedAttributeName] = null;

      DOM.removeAttribute(element, dashCasedAttributeName);
    }
  }


  setElementClass(elementIndex: number, className: string, isAdd: boolean) {


    var element = this.boundElements[elementIndex];
    var dashCasedClassName = camelCaseToDashCase(className);

    var index = this.classList.indexOf(className);
    var indexDash = this.classListDash.indexOf(className);
    if (isAdd) {
      if (index == -1) {
        this.classList[index] = className;
      }
      if (indexDash == -1) {
        this.classListDash[indexDash] = dashCasedClassName;
      }
      DOM.addClass(element, dashCasedClassName);
    } else {
      if (index > -1) {
        this.classList.splice(indexDash, 1);
      }
      if (indexDash > -1) {
        this.classListDash.splice(indexDash, 1);
      }
      DOM.removeClass(element, dashCasedClassName);
    }
  }

  setElementStyle(elementIndex: number, styleName: string, value: string) {
    var element = this.boundElements[elementIndex];
    var dashCasedStyleName = camelCaseToDashCase(styleName);
    if (isPresent(value)) {
      DOM.setStyle(element, dashCasedStyleName, stringify(value));
    } else {
      DOM.removeStyle(element, dashCasedStyleName);
    }
  }

  invokeElementMethod(elementIndex: number, methodName: string, args: List<any>) {
    var element = this.boundElements[elementIndex];
    DOM.invoke(element, methodName, args);
  }

  setText(textIndex: number, value: string) {
    DOM.setText(this.boundTextNodes[textIndex], value);
  }

  dispatchEvent(elementIndex: number, eventName: string, event: Event): boolean {
    var allowDefaultBehavior = true;
    if (isPresent(this.eventDispatcher)) {
      var evalLocals = new Map();
      evalLocals.set('$event', event);
      // TODO(tbosch): reenable this when we are parsing element properties
      // out of action expressions
      // var localValues = this.proto.elementBinders[elementIndex].eventLocals.eval(null, new
      // Locals(null, evalLocals));
      // this.eventDispatcher.dispatchEvent(elementIndex, eventName, localValues);
      allowDefaultBehavior =
          this.eventDispatcher.dispatchRenderEvent(elementIndex, eventName, evalLocals);
      if (!allowDefaultBehavior) {
        event.preventDefault();
      }
    }
    return allowDefaultBehavior;
  }
}

