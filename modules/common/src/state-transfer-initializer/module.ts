/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { DOCUMENT } from '@angular/common';
import { APP_INITIALIZER, NgModule } from '@angular/core';

/**
 * @deprecated Use `provideClientHydration` instead which caches HTTP requests by default.
 * @see https://angular.io/api/platform-browser/provideClientHydration
 */
export function domContentLoadedFactory(doc: Document): () => Promise<void> {
  return () =>
    new Promise((resolve, _reject) => {
      if (doc.readyState === 'complete' || doc.readyState === 'interactive') {
        resolve();

        return;
      }

      const contentLoaded = () => {
        doc.removeEventListener('DOMContentLoaded', contentLoaded);
        resolve();
      };

      doc.addEventListener('DOMContentLoaded', contentLoaded);
    });
}

/**
 * @deprecated Use `provideClientHydration` instead which caches HTTP requests by default.
 * @see https://angular.io/api/platform-browser/provideClientHydration
 */
@NgModule({
  providers: [
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: domContentLoadedFactory,
      deps: [DOCUMENT],
    },
  ],
})
export class StateTransferInitializerModule {}
