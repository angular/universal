import '../../../helpers/polyfills.test';
import {
  ORIGIN_URL,
  REQUEST_URL,
  PRIME_CACHE,
  COOKIE_KEY,
  NODE_APP_ID,
  getUrlConfig,
  createUrlProviders
} from '../tokens';

describe('Platform-Node Tokens', ()=> {
  describe('constants', () => {
    it('should match const definition', () => {
      expect(ORIGIN_URL.toString()).toEqual('Token ORIGIN_URL');
      expect(REQUEST_URL.toString()).toEqual('Token REQUEST_URL');
      expect(PRIME_CACHE.toString()).toEqual('Token PRIME_CACHE');
      expect(COOKIE_KEY.toString()).toEqual('Token COOKIE_KEY');
      expect(NODE_APP_ID.toString()).toEqual('Token NODE_APP_ID');
    });
  });
  describe('getUrlConfig', () => {
    it('should return an array of objects', () => {
      const cfg = getUrlConfig();

      cfg.forEach((entry) => {
        expect(entry.provide).toBeDefined();
        expect(entry.useValue).toBeDefined();
      });
    });
  });
  describe('createUrlProviders', () => {
    it('should return empty array', () => {
      expect(createUrlProviders({}).length).toBe(0);
    });
    it('should return a filtered and mapped array', () => {
      const mapped = createUrlProviders({baseUrl: 'testValue'})[0];
      expect(mapped.provide.toString()).toBe('Token appBaseHref');
      expect(mapped.useValue).toBe('testValue');
    });
  })
});
