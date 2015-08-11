import {DomEvent} from './event';

export interface Style {
  display: string;
}

export interface Element {
  id?: string;
  value?: string;
  tagName?: string;
  nodeName?: string;
  className?: string;
  selectionStart?: number;
  selection?: any;
  createTextRange?(): any;
  setSelectionRange?(fromPos: number, toPos: number);
  style?: Style;
  parentNode?: Element;
  childNodes?: Element[];
  attributes?: string[];
  remove?();
  focus?();
  dispatchEvent?(event: DomEvent);
  getAttribute?(name: string): string;
  cloneNode?(deep: boolean): Element;
  insertBefore?(nodeToInsert: Element, beforeNode: Element);
}
