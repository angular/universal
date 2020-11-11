import { destroyPlatform, getPlatform } from '@angular/core';
import { ngFastifyEngine } from '@nguniversal/fastify-engine';
import { FastifyReply, FastifyRequest, fastify } from 'fastify';
import 'zone.js';
import { ExampleModuleNgFactory } from '../testing/example.ngfactory';

describe('test runner', () => {
  const server = fastify();

  server.get('/', (request: FastifyRequest, reply: FastifyReply) => ngFastifyEngine({
    request,
    reply,
    document: '<html><body><app></app></body></html>',
    bootstrap: ExampleModuleNgFactory
  }));

  server.get('/test', (_request: FastifyRequest, reply: FastifyReply) => {
    reply.send('ok');
  });

  beforeEach(async () => {
    if (getPlatform()) {
      destroyPlatform();
    }
  });

  it('should test the server', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/test'
    });
    expect(res.body).toBeDefined();
    expect(res.body).toBe('ok');
  });

  it('Returns a reply on successful request', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/'
    });
    expect(res.body).toBeDefined();
    expect(res.body).toContain('Works!');
  });
});
