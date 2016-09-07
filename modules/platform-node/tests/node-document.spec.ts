import '../../../helpers/polyfills.test';
import {
  isTag,
  parseFragment,
  parseDocument,
  serializeDocument
} from '../node-document';
import { Parse5DomAdapter } from '../parse5-adapter';

describe('Platform-Node Node-Document', ()=> {
  Parse5DomAdapter.makeCurrent();

  describe('isTag', () => {
    it('should return if node is a Tag', () => {
      expect(isTag('body', { type: 'tag', name: 'body' })).toBe(true);
    });
  });
  describe('parseFragment', () => {
    it('should return if node is a Tag', () => {
      let node = parseFragment('<div id="test"><p class="container"></p><p></p></div>');
      expect(node.children.length).toBe(1);
      expect(node.children[0].children.length).toBe(2);
      expect(node.children[0].attribs.id).toBe('test');
      expect(node.children[0].children[0].attribs.class).toBe('container');
    });
  });
  describe('parseDocument', () => {
    it('should trow errors when param is undefined or not a string', () => {
      expect(function () {
        parseDocument(undefined);
      }).toThrow(new Error('parseDocument requires a document string'));
      expect(function () {
        parseDocument(null);
      }).toThrow(new Error('parseDocument needs to be a string to be parsed correctly'));
    });
    it('should return html document if empty string as input', () => {
      let doc = parseDocument('');
      expect(doc.head.name).toBe('head');
      expect(doc.body.name).toBe('body');
      expect(doc.head.children[0].name).toBe('title');
    });
    it('should parse html document', () => {
      let doc = parseDocument(`<html><head><title>TestDoc</title></head><body><div id="app"><div class="container"></div></div></body></html>`);
      expect(doc.children.length).toBe(1);
      expect(doc.head.name).toBe('head');
      expect(doc.body.name).toBe('body');
      expect(doc.body.children[0].attribs.id).toBe('app');
      expect(doc.body.children[0].children[0].attribs.class).toBe('container');
    });
  });
  describe('serializeDocument', () => {
    it('should render document to string', () => {
      let doc = parseDocument(`<html><head><title>TestDoc</title></head><body></body></html>`);
      expect(serializeDocument(doc)).toBe('<html><head><title>TestDoc</title></head><body></body></html>');
    });
    it('should render document to pretty string', () => {
      let doc = parseDocument(`<html><head><title>TestDoc</title></head><body></body></html>`),
        expected = `<html>

<head>
  <title>TestDoc</title>
</head>

<body></body>

</html>`;
      expect(serializeDocument(doc, true)).toBe(expected);
    });
  });
});
