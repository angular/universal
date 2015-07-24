import {bind, Inject, Injectable, OpaqueToken} from 'angular2/di';
import {
  isPresent,
  isBlank,
  BaseException,
  RegExpWrapper,
  CONST_EXPR
} from 'angular2/src/facade/lang';
import {ListWrapper, MapWrapper, Map, StringMapWrapper, List} from 'angular2/src/facade/collection';

import {DOM} from 'angular2/src/dom/dom_adapter';

import {EventManager} from 'angular2/src/render/dom/events/event_manager';

import {DomProtoView, DomProtoViewRef, resolveInternalDomProtoView} from 'angular2/src/render/dom/view/proto_view';
// import {DomView, DomViewRef, resolveInternalJsonView} from 'angular2/src/render/dom/view/view';
// import {DomFragmentRef, resolveInternalDomFragment} from 'angular2/src/render/dom/view/fragment';

import {
  NG_BINDING_CLASS_SELECTOR,
  NG_BINDING_CLASS,
  cloneAndQueryProtoView,
  camelCaseToDashCase,
  queryBoundElements,
  queryFragments,
  ClonedProtoView
} from 'angular2/src/render/dom/util';

import {
  Renderer,
  RenderProtoViewRef,
  RenderViewRef,
  RenderElementRef,
  RenderFragmentRef,
  RenderViewWithFragments
} from 'angular2/src/render/api';

import {
  DOM_REFLECT_PROPERTIES_AS_ATTRIBUTES,
  DOCUMENT_TOKEN
} from 'angular2/src/render/dom/dom_renderer';

import {JsonView, JsonViewRef, resolveInternalJsonView} from './json_view';
import {JsonFragmentRef, resolveInternalJsonFragment} from './json_fragment';
import {JsonElement} from './json_element';

const REFLECT_PREFIX = 'ng-reflect-';


var parse5 = require('parse5');
var parser = new parse5.Parser(parse5.TreeAdapters.htmlparser2);
var serializer = new parse5.Serializer(parse5.TreeAdapters.htmlparser2);
var treeAdapter = parser.treeAdapter;

var cssParse = require('css').parse;

var mapProps = ['attribs', 'x-attribsNamespace', 'x-attribsPrefix'];

@Injectable()
export class JsonRenderer extends Renderer {
  _document;
  _reflectPropertiesAsAttributes: boolean;

  constructor(public _eventManager: EventManager, @Inject(DOCUMENT_TOKEN) document) {
    super();
    this._reflectPropertiesAsAttributes = false;
    this._document = document;
  }

  toString() {
    return 'JsonRenderer';
  }

  createRootHostView(hostProtoViewRef: RenderProtoViewRef, fragmentCount: number,
                     hostElementSelector: string): RenderViewWithFragments {
    var hostProtoView = resolveInternalDomProtoView(hostProtoViewRef);

    var element = DOM.querySelector(this._document, hostElementSelector);
    if (isBlank(element)) {
      throw new BaseException(`The selector "${hostElementSelector}" did not match any elements`);
    }

    return this._createView(hostProtoView, element);
  }

  createView(protoViewRef: RenderProtoViewRef, fragmentCount: number): RenderViewWithFragments {
    var protoView = resolveInternalDomProtoView(protoViewRef);
    return this._createView(protoView, null);
  }

  destroyView(viewRef: RenderViewRef) {
    // noop for now
  }

  getNativeElementSync(location: RenderElementRef): any {
    if (isBlank(location.renderBoundElementIndex)) {
      return null;
    }
    return resolveInternalJsonView(location.renderView).
      boundElements[location.renderBoundElementIndex];
  }
                                                /* Node */
  getRootNodes(fragment: RenderFragmentRef): List<any> {
    return resolveInternalJsonFragment(fragment);
  }

  attachFragmentAfterFragment(previousFragmentRef: RenderFragmentRef,
                              fragmentRef: RenderFragmentRef) {
    var previousFragmentNodes = resolveInternalJsonFragment(previousFragmentRef);
    if (previousFragmentNodes.length > 0) {
      var sibling = previousFragmentNodes[previousFragmentNodes.length - 1];
      moveNodesAfterSibling(sibling, resolveInternalJsonFragment(fragmentRef));
    }
  }

