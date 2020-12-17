/**
 * The ServerSettings interface helps
 * the autocompletion in the server.ts
 */
export interface ServerSettings {
  /** is SSL going to be used? */
  useSSL: boolean;
  /** Full path to private key file. */
  sslKey: string;
  /** Full path to public cert file. */
  sslCert: string;
  /** The hostname to bind on. */
  hostName: string;
  /** The port number the server will be served on. */
  port: number;
}
