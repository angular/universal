/**
 * This is a wrapper for the DOM that is used by preboot. We do this
 * for a few reasons. It makes the other preboot code more simple,
 * makes things easier to test (i.e. just mock out the DOM) and it
 * centralizes our DOM related interactions so we can more easily
 * add fixes for different browser quirks
 */
import { Element } from '../interfaces/element';
import { CursorSelection } from '../interfaces/preboot_ref';
import { AppState } from '../interfaces/preboot_ref';

export let nodeCache = {};


/**
 * Get a node in the document
 */
export function getDocumentNode(app:AppState): Element {
  return app.document.querySelector(app.appRootName);
}

/**
 * Get one app node
 */
export function getAppNode(app:AppState, selector: string): Element {
  return app.appRoot.querySelector(selector);
}

/**
 * Get all app nodes for a given selector
 */
export function getAllAppNodes(app:AppState, selector: string): Element[] {
  return app.appRoot.querySelectorAll(selector);
}

/**
 * Get all nodes under the client root
 */
export function getClientNodes(app:AppState, selector: string): Element[] {
  return app.clientRoot.querySelectorAll(selector);
}


/**
 * Dispatch an event on the document
 */
export function dispatchGlobalEvent(app:AppState, eventName: string) {
  app.document.dispatchEvent(new app.window.Event(eventName));
}

/**
 * Dispatch an event on a specific node
 */
export function dispatchNodeEvent(app:AppState, node: Element, eventName: string) {
  node.dispatchEvent(new app.window.Event(eventName));
}

/**
 * Check to see if the app contains a particular node
 */
export function appContains(app:AppState, node: Element) {
  return app.appRoot.contains(node);
}

/**
 * Create a new element
 */
export function addNodeToBody(app:AppState, type: string, className: string, styles: Object): Element {
  let elem = app.document.createElement(type);
  elem.className = className;

  if (styles) {
    for (var key in styles) {
      if (styles.hasOwnProperty(key)) {
        elem.style[key] = styles[key];
      }
    }
  }

  return app.body.appendChild(elem);
}

/**
 * Remove a node since we are done with it
 */
export function removeNode(node: Element) {
  if (!node) { return; }

  node.remove ?
    node.remove() :
    node.style.display = 'none';
}

/**
 * Get the caret position within a given node. Some hackery in
 * here to make sure this works in all browsers
 */
export function getSelection(node: Element): CursorSelection {
  let selection = {
    start: 0,
    end: 0,
    direction: 'forward'
  };

  // if browser support selectionStart on node (Chrome, FireFox, IE9+)
  if (node  && (node.selectionStart || node.selectionStart === 0)) {
    selection.start = node.selectionStart;
    selection.end = node.selectionEnd;
    selection.direction = node.selectionDirection;

  // else if nothing else for older unsupported browsers, just put caret at the end of the text
  } else if (node && node.value) {
    selection.start = selection.end = node.value.length;
  }

  return selection;
}

/**
 * Set caret position in a given node
 */
export function setSelection(node: Element, selection: CursorSelection) {

  // as long as node exists, set focus
  if (node) {
    node.focus();
  }

  // set selection if a modern browser (i.e. IE9+, etc.)
  if (node && node.setSelectionRange && selection) {
    node.setSelectionRange(selection.start, selection.end, selection.direction);
  }
}

/**
 * Get a unique key for a node in the DOM
 */
export function getNodeKey(node: Element, rootNode: Element): string {
  let ancestors = [];
  let temp = node;
  while (temp && temp !== rootNode) {
    ancestors.push(temp);
    temp = temp.parentNode;
  }

  // push the rootNode on the ancestors
  if (temp) {
    ancestors.push(temp);
  }

  // now go backwards starting from the root
  let key = node.nodeName;
  let len = ancestors.length;

  for (let i = (len - 1); i >= 0; i--) {
    temp = ancestors[i];

    if (temp.childNodes && i > 0) {
      for (let j = 0; j < temp.childNodes.length; j++) {
        if (temp.childNodes[j] === ancestors[i - 1]) {
          key += '_s' + (j + 1);
          break;
        }
      }
    }
  }

  return key;
}

/**
 * Given a node from the server rendered view, find the equivalent
 * node in the client rendered view.
 */
export function findClientNode(app:AppState, serverNode: Element, nodeKey?: any): Element {

  // if nothing passed in, then no client node
  if (!serverNode) { return null; }

  // we use the string of the node to compare to the client node & as key in cache
  let serverNodeKey = nodeKey || getNodeKey(serverNode, app.serverRoot);

  // first check to see if we already mapped this node
  let nodes = nodeCache[serverNodeKey] || [];

  for (let nodeMap of nodes) {
    if (nodeMap.serverNode === serverNode) {
      return nodeMap.clientNode;
    }
  }

  // todo: improve this algorithm in the future so uses fuzzy logic (i.e. not necessarily perfect match)
  let selector = serverNode.tagName;
  let className = (serverNode.className || '').replace('ng-binding', '').trim();

  if (serverNode.id) {
    selector += '#' + serverNode.id;
  } else if (className) {
    selector += '.' + className.replace(/ /g, '.');
  }

  let clientNodes = getClientNodes(app, selector);
  for (let clientNode of clientNodes) {

    // todo: this assumes a perfect match which isn't necessarily true
    if (getNodeKey(clientNode, app.clientRoot) === serverNodeKey) {

      // add the client/server node pair to the cache
      nodeCache[serverNodeKey] = nodeCache[serverNodeKey] || [];
      nodeCache[serverNodeKey].push({
        clientNode: clientNode,
        serverNode: serverNode
      });

      return clientNode;
    }
  }

  // if we get here it means we couldn't find the client node
  return null;
}
