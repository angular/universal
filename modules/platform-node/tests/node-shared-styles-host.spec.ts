import '../../../helpers/polyfills.test';
import {
  ATTRIBUTES,
  IGNORE_ATTRIBUTES,
  COMPONENT_VARIABLE,
  HOST_ATTR,
  CONTENT_ATTR
} from '../node-renderer'

describe('Platform-Node Node-Renderer', ()=> {
  describe('CONSTS', () => {
    it('should equal spec', () => {
      expect(ATTRIBUTES).toEqual({
        textarea: [
          'autocapitalize',
          'autocomplete',
          'autofocus',
          'cols',
          'disabled',
          'form',
          'maxlength',
          'minlength',
          'name',
          'placeholder',
          'readonly',
          'required',
          'rows',
          'selectionDirection',
          'selectionEnd',
          'selectionStart',
          'spellcheck',
          'wrap'
        ],
        script: [
          'async',
          'integrity',
          'src',
          'type',
          'text',
          'defer',
          'crossorigin'
        ],
        button: [
          'autofocus',
          'autocomplete',
          'disabled',
          'form',
          'formaction',
          'formenctype',
          'formmethod',
          'formnovalidate',
          'formtarget',
          'name',
          'type',
          'value'
        ],
        fieldset: [
          'disabled',
          'form',
          'name'
        ],
        a: [
          'download',
          'href',
          'hreflang',
          'ping',
          'referrerpolicy',
          'rel',
          'target',
          'type'
        ],
        img: [
          'alt',
          'crossorigin',
          'height',
          'ismap',
          'longdesc',
          'referrerpolicy',
          'sizesHTML5',
          'src',
          'srcsetHTML5',
          'width',
          'usemap'
        ],
        input: [
          'id',

          'type',
          'accept',
          'mozactionhint',
          'autocapitalize',
          'autocomplete',
          'autocorrect',
          'autofocus',
          'autosave',
          'checked',
          'disabled',
          'form',
          'formaction',
          'formenctype',
          'formmethod',
          'formnovalidate',
          'formtarget',
          'height',
          'incremental',
          'inputmode',
          'list',
          'max',
          'maxlength',
          'min',
          'minlength',
          'multiple',
          'name',
          'pattern',
          'placeholder',
          'readonly',
          'required',
          'results',
          'selectionDirection',
          'size',
          'spellcheck',
          'src',
          'step',
          'tabindex',
          'value',
          'width',
          'x-moz-errormessage'
        ],
        output: [
          'for',
          'form',
          'name'
        ],
        progress: [
          'max',
          'value'
        ],
        label: [
          'accesskey',
          'for',
          'form'
        ],
        option: [
          'disabled',
          'label',
          'selected',
          'value'
        ],
        select: [
          'autofocus',
          'disabled',
          'multiple',
          'form',
          'multiple',
          'name',
          'required',
          'size'
        ],
        optgroup: [
          'disabled',
          'label'
        ],
        form: [
          'accept-charset',
          'action',
          'autocapitalize',
          'autocomplete',
          'enctype',
          'method',
          'name',
          'novalidate',
          'target'
        ]
      });
    });
    it('should equal spec', () => {
      expect(IGNORE_ATTRIBUTES).toEqual({
        'innerHTML': true,
        'hidden': true
      });
    });
    it('should equal spec', () => {
      expect(COMPONENT_VARIABLE).toBe('%COMP%');
    });
    it('should equal spec', () => {
      expect(HOST_ATTR).toBe(`_nghost-${COMPONENT_VARIABLE}`);
    });
    it('should equal spec', () => {
      expect(CONTENT_ATTR).toBe(`_ngcontent-${COMPONENT_VARIABLE}`);
    });
  });
});
