import {state, prep, cleanup} from '../../../src/browser/freeze/freeze_with_spinner';
import { AppState } from '../../../src/interfaces/preboot_ref'

describe('freeze_with_spinner', function () {
  describe('cleanup()', function () {
    it('should call removeNode and null out overlay and spinner', function () {
      let app =  { removeNode: null };
      
      let appstate:AppState =  { 
           freeze:null,
           appRootName:null, 
           opts:null, 
           canComplete:false, 
           completeCalled:false, 
           started:false
         };
         
      state.overlay = 'boo';
      state.spinner = 'food';
      spyOn(app, 'removeNode');
      
      cleanup(app, appstate);
      
      expect(app.removeNode).toHaveBeenCalledWith('boo');
      expect(app.removeNode).toHaveBeenCalledWith('food');
      expect(state.overlay).toBeNull();
      expect(state.spinner).toBeNull();
    });  
  });
  
  describe('prep()', function () {
    it('should call preboot fns trying to freeze UI', function () {
      let app = {
          addNodeToBody: function () { return { style: {} }; },
          on: function () {},
          removeNode: function () {}
      };
      
      
      let appstate:AppState =  { 
           freeze:null,
           appRootName:null, 
           opts:{}, 
           canComplete:false, 
           completeCalled:false, 
           started:false
         };
         
   
      
      spyOn(app, 'addNodeToBody');
      spyOn(app, 'on');
      spyOn(app, 'removeNode');
      
      prep(app, appstate);
      
      expect(app.addNodeToBody).toHaveBeenCalled();
      expect(app.on).toHaveBeenCalled();
    });
  });
});
