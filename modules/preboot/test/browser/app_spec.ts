import * as app from '../../src/browser/app';
import { AppState } from '../../src/interfaces/preboot_ref'

describe('app', function () {
  describe('initAppRoot()', function () {
    it('set values based on input', function () {
      let opts = { window: { document: { body: {}}}};
      let appstate:AppState =  { 
       freeze:null,
       appRootName:null, 
       opts:null, 
       canComplete:false, 
       completeCalled:false, 
       started:false, 
       window:null, 
       document:null, 
       body:null, 
       appRoot:null, 
       clientRoot:null, 
       serverRoot:null};
       
      app.initAppRoot(appstate, opts);
      
      expect(appstate.window).toEqual(opts.window);
      expect(appstate.document).toEqual(opts.window.document);
      expect(appstate.body).toEqual(opts.window.document.body);
      expect(appstate.appRoot).toEqual(opts.window.document.body);
      expect(appstate.clientRoot).toEqual(opts.window.document.body);
    });  
  });
  
  describe('updateRoots()', function () {
    it('should set the roots in the state', function () {
      let appRoot = {};
      let serverRoot = {};
      let clientRoot = {};
      
      let appstate:AppState =  { 
       freeze:null,
       appRootName:null, 
       opts:null, 
       canComplete:false, 
       completeCalled:false, 
       started:false, 
       window:null, 
       document:null, 
       body:null, 
       appRoot:null, 
       clientRoot:null, 
       serverRoot:null};
       
      app.updateAppRoots(appstate, appRoot, serverRoot, clientRoot);
      
      expect(appstate.appRoot).toBe(appRoot);
      expect(appstate.serverRoot).toBe(serverRoot);
      expect(appstate.clientRoot).toBe(clientRoot);  
    });  
  });
  
  describe('getAppNode()', function () {
    it('should call appRoot querySelector', function () {
      let selector = 'foo > man > choo';
      let appRoot = { querySelector: function () {} };
      spyOn(appRoot, 'querySelector');
      
      let appstate:AppState =  { 
       freeze:null,
       appRootName:null, 
       opts:null, 
       canComplete:false, 
       completeCalled:false, 
       started:false, 
       appRoot:appRoot
      };
      app.getAppNode(appstate, selector);
      
      expect(appRoot.querySelector).toHaveBeenCalledWith(selector);
    });  
  });
  
  describe('getAllAppNodes()', function () {
    it('should call appRoot querySelectorAll', function () {
      let selector = 'foo > man > choo';
      let appRoot = { querySelectorAll: function () {} };
      spyOn(appRoot, 'querySelectorAll');
      
         let appstate:AppState =  { 
       freeze:null,
       appRootName:null, 
       opts:null, 
       canComplete:false, 
       completeCalled:false, 
       started:false, 
       appRoot:appRoot
      };
            
      app.getAllAppNodes(appstate, selector);
      expect(appRoot.querySelectorAll).toHaveBeenCalledWith(selector);
    });  
  });
  
  describe('getClientNodes()', function () {
    it('should call clientRoot querySelectorAll', function () {
      let selector = 'foo > man > choo';
      let clientRoot = { querySelectorAll: function () {} };
      spyOn(clientRoot, 'querySelectorAll');
      
      let appstate:AppState =  { 
        freeze:null,
        appRootName:null, 
        opts:null, 
        canComplete:false, 
        completeCalled:false, 
        started:false, 
        clientRoot:clientRoot
      };
      
      app.getClientNodes(appstate, selector);
      expect(clientRoot.querySelectorAll).toHaveBeenCalledWith(selector);
    });  
  });
  
  describe('onLoad()', function () {
    it('should call window addEventListener for load event', function () {
      let handler = function () {};
      let window = { addEventListener: function () {} };
      let document = { addEventListener: function () {} };
      spyOn(document, 'addEventListener');
      
      let appstate:AppState =  { 
       freeze:null,
       appRootName:null, 
       opts:null, 
       canComplete:false, 
       completeCalled:false, 
       started:false, 
       window:window, 
       document:document
      };
      app.onLoad(appstate, handler);
      expect(document.addEventListener).toHaveBeenCalledWith('DOMContentLoaded', jasmine.any(Function));
    });  
  });
  
  describe('on()', function () {
    it('should call document addEventListener', function () {
      let eventName = 'boo';
      let handler = function () {};
      let document = { addEventListener: function () {} };
      spyOn(document, 'addEventListener');
     
      let appstate:AppState =  { 
       freeze:null,
       appRootName:null, 
       opts:null, 
       canComplete:false, 
       completeCalled:false, 
       started:false, 
       document:document
      };
      
      app.on(appstate, eventName, handler);
      expect(document.addEventListener).toHaveBeenCalledWith(eventName, jasmine.any(Function));
    });  
  });
  
  describe('dispatchGlobalEvent()', function () {
    it('should call document dispatchEvent', function () {
      let eventName = 'boo';
      let window = { Event: function () {} };
      let document = { dispatchEvent: function () {} };
      spyOn(document, 'dispatchEvent');
      
      let appstate:AppState =  { 
       freeze:null,
       appRootName:null, 
       opts:null, 
       canComplete:false, 
       completeCalled:false, 
       started:false, 
       window:window,
       document:document
      };
      
      app.dispatchGlobalEvent(appstate, eventName);
      expect(document.dispatchEvent).toHaveBeenCalled();
    });  
  });
  
  describe('dispatchNodeEvent()', function () {
    it('should call node dispatchEvent', function () {
      let node = { dispatchEvent: function () {} };
      let eventName = 'boo';
      let window = { Event: function () {} };
      spyOn(node, 'dispatchEvent');
      
      let appstate:AppState =  { 
       freeze:null,
       appRootName:null, 
       opts:null, 
       canComplete:false, 
       completeCalled:false, 
       started:false, 
       window:window
      };
      
      app.dispatchNodeEvent(appstate, node, eventName);
      expect(node.dispatchEvent).toHaveBeenCalled();
    });  
  });
  
  describe('addNodeToBody()', function () {
    it('should create node, add styles and append to body', function () {
      let type = 'div';
      let className = 'foo';
      let styles = { display: 'none', width: '300px' };
      
      let newElem = { className: '', style: { display: 'block', height: '200px' } };
      let document = {
        createElement: function () {
          return newElem;
        }
      };
      let body = { appendChild: function () {} };
      
      spyOn(body, 'appendChild');
      spyOn(document, 'createElement').and.callThrough();
      
     let appstate:AppState =  { 
       freeze:null,
       appRootName:null, 
       opts:null, 
       canComplete:false, 
       completeCalled:false, 
       started:false, 
       document:document, 
       body:body
      };
     
      
      app.addNodeToBody(appstate, type, className, styles);
      
      expect(document.createElement).toHaveBeenCalledWith(type);
      expect(newElem.className).toEqual(className);
      expect(newElem.style).toEqual({ display: 'none', width: '300px', height: '200px' });
      expect(body.appendChild).toHaveBeenCalledWith(newElem);
    });  
  });
  
  describe('removeNode()', function () {
    it('should not do anything if nothing passed in', function () {
      app.removeNode(null);  
    });
    
    it('should call remove on node if it exists', function () {
      let node = { remove: function () {} };
      spyOn(node, 'remove');
      app.removeNode(node);
      expect(node.remove).toHaveBeenCalled();  
    });
    
    it('should set display none when remove not there', function () {
      let node = { style: { display: '' }};
      app.removeNode(node);
      expect(node.style.display).toEqual('none');
    });
  });
  
  describe('getSelection', function() {
    it('should return zero if nothing passed in', function() {
      expect(app.getSelection(null)).toEqual({
        start: 0,
        end: 0,
        direction: 'forward'
      });
    });
    
    it('should return the length of the node text if nothing else', function() {
      let node = { focus: function() { }, value: 'booyeah' };
      let expected = { start: 7, end: 7, direction: 'forward' };
      let actual = app.getSelection(node);
      expect(actual).toEqual(expected);
    });
    
    it('should return if node.selectionStart exists', function() {
      let node = { 
        value: 'boo', 
        selectionStart: 1,
        selectionEnd: 3,
        selectionDirection: 'backward'
      };
      
      let expected = { start: 1, end: 3, direction: 'backward' };
      let actual = app.getSelection(node);
      expect(actual).toEqual(expected);
    });
  });
  
  describe('setSelection()', function() {
    it('should do nothing if no node passed in', function() {
      app.setSelection(null, null);
    });
    
    it('should use setSelectionRange on node if available', function() {
      let node = { 
        focus: function() { }, 
        setSelectionRange: function() {}
      };
      let selection = {
        start: 4,
        end: 7,
        direction: 'forward'
      };
      
      spyOn(node, 'focus');
      spyOn(node, 'setSelectionRange');
      
      app.setSelection(node, selection);
      expect(node.focus).toHaveBeenCalled();
      expect(node.setSelectionRange).toHaveBeenCalledWith(selection.start, selection.end, selection.direction);
    });
  });
  
  describe('node tree fns', function () {
    
    // this is used to help with the testing of this function
    // create tree like structure
    function addParent(anode) {
      if (anode && anode.childNodes) {
        for (let childNode of anode.childNodes) {
          childNode.parentNode = anode;
          addParent(childNode);  
        }
      }
    }
   
    let node = { nodeName: 'DIV' };
    let document = {
      childNodes: [{}, {}, {
        childNodes: [{}, {
          childNodes: [{}, {}, {}, node]
        }]
      }]
    };
    let rootNode = document.childNodes[2];
    let expectedNodeKey = 'DIV_app_s2_s4';
      let appstate = {
          appRoot: null,
          opts:{},
          freeze:null,
          appRootName:"app",
          canComplete: false,      
          completeCalled: false,   
          started:false, 
      }
    
    addParent(document);
    
    describe('getNodeKey()', function () {
      it('should generate a key based of the node structure', function () {
        let actual = app.getNodeKey(appstate, node, rootNode);
        expect(actual).toEqual(expectedNodeKey);
      });
    });
    
    describe('findClientNode()', function () {
      it('should return null if no serverNode passed in', function () {
        expect(app.findClientNode(null, null)).toBeNull();
      });
      
      it('should get a node from cache', function () {
        let clientNode = { name: 'zoo' };
        app.nodeCache[expectedNodeKey] = [{
          serverNode: node,
          clientNode: clientNode
        }];
         let appstate:AppState =  { 
           freeze:null,
           appRootName:"app", 
           opts:null, 
           canComplete:false, 
           completeCalled:false, 
           started:false,
           serverRoot:rootNode
         };
   
        let actual = app.findClientNode(appstate, node);
        expect(actual).toBe(clientNode);
      });
      
      // todo: other test cases for when not using cache
    });
  });
});
