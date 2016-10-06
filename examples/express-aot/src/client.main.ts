import {
  isBrowser,
  platformUniversalDynamic,
} from 'angular2-universal/browser';

import { MainModuleNgFactory } from '../ngfactory/src/app.browser.module.ngfactory';

export const platform = platformUniversalDynamic();

export function main() {
  console.log('isBrowser', isBrowser);
  // browserPlatform bootstrap
  return platform.bootstrapModuleFactory(MainModuleNgFactory);
}
