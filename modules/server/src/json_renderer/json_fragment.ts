import {RenderFragmentRef} from 'angular2/src/render/api';


export function resolveInternalJsonFragment(fragmentRef: RenderFragmentRef): any[] {
  return (<any>fragmentRef)._nodes;
}

export class JsonFragmentRef extends RenderFragmentRef {
  constructor(public _nodes: any[]) { super(); }
}
