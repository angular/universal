/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/* tslint:disable:no-console  */
import {ngExpressEngine} from '@nguniversal/express-engine';

require('zone.js/dist/zone-node.js');

import {enableProdMode} from '@angular/core';
import * as express from 'express';

import {HelloWorldServerModuleNgFactory, LAZY_MODULE_MAP} from './helloworld/app.server.ngfactory';
import {provideModuleMap} from '@nguniversal/module-map-ngfactory-loader';
const helloworld = require('raw-loader!./helloworld/index.html');

const app = express();

enableProdMode();

// Client bundles will be statically served from the built/ directory.
app.use('/built', express.static('built'));

// Keep the browser logs free of errors.
app.get('/favicon.ico', (req, res) => { res.send(''); });

//-----------ADD YOUR SERVER SIDE RENDERED APP HERE ----------------------
// All regular routes use the Universal engine
app.get('*', (req, res) =>
  ngExpressEngine({bootstrap: HelloWorldServerModuleNgFactory})('built/src/index.html', {
    bootstrap: HelloWorldServerModuleNgFactory,
    req,
    document: helloworld,
    url: req.url,
    providers: [
      provideModuleMap(LAZY_MODULE_MAP)
    ]
  }, (err, html) => res.send(html))
);

app.listen(9876, function() { console.log('Server listening on port 9876!'); });
