import 'zone.js/dist/zone-node';

import fastifyStatic from 'fastify-static';
import { fastify, FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { ngFastifyEngine } from '@nguniversal/fastify-engine'

import { AppServerModule } from './src/<%= stripTsExtension(main) %>';

// The Fastify server is exported so that it can be used by serverless functions.
export function app(): FastifyInstance {
  const distFolder = join(process.cwd(), '<%= browserDistDirectory %>');
  const server = fastify();

  server.register(fastifyStatic, {
    root: distFolder,
    // Do not serve `.html` files and delegate to the Universal engine.
    wildcard: '**/!(*.html)',
  });

  const indexHtml = existsSync(join(distFolder, 'index.original.html'))
    ? 'index.original.html'
    : 'index.html';
  const document = readFileSync(join(distFolder, indexHtml), 'utf-8');

  // All regular routes use the Universal engine.
  server.get('*', (request: FastifyRequest, reply: FastifyReply) =>
    ngFastifyEngine({
      request,
      reply,
      document,
      bootstrap: AppServerModule,
    }),
  );

  return server;
}

async function run(): Promise<void> {
  const port = process.env.PORT || <%= serverPort %>;
  const server = app();
  await server.ready();
  const address = await server.listen(port);
  console.log(`Node Fastify server listening on ${address}`);
}

// Webpack will replace 'require' with '__webpack_require__'
// '__non_webpack_require__' is a proxy to Node 'require'
// The below code is to ensure that the server is run only when not requiring the bundle.
declare const __non_webpack_require__: NodeRequire;
const mainModule = __non_webpack_require__.main;
const moduleFilename = (mainModule && mainModule.filename) || '';
if (moduleFilename === __filename || moduleFilename.includes('iisnode')) {
  run().catch(error => {
    console.error(`Error: ${error.toString()}`);
    process.exit(1);
  });
}

export * from './src/<%= stripTsExtension(main) %>';
