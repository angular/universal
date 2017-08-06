This is a tool which will gather the routes from a build factory bundle and return them ready to be used with stamping out prerendered index.html files

```js
import { lsRoutes } from '@nguniversal/ls-routes';

const {AppServerModuleNgFactory, LAZY_MODULE_MAP} = require('./main.a5d2e81ce51e0c3ba3c8.bundle.js')

lsRoutes(
  'flatPaths', 
  AppServerModuleNgFactory,
  LAZY_MODULE_MAP
).then(paths => {
  paths.filter(path => !path.includes(':'))
    .forEach(path => {
    renderModuleFactory(AppServerModuleNgFactory, {
      document: index,
      url: path,
      extraProviders: [
        provideModuleMap(LAZY_MODULE_MAP)
      ]
    })
    .then(html => fs.writeFileSync(`dist/${path.replace(/\//g, '-')}.index.html`, html))
  })
})