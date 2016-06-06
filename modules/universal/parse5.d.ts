// Temporary typings as DefinitelyTyped does not have typings
// for parse5@1.x.
// declare module 'parse5' {
//   export var Parser;
//   export var Serializer;
//   export var TreeAdapters;
// }

// parse5 2.x typings
declare module 'parse5' {
  export var parse : Function;
  export var parseFragment : Function;
  export var serialize : Function;
  export var treeAdapters;
  
  export var ParserStream;
  export var SerializerStream;
  export var SAXParser;
}
