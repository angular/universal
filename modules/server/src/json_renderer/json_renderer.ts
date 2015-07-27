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
  DOCUMENT_TOKEN,
  DomRenderer
} from 'angular2/src/render/dom/dom_renderer';

import {DomProtoView, DomProtoViewRef, resolveInternalDomProtoView} from 'angular2/src/render/dom/view/proto_view';
// import {DomView, DomViewRef, resolveInternalDomView} from 'angular2/src/render/dom/view/view';
// import {DomFragmentRef, resolveInternalDomFragment} from 'angular2/src/render/dom/view/fragment';

import {JsonView, JsonViewRef, resolveInternalJsonView} from './json_view';
import {JsonFragmentRef, resolveInternalJsonFragment} from './json_fragment';
import {JsonElement} from './json_element';

// var [DomView, DomViewRef, resolveInternalDomView] = [JsonView, JsonViewRef, resolveInternalJsonView];
// var [DomFragmentRef, resolveInternalDomFragment] = [JsonFragmentRef, resolveInternalJsonFragment];

const REFLECT_PREFIX = 'ng-reflect-';


var parse5 = require('parse5');
var parser = new parse5.Parser(parse5.TreeAdapters.htmlparser2);
var serializer = new parse5.Serializer(parse5.TreeAdapters.htmlparser2);
var treeAdapter = parser.treeAdapter;

var cssParse = require('css').parse;

var _mapProps = ['attribs', 'x-attribsNamespace', 'x-attribsPrefix'];

var _recursive = (node) => {
  var nodeClone = new JsonElement(node);
  // console.log('node', node.constructor.name)
  // var nodeClone = Object.create(Object.getPrototypeOf(node));
  Object.getOwnPropertyNames(node).forEach(propName => {
    Object.defineProperty(nodeClone, propName, Object.getOwnPropertyDescriptor(node, propName));
  });
  // for (let prop in node) {
  //   let desc = Object.getOwnPropertyDescriptor(node, prop);
  //   if (isPresent(desc) && 'value' in desc && typeof desc.value !== 'object') {
  //     nodeClone[prop] = node[prop];
  //   }
  // }
  nodeClone.parent = null;
  nodeClone.prev = null;
  nodeClone.next = null;
  nodeClone.children = null;

  // ['attribs', 'x-attribsNamespace', 'x-attribsPrefix'];
  _mapProps.
    filter(mapName => isPresent(node[mapName])).
    forEach(mapName => {
      nodeClone[mapName] = {};
      for (let prop in node[mapName]) {
        if (StringMapWrapper.contains(node[mapName], prop)) {
          nodeClone[mapName][prop] = node[mapName][prop];
        }
      }
    });

  // node.childern
  let cNodes = node.children;
  if (isPresent(cNodes)) {
    let cNodesClone = ListWrapper.createFixedSize(cNodes.length);
    for (let i = 0; i < cNodes.length; i++) {
      let childNode = cNodes[i];
      let childNodeClone = _recursive(childNode);
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

    return this._createView(hostProtoView, this.__clone(element));
  }

  createView(protoViewRef: RenderProtoViewRef, fragmentCount: number): RenderViewWithFragments {
    var protoView = resolveInternalDomProtoView(protoViewRef);
    return this._createView(protoView, null);
  }

  destroyView(viewRef: RenderViewRef) {
    // noop for now
  }

  getNativeElementSync(location: RenderElementRef): any {
    if (isBlank(location.renderBoundElementIndex)) { return null; }

    return resolveInternalJsonView(location.renderView).
      boundElements[location.renderBoundElementIndex];
  }
                                                /* Node */
  getRootNodes(fragment: RenderFragmentRef): List<any> {
    return resolveInternalJsonFragment(fragment);
  }

  attachFragmentAfterFragment(previousFragmentRef: RenderFragmentRef,
                              fragmentRef: RenderFragmentRef) {
    let previousFragmentNodes = resolveInternalJsonFragment(previousFragmentRef);
    if (previousFragmentNodes.length > 0) {
      let sibling = previousFragmentNodes[previousFragmentNodes.length - 1];
      moveNodesAfterSibling(sibling, resolveInternalJsonFragment(fragmentRef));
    }
  }

  attachFragmentAfterElement(elementRef: RenderElementRef, fragmentRef: RenderFragmentRef) {
    if (isBlank(elementRef.renderBoundElementIndex)) {
      return;
    }
    let parentView = resolveInternalJsonView(elementRef.renderView);
    let element = parentView.boundElements[elementRef.renderBoundElementIndex];
    moveNodesAfterSibling(element, resolveInternalJsonFragment(fragmentRef));
  }

  detachFragment(fragmentRef: RenderFragmentRef) {
    let fragmentNodes = resolveInternalJsonFragment(fragmentRef);
    for (let i = 0; i < fragmentNodes.length; i++) {
      DOM.remove(fragmentNodes[i]);
      // fragmentNodes[i].remove();
    }
  }

  hydrateView(viewRef: RenderViewRef) {
    let view = resolveInternalJsonView(viewRef);
    if (view.hydrated) { throw new BaseException('The view is already hydrated.'); }
    view.hydrated = true;

    // add global events
    view.eventHandlerRemovers = [];
    let binders = view.proto.elementBinders;
    for (let binderIdx = 0; binderIdx < binders.length; binderIdx++) {
      let binder = binders[binderIdx];
      if (isPresent(binder.globalEvents)) {
        for (let i = 0; i < binder.globalEvents.length; i++) {
          let globalEvent = binder.globalEvents[i];
          let remover = this._createGlobalEventListener(view, binderIdx, globalEvent.name,
                                                        globalEvent.target, globalEvent.fullName);
          view.eventHandlerRemovers.push(remover);
        }
      }
    }
  }

  dehydrateView(viewRef: RenderViewRef) {
    let view = resolveInternalJsonView(viewRef);

    // remove global events
    for (let i = 0; i < view.eventHandlerRemovers.length; i++) {
      view.eventHandlerRemovers[i]();
    }

    view.eventHandlerRemovers = null;
    view.hydrated = false;
  }

  setElementProperty(location: RenderElementRef, propertyName: string, propertyValue: any): void {
    if (isBlank(location.renderBoundElementIndex)) { return; }

    let view = resolveInternalJsonView(location.renderView);
    view.setElementProperty(location.renderBoundElementIndex, propertyName, propertyValue);
    // Reflect the property value as an attribute value with ng-reflect- prefix.
    if (this._reflectPropertiesAsAttributes) {
      this.setElementAttribute(location, `${REFLECT_PREFIX}${camelCaseToDashCase(propertyName)}`,
                               propertyValue);
    }
  }

  setElementAttribute(location: RenderElementRef, attributeName: string, attributeValue: string):
      void {
    if (isBlank(location.renderBoundElementIndex)) { return; }

    let view = resolveInternalJsonView(location.renderView);
    view.setElementAttribute(location.renderBoundElementIndex, attributeName, attributeValue);
  }

  setElementClass(location: RenderElementRef, className: string, isAdd: boolean): void {
    if (isBlank(location.renderBoundElementIndex)) { return; }

    let view = resolveInternalJsonView(location.renderView);
    view.setElementClass(location.renderBoundElementIndex, className, isAdd);
  }

  setElementStyle(location: RenderElementRef, styleName: string, styleValue: string): void {
    if (isBlank(location.renderBoundElementIndex)) { return; }

    let view = resolveInternalJsonView(location.renderView);
    view.setElementStyle(location.renderBoundElementIndex, styleName, styleValue);
  }

  invokeElementMethod(location: RenderElementRef, methodName: string, args: List<any>): void {
    if (isBlank(location.renderBoundElementIndex)) { return; }

    let view = resolveInternalJsonView(location.renderView);
    view.invokeElementMethod(location.renderBoundElementIndex, methodName, args);
  }

  setText(viewRef: RenderViewRef, textNodeIndex: number, text: string): void {
    if (isBlank(textNodeIndex)) { return; }

    let view = resolveInternalJsonView(viewRef);
    let element = view.boundTextNodes[textNodeIndex];
    // element.setText(text);
    DOM.setText(element, text);
  }

  setEventDispatcher(viewRef: RenderViewRef, dispatcher: any /*api.EventDispatcher*/): void {
    let view = resolveInternalJsonView(viewRef);
    view.eventDispatcher = dispatcher;
  }

                                                  /*HTMLElement*/
  _createView(protoView: DomProtoView, inplaceElement: any): RenderViewWithFragments {
    let clonedProtoView = this.__cloneAndQueryProtoView(protoView);

    let boundElements = clonedProtoView.boundElements;

    // adopt inplaceElement
    if (isPresent(inplaceElement)) {
      if (protoView.fragmentsRootNodeCount[0] !== 1) {
        let error = new BaseException('Root proto views can only contain one element!');
        throw error;
      }

      // remove children from hostElement
      // inplaceElement.clearNodes();
      DOM.clearNodes(inplaceElement);

      let tempRoot = clonedProtoView.fragments[0][0];
      // console.log('fragments', clonedProtoView.fragments)
      moveChildNodes(tempRoot, inplaceElement);

      if (boundElements.length > 0 && boundElements[0] === tempRoot) {
        boundElements[0] = inplaceElement;
      }
      clonedProtoView.fragments[0][0] = inplaceElement;
    }

    let view = new JsonView(protoView, clonedProtoView.boundTextNodes, boundElements);

    var binders = protoView.elementBinders;
    for (var binderIdx = 0; binderIdx < binders.length; binderIdx++) {
      var binder = binders[binderIdx];
      var element = boundElements[binderIdx];

      // native shadow DOM
      if (binder.hasNativeShadowRoot) {
        var shadowRootWrapper = element.firstChild;
        moveChildNodes(shadowRootWrapper, element.createShadowRoot());
        // moveChildNodes(shadowRootWrapper, DOM.createShadowRoot(element));
        // shadowRootWrapper.remove();
        DOM.remove(shadowRootWrapper);
      }

      // events
      if (isPresent(binder.eventLocals) && isPresent(binder.localEvents)) {
        for (let i = 0; i < binder.localEvents.length; i++) {
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
    if (Array.isArray(node)) {
      return node.map(_recursive);
    } else {
      return _recursive(node);
    }
  }

  __cloneAndQueryProtoView(pv: DomProtoView): ClonedProtoView {
    let templateContent = this.__clone(pv.rootElement.childNodes[0]);

    let boundElements = this.__queryBoundElements(templateContent, pv.isSingleElementFragment);
    let boundTextNodes = this.__queryBoundTextNodes(templateContent, pv.rootTextNodeIndices, boundElements,
                                             pv.elementBinders, pv.boundTextNodeCount);

    let fragments = this.__queryFragments(templateContent, pv.fragmentsRootNodeCount);
    return new ClonedProtoView(pv, fragments, boundElements, boundTextNodes);
  }

  __queryBoundElements(templateContent: JsonElement, isSingleElementChild: boolean): JsonElement[] {
    var result;
    var dynamicElementList;
    var elementIdx = 0;

    if (isSingleElementChild === true) {
      var rootElement = templateContent.firstChild;
      var rootHasBinding = DOM.hasClass(rootElement, NG_BINDING_CLASS);
      dynamicElementList = DOM.getElementsByClassName(rootElement, NG_BINDING_CLASS);
      // var rootHasBinding = rootElement.hasClass(NG_BINDING_CLASS);
      // dynamicElementList = rootElement.getElementsByClassName(NG_BINDING_CLASS);
      result = ListWrapper.createFixedSize(dynamicElementList.length + (rootHasBinding ? 1 : 0));

      if (rootHasBinding === true) {
        result[elementIdx++] = rootElement;
      }

    } else {
      dynamicElementList = DOM.querySelectorAll(templateContent, NG_BINDING_CLASS_SELECTOR);
      // dynamicElementList = templateContent.querySelectorAll(NG_BINDING_CLASS_SELECTOR);
      result = ListWrapper.createFixedSize(dynamicElementList.length);
    }

    for (let i = 0; i < dynamicElementList.length; i++) {
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
        var rootChildNodes = templateContent.children;
        for (let i = 0; i < rootTextNodeIndices.length; i++) {
          boundTextNodes[textNodeIndex++] = rootChildNodes[rootTextNodeIndices[i]];
        }
      }
      for (let i = 0; i < elementBinders.length; i++) {
        let binder = elementBinders[i];
        let element: JsonElement = boundElements[i];
        if (binder.textNodeIndices.length > 0) {
          let childNodes = element.children;
          for (let j = 0; j < binder.textNodeIndices.length; j++) {
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
      for (let i = 0; i < fragment.length; i++) {
        fragment[i] = childNode;
        childNode = childNode.next;
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
  if (nodes.length > 0 && isPresent(sibling.parent)) {
    for (let i = 0; i < nodes.length; i++) {
      // DOM.remove(nodes[i]);
      nodes[i].remove();

      treeAdapter.insertBefore(sibling.parent, nodes[i], sibling);
      // DOM.insertBefore(sibling, nodes[i]);
    }

    // DOM.insertBefore(nodes[nodes.length - 1], sibling);
    // DOM.remove(sibling);

    let node = nodes[nodes.length - 1];
    sibling.remove();
    treeAdapter.insertBefore(node.parent, sibling, node);
  }
}
                             /* Node         Node */
function moveChildNodes(source: any, target: any) {
  var currChild = source.firstChild;
  while (isPresent(currChild)) {
    let nextChild = currChild.next;
    // DOM.appendChild(target, currChild);

    currChild.remove();
    treeAdapter.appendChild(target.templateAwareRoot(), currChild);

    // DOM.remove(currChild);
    // treeAdapter.appendChild(DOM.templateAwareRoot(target), currChild);

    currChild = nextChild;
  }
}


export var jsonRendererInjectables: Array<any> = [
  // bind(JsonRenderer).toClass(DomRenderer),
  bind(JsonRenderer).toClass(JsonRenderer),
  bind(Renderer).toAlias(JsonRenderer)
];