  attachFragmentAfterElement(elementRef: RenderElementRef, fragmentRef: RenderFragmentRef) {
    if (isBlank(elementRef.renderBoundElementIndex)) {
      return;
    }
    var parentView = resolveInternalJsonView(elementRef.renderView);
    var element = parentView.boundElements[elementRef.renderBoundElementIndex];
    moveNodesAfterSibling(element, resolveInternalJsonFragment(fragmentRef));
  }

  detachFragment(fragmentRef: RenderFragmentRef) {
    var fragmentNodes = resolveInternalJsonFragment(fragmentRef);
    for (var i = 0; i < fragmentNodes.length; i++) {
      DOM.remove(fragmentNodes[i]);
    }
  }

  hydrateView(viewRef: RenderViewRef) {
    var view = resolveInternalJsonView(viewRef);
    if (view.hydrated) { throw new BaseException('The view is already hydrated.'); }
    view.hydrated = true;

    // add global events
    view.eventHandlerRemovers = [];
    var binders = view.proto.elementBinders;
    for (var binderIdx = 0; binderIdx < binders.length; binderIdx++) {
      var binder = binders[binderIdx];
      if (isPresent(binder.globalEvents)) {
        for (var i = 0; i < binder.globalEvents.length; i++) {
          var globalEvent = binder.globalEvents[i];
          var remover = this._createGlobalEventListener(view, binderIdx, globalEvent.name,
                                                        globalEvent.target, globalEvent.fullName);
          view.eventHandlerRemovers.push(remover);
        }
      }
    }
  }

  dehydrateView(viewRef: RenderViewRef) {
    var view = resolveInternalJsonView(viewRef);

    // remove global events
    for (var i = 0; i < view.eventHandlerRemovers.length; i++) {
      view.eventHandlerRemovers[i]();
    }

    view.eventHandlerRemovers = null;
    view.hydrated = false;
  }

  setElementProperty(location: RenderElementRef, propertyName: string, propertyValue: any): void {
    if (isBlank(location.renderBoundElementIndex)) {
      return;
    }
    var view = resolveInternalJsonView(location.renderView);
    view.setElementProperty(location.renderBoundElementIndex, propertyName, propertyValue);
    // Reflect the property value as an attribute value with ng-reflect- prefix.
    if (this._reflectPropertiesAsAttributes) {
      this.setElementAttribute(location, `${REFLECT_PREFIX}${camelCaseToDashCase(propertyName)}`,
                               propertyValue);
    }
  }

  setElementAttribute(location: RenderElementRef, attributeName: string, attributeValue: string):
      void {
    if (isBlank(location.renderBoundElementIndex)) {
      return;
    }
    var view = resolveInternalJsonView(location.renderView);
    view.setElementAttribute(location.renderBoundElementIndex, attributeName, attributeValue);
  }

  setElementClass(location: RenderElementRef, className: string, isAdd: boolean): void {
    if (isBlank(location.renderBoundElementIndex)) {
      return;
    }
    var view = resolveInternalJsonView(location.renderView);
    view.setElementClass(location.renderBoundElementIndex, className, isAdd);
  }

  setElementStyle(location: RenderElementRef, styleName: string, styleValue: string): void {
    if (isBlank(location.renderBoundElementIndex)) {
      return;
    }
    var view = resolveInternalJsonView(location.renderView);
    view.setElementStyle(location.renderBoundElementIndex, styleName, styleValue);
  }

  invokeElementMethod(location: RenderElementRef, methodName: string, args: List<any>): void {
    if (isBlank(location.renderBoundElementIndex)) {
      return;
    }
    var view = resolveInternalJsonView(location.renderView);
    view.invokeElementMethod(location.renderBoundElementIndex, methodName, args);
  }

  setText(viewRef: RenderViewRef, textNodeIndex: number, text: string): void {
    if (isBlank(textNodeIndex)) {
      return;
    }
    var view = resolveInternalJsonView(viewRef);
    DOM.setText(view.boundTextNodes[textNodeIndex], text);
  }

  setEventDispatcher(viewRef: RenderViewRef, dispatcher: any /*api.EventDispatcher*/): void {
    var view = resolveInternalJsonView(viewRef);
    view.eventDispatcher = dispatcher;
  }

                                                  /*HTMLElement*/
  _createView(protoView: DomProtoView, inplaceElement: any): RenderViewWithFragments {
    var clonedProtoView = this.__cloneAndQueryProtoView(protoView);

    var boundElements = clonedProtoView.boundElements;

    // adopt inplaceElement
    if (isPresent(inplaceElement)) {
      if (protoView.fragmentsRootNodeCount[0] !== 1) {
        let error = new BaseException('Root proto views can only contain one element!');
        throw error;
      }

      // remove children from hostElement
      DOM.clearNodes(inplaceElement);

      var tempRoot = clonedProtoView.fragments[0][0];
      moveChildNodes(tempRoot, inplaceElement);
      if (boundElements.length > 0 && boundElements[0] === tempRoot) {
        boundElements[0] = inplaceElement;
      }
      clonedProtoView.fragments[0][0] = inplaceElement;
    }

    var view = new JsonView(protoView, clonedProtoView.boundTextNodes, boundElements);

    var binders = protoView.elementBinders;
    for (var binderIdx = 0; binderIdx < binders.length; binderIdx++) {
      var binder = binders[binderIdx];
      var element = boundElements[binderIdx];

      // native shadow DOM
      if (binder.hasNativeShadowRoot) {
        var shadowRootWrapper = element.firstChild;
        moveChildNodes(shadowRootWrapper, DOM.createShadowRoot(element));
        DOM.remove(shadowRootWrapper);
      }

      // events
      if (isPresent(binder.eventLocals) && isPresent(binder.localEvents)) {
        for (var i = 0; i < binder.localEvents.length; i++) {
          this._createEventListener(view, element, binderIdx, binder.localEvents[i].name,
                                    binder.eventLocals);
        }
      }
    }

    let fragments = clonedProtoView.fragments.map(nodes => new JsonFragmentRef(nodes));
    let viewRef = new JsonViewRef(view);
    return new RenderViewWithFragments(viewRef, fragments);
  }

