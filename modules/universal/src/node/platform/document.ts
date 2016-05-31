import {OpaqueToken} from '@angular/core';
// import {parse, serialize, treeAdapters} from 'parse5';
import * as parse5 from 'parse5';
// var parse5 = require('parse5');
import {Parse5DomAdapter} from '@angular/platform-server';
Parse5DomAdapter.makeCurrent(); // ensure Parse5DomAdapter is used
import {getDOM} from '@angular/platform-browser/src/dom/dom_adapter';
var DOM: any = getDOM();

// var document = parse5.parse('<div></div>', { treeAdapter: parse5.treeAdapters.default });

// parse5 2.0 : Remove (breaking): 
// ^ decodeHtmlEntities and encodeHtmlEntities options. (GH #75).

// TODO(gdi2290): fix encodeHtmlEntities: true
// const serializer = parse5.serialize(TreeAdapters.htmlparser2, { encodeHtmlEntities: false });

/*
const parser = parse5.parse;
const serializer = parse5.serialize;
*/

const treeAdapter = parse5.treeAdapters.htmlparser2;

export function isTag(tagName, node): boolean {
  return node.type === 'tag' && node.name === tagName;
}

export function parseFragment(el: string): Object {
  return parse5.parseFragment(el, { treeAdapter : parse5.treeAdapters.htmlparser2 });
}

export function parseDocument(documentHtml: string): Object {
  if (!documentHtml) {
    throw new Error('parseDocument requires a document string');
  }
  if (typeof documentHtml !== 'string') {
    throw new Error('parseDocument needs to be a string to be parsed correctly');
  }
  

  const doc = parse5.parse(documentHtml, { treeAdapter : parse5.treeAdapters.htmlparser2 });
  
  /*
  // Build entire doc <!doctype><html> etc
  if (documentHtml.indexOf('<html>') > -1 && documentHtml.indexOf('</html>') > -1) {
    const doc = parser.parse(documentHtml);
  }
  // ASP.NET case : parse only the fragment - don't build entire <html> doc
  const doc = parser.parseFragment(documentHtml);
  */
  
  let rootNode;
  let bodyNode;
  let headNode;
  let titleNode;

  for (let i = 0; i < doc.childNodes.length; ++i) {
    const child = doc.childNodes[i];

    if (isTag('html', child)) {
      rootNode = child;
      break;
    }
  }

  if (!rootNode) {
    rootNode = doc;
  }

  for (let i = 0; i < rootNode.childNodes.length; ++i) {
    const child = rootNode.childNodes[i];

    if (isTag('head', child)) {
      headNode = child;
    }

    if (isTag('body', child)) {
      bodyNode = child;
    }
  }

  if (!headNode) {
    headNode = treeAdapter.createElement('head', null, []);
    DOM.appendChild(doc, headNode);
  }

  if (!bodyNode) {
    bodyNode = treeAdapter.createElement('body', null, []);
    DOM.appendChild(doc, bodyNode);
  }

  for (let i = 0; i < headNode.childNodes.length; ++i) {
    if (isTag('title', headNode.childNodes[i])) {
      titleNode = headNode.childNodes[i];
      break;
    }
  }

  if (!titleNode) {
    titleNode = treeAdapter.createElement('title', null, []);
    DOM.appendChild(headNode, titleNode);
  }

  doc._window = {};
  doc.head = headNode;
  doc.body = bodyNode;

  const titleNodeText = titleNode.childNodes[0];

  Object.defineProperty(doc, 'title', {
    get: () => titleNodeText.data,
    set: (newTitle) => titleNodeText.data = newTitle
  });

  return doc;
}

export function serializeDocument(document: Object): string {
  return parse5.serialize(document, { treeAdapter : parse5.treeAdapters.htmlparser2 });
}
