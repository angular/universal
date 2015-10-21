/// <reference path="../../typings/tsd.d.ts" />
import '../server_patch';
import * as fs from 'fs';
import {selectorRegExpFactory, simpleTemplate} from '../helper';


import {
  renderToString,
  renderToStringWithPreboot,
  selectorResolver
} from '../render';

import {
  prebootScript,
  angularScript,
  bootstrapButton,
  bootstrapFunction,
  bootstrapApp,
  buildClientScripts
} from '../ng_scripts';


export interface engineOptions {
  App: Function;
  providers?: Array<any>;
  preboot?: Object;
  selector?: string;
  serializedCmp?: string;
  server?: boolean;
  client?: boolean;
}

// export function ng2engine(filePath: string, options: engineOptions, done: Function) {
//   // defaults
//   options = options || <engineOptions>{};
//   options.providers = options.providers || [];

//   // read file on disk
//   try {
//     fs.readFile(filePath, (err, content) => {

//       if (err) { return done(err); }

//       // convert to string
//       var clientHtml: string = content.toString();

//       // TODO: better build scripts abstraction
//       if (options.server === false && options.client === false) {
//         return done(null, clientHtml);
//       }
//       if (options.server === false && options.client !== false) {
//         return done(null, buildClientScripts(clientHtml, options));
//       }

//       // bootstrap and render component to string
//       renderToString(options.App, options.providers)
//         .then(serializedCmp => {

//           let selector: string = selectorResolver(options.App);

//           // selector replacer explained here
//           // https://gist.github.com/gdi2290/c74afd9898d2279fef9f
//           // replace our component with serialized version
//           let rendered: string = clientHtml.replace(
//             // <selector></selector>
//             selectorRegExpFactory(selector),
//             // <selector>{{ serializedCmp }}</selector>
//             serializedCmp
//             // TODO: serializedData
//           );

//           done(null, buildClientScripts(rendered, options));
//         })
//         .catch(e => {
//           console.log(e.stack);
//           // if server fail then return client html
//           done(null, buildClientScripts(clientHtml, options));
//         });
//     });
//   } catch (e) {
//     done(e);
//   }
// };

export function ng2engine(filePath: string, options: engineOptions, done: Function) {
  // defaults
  options = options || <engineOptions>{};
  options.providers = options.providers || [];

  // read file on disk
  try {
    fs.readFile(filePath, (err, content) => {

      if (err) { return done(err); }

      // convert to string
      var clientHtml: string = content.toString();

      // TODO: better build scripts abstraction
      if (options.server === false && options.client === false) {
        return done(null, clientHtml);
      }
      if (options.server === false && options.client !== false) {
        return done(null, buildClientScripts(clientHtml, options));
      }

      // bootstrap and render component to string
      renderToStringWithPreboot(options.App, options.providers, options.preboot)
        .then(serializedCmp => {

          let selector: string = selectorResolver(options.App);

          // selector replacer explained here
          // https://gist.github.com/gdi2290/c74afd9898d2279fef9f
          // replace our component with serialized version
          let rendered: string = clientHtml.replace(
            // <selector></selector>
            selectorRegExpFactory(selector),
            // <selector>{{ serializedCmp }}</selector>
            serializedCmp
            // TODO: serializedData
          );

          done(null, buildClientScripts(rendered, options));
        })
        .catch(e => {
          console.log(e.stack);
          // if server fail then return client html
          done(null, buildClientScripts(clientHtml, options));
        });
    });
  } catch (e) {
    done(e);
  }
};

export const ng2engineWithPreboot = ng2engine;

export function simpleReplace(filePath: string, options: engineOptions, done: Function) {
  // defaults
  options = options || <engineOptions>{};

  // read file on disk
  try {
    fs.readFile(filePath, (err, content) => {

      if (err) { return done(err); }

      // convert to string
      var clientHtml: string = content.toString();

      // TODO: better build scripts abstraction
      if (options.server === false && options.client === false) {
        return done(null, clientHtml);
      }
      if (options.server === false && options.client !== false) {
        return done(null, buildClientScripts(clientHtml, options));
      }

      let rendered: string = clientHtml.replace(
        // <selector></selector>
        selectorRegExpFactory(options.selector),
        // <selector>{{ serializedCmp }}</selector>
        options.serializedCmp
      );

      done(null, buildClientScripts(rendered, options));
    });
  } catch (e) {
    done(e);
  }
}