  __clone(node: any): JsonElement {
    var _recursive = (node) => {
      var nodeClone = Object.create(Object.getPrototypeOf(node));
      for (var prop in node) {
        var desc = Object.getOwnPropertyDescriptor(node, prop);
        if (desc && 'value' in desc && typeof desc.value !== 'object') {
          nodeClone[prop] = node[prop];
        }
      }
      nodeClone.parent = null;
      nodeClone.prev = null;
      nodeClone.next = null;
      nodeClone.children = null;

      mapProps.forEach(mapName => {
        if (isPresent(node[mapName])) {
          nodeClone[mapName] = {};
          for (var prop in node[mapName]) {
            nodeClone[mapName][prop] = node[mapName][prop];
          }
        }
      });
      var cNodes = node.children;
      if (cNodes) {
        var cNodesClone = new Array(cNodes.length);
        for (var i = 0; i < cNodes.length; i++) {
          var childNode = cNodes[i];
          var childNodeClone = _recursive(childNode);
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
    };
    return _recursive(node);

  }

  __cloneAndQueryProtoView(pv: DomProtoView): ClonedProtoView {
    var templateContent = this.__clone(pv.rootElement.childNodes[0]);
    pv.rootElement.childNodes[0]

    var boundElements = this.__queryBoundElements(templateContent, pv.isSingleElementFragment);
    var boundTextNodes = this.__queryBoundTextNodes(templateContent, pv.rootTextNodeIndices, boundElements,
                                             pv.elementBinders, pv.boundTextNodeCount);

    var fragments = this.__queryFragments(templateContent, pv.fragmentsRootNodeCount);
    return new ClonedProtoView(pv, fragments, boundElements, boundTextNodes);
  }
  __queryBoundElements(templateContent: JsonElement, isSingleElementChild: boolean):
      JsonElement[] {
    var result;
    var dynamicElementList;
    var elementIdx = 0;
    if (isSingleElementChild) {
      var rootElement = templateContent.firstChild;
      var rootHasBinding = DOM.hasClass(rootElement, NG_BINDING_CLASS);
      dynamicElementList = DOM.getElementsByClassName(rootElement, NG_BINDING_CLASS);
      result = ListWrapper.createFixedSize(dynamicElementList.length + (rootHasBinding ? 1 : 0));
      if (rootHasBinding) {
        result[elementIdx++] = rootElement;
      }
    } else {
      dynamicElementList = templateContent.querySelectorAll(NG_BINDING_CLASS_SELECTOR);
      result = ListWrapper.createFixedSize(dynamicElementList.length);
    }
    for (var i = 0; i < dynamicElementList.length; i++) {
      result[elementIdx++] = dynamicElementList[i];
    }
    return result;
  }
  __queryBoundTextNodes(templateContent: JsonElement, rootTextNodeIndices: number[],
                                 boundElements: JsonElement[], elementBinders: any,
                                 boundTextNodeCount: number): JsonElement[] {
      var boundTextNodes = ListWrapper.createFixedSize(boundTextNodeCount);
      var textNodeIndex = 0;
      if (rootTextNodeIndices.length > 0) {
        var rootChildNodes = DOM.childNodes(templateContent);
        for (var i = 0; i < rootTextNodeIndices.length; i++) {
          boundTextNodes[textNodeIndex++] = rootChildNodes[rootTextNodeIndices[i]];
        }
      }
      for (var i = 0; i < elementBinders.length; i++) {
        var binder = elementBinders[i];
        var element: JsonElement = boundElements[i];
        if (binder.textNodeIndices.length > 0) {
          var childNodes = DOM.childNodes(element);
          for (var j = 0; j < binder.textNodeIndices.length; j++) {
            boundTextNodes[textNodeIndex++] = childNodes[binder.textNodeIndices[j]];
          }
        }
      }
      return boundTextNodes;
  }
  __queryFragments(templateContent: JsonElement, fragmentsRootNodeCount: number[]): JsonElement[][] {
    // console.log('fragmentsRootNodeCount', templateContent.firstChild, fragmentsRootNodeCount);
    var fragments = ListWrapper.createGrowableSize(fragmentsRootNodeCount.length);

    // Note: An explicit loop is the fastest way to convert a DOM array into a JS array!
    var childNode = templateContent.firstChild;

    for (var fragmentIndex = 0; fragmentIndex < fragments.length; fragmentIndex++) {
      var fragment = ListWrapper.createFixedSize(fragmentsRootNodeCount[fragmentIndex]);
      fragments[fragmentIndex] = fragment;
      for (var i = 0; i < fragment.length; i++) {
        fragment[i] = childNode;
        childNode = childNode.nextSibling;
      }
    }
    return fragments;
  }

  _createEventListener(view, element, elementIndex, eventName, eventLocals) {
    this._eventManager.addEventListener(
        element, eventName, (event) => { view.dispatchEvent(elementIndex, eventName, event); });
  }

  _createGlobalEventListener(view, elementIndex, eventName, eventTarget, fullName): Function {
    return this._eventManager.addGlobalEventListener(
        eventTarget, eventName, (event) => { view.dispatchEvent(elementIndex, fullName, event); });
  }
}

function moveNodesAfterSibling(sibling, nodes) {
  if (nodes.length > 0 && isPresent(DOM.parentElement(sibling))) {
    for (var i = 0; i < nodes.length; i++) {
      DOM.insertBefore(sibling, nodes[i]);
    }
    DOM.insertBefore(nodes[nodes.length - 1], sibling);
  }
}
                             /* Node         Node */
function moveChildNodes(source: any, target: any) {
  var currChild = source.firstChild;
  while (isPresent(currChild)) {
    var nextChild = currChild.next
    DOM.appendChild(target, currChild);
    currChild = nextChild;
  }
}


export var jsonRendererInjectables: Array<any> = [
  bind(JsonRenderer).toClass(JsonRenderer),
  bind(Renderer).toAlias(JsonRenderer)
];


