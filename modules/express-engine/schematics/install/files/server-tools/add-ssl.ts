import * as express from 'express';
import { readFileSync } from 'fs';
import * as https from 'https';
import { ServerSettings } from './server-settings.interface';


// Webpack will replace 'require' with '__webpack_require__'
// '__non_webpack_require__' is a proxy to Node 'require'
declare const __non_webpack_require__: NodeRequire;



/**
 * Add SSL support to an express server.
 * It uses the nodes https.createServer to wrap the express server
 * It uses the (lazy-loaded) selfcert package to generate
 * a self-signed certificate on the fly if there isn't one provided.
 * @param server the express app/server
 */
export function addSSL(server: express.Express,serverSettings:ServerSettings): express.Express {
  const pems = {
    private: '',
    cert: '',
  };
  if (serverSettings.sslCert && serverSettings.sslKey) {
    try {
      pems.private = readFileSync(serverSettings.sslKey).toString();
      pems.cert = readFileSync(serverSettings.sslCert).toString();
    } catch (e) {
      console.error(`
        Please check the path for the certificate sslKey or sslCert.
         Could not read/find the file: ${e.path}
        `);
      /** hard exit here, We don't want to procees with faulty certs */
      process.exit(1);
    }
  } else {
    const attrs = [
      {
        name: 'angular-universal-test',
        value: `${serverSettings.hostName}:${serverSettings.port}`,
        type: 'RSAPublicKey',
      },
    ];
    /**
     * generate selfSigned here.
     * If they remove the SSL there is no runtime penalty for loading this anymore.
     */
    const { generate } = __non_webpack_require__('selfsigned');
    const generated = generate(attrs, { days: 365 });
    pems.cert = generated.cert;
    pems.private = generated.private;
    /**
     * do we want to write those generated certs back to the FS?
     */
    console.log(`
**************************************************************************
* We generated an self-signed certificate for your universal app.        *
* This is not suited for production, and will cause a waring in          *
* the browser.                                                           *
**************************************************************************`)
  }
  /** "upgrade" the express app(server) to https */
  return (https.createServer(
    {
      key: pems.private,
      cert: pems.cert,
    },
    server
  ) as unknown) as express.Express;
}
