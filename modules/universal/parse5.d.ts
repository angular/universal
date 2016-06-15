// Temporary typings as DefinitelyTyped does not have typings
// for parse5@1.x.
// declare module 'parse5' {
//   export var Parser;
//   export var Serializer;
//   export var TreeAdapters;
// }

declare module 'parse5' {
  export var parse : Function;
  export var parseFragment : Function;
  export var serialize : Function;
  export var treeAdapters;
  
  export var ParserStream;
  export var SerializerStream;
  export var SAXParser;
}