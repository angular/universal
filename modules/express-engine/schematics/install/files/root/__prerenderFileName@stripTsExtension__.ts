import 'zone.js/dist/zone-node';

import 'reflect-metadata';
import {readFileSync, writeFileSync, existsSync, mkdirSync} from 'fs';
import {join} from 'path';
import * as fs from 'fs';

// * NOTE :: leave this as require() since this file is built Dynamically from webpack
const {AppServerModuleNgFactory, LAZY_MODULE_MAP, provideModuleMap, renderModuleFactory, enableProdMode} = require('./<%= getServerDistDirectory() %>/main');

const routeData = require('./routes.json');

// Faster server renders w/ Prod mode (dev mode never needed)
enableProdMode();

const BROWSER_FOLDER = join(process.cwd(), '<%= getBrowserDistDirectory() %>');

// Load the index.html file containing references to your application bundle.
const index = readFileSync(join('browser', 'index.html'), 'utf8');

let previousRender = Promise.resolve();

// Iterate each route path
routeData.routes.forEach(route => {
  const fullPath = join(BROWSER_FOLDER, route);

  // Make sure the directory structure is there
  if (!existsSync(fullPath)) {
    mkdirSync(fullPath);
  }

  // Writes rendered HTML to index.html, replacing the file if it already exists.
  previousRender = previousRender.then(_ => renderModuleFactory(AppServerModuleNgFactory, {
    document: index,
    url: route,
    extraProviders: [
      provideModuleMap(LAZY_MODULE_MAP)
    ]
  })).then(html => writeFileSync(join(fullPath, 'index.html'), html));
});

const siteMap = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  ${routeData.routes.map(route => `<url>
    <loc>${routeData.hostname ? routeData.hostname : ''}${route}</loc>
  </url>`)}
</urlset>`;

fs.writeFile(join(BROWSER_FOLDER, 'sitemap.xml'), siteMap, 'utf8', (err) => {
  if (err) {
    throw err;
  }
  console.log('Sitemap has been created.');
});
