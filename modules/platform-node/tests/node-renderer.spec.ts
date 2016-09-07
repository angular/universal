import '../../../helpers/polyfills.test';
import {
  SharedStylesHost,
  NodeSharedStylesHost
} from '../node-shared-styles-host';
import { getDOM } from '../get-dom';

describe('Platform-Node Node-Shared-Styles-Host', ()=> {
  describe('SharedStylesHost', () => {
    let instance: SharedStylesHost;

    beforeEach(() => {
      instance = new SharedStylesHost();
    });

    afterEach(() => {
      instance = null;
    });

    it('should add styles', () => {
      instance.addStyles(['color: red', 'font-size: 5px']);
      expect(instance.getAllStyles().length).toBe(2);
    });

    it('should add styles and ignore duplicates', () => {
      instance.addStyles(['color: red', 'font-size: 5px']);
      instance.addStyles(['color: red', 'font-size: 5px']);
      expect(instance.getAllStyles().length).toBe(2);
    });
  });
  describe('NodeSharedStylesHost', () => {
    let instance: NodeSharedStylesHost;
    const node: HTMLElement = getDOM().createElement('html');

    beforeEach(() => {
      instance = new NodeSharedStylesHost();
    });

    afterEach(() => {
      instance = null;
    });

    it('should add and remove a host node', () => {
      instance.addHost(node);
      expect(instance._hostNodes.size).toBe(1);
      instance.removeHost(node);
      expect(instance._hostNodes.size).toBe(0);
    });

    it('should add styles to host node', () => {
      instance.addHost(node);
      instance.addStyles(['color: red', 'font-size: 5px']);
      expect(node.children.length).toBe(2);
      instance.addStyles(['color: blue', 'font-size: 5px']);
      expect(node.children.length).toBe(3);
    });
  });
});
