/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {
  BuildEvent,
  Builder,
  BuilderConfiguration,
  BuilderContext
} from '@angular-devkit/architect';
import { Observable, combineLatest } from 'rxjs';
import { concatMap, map, tap } from 'rxjs/operators';

export interface SsrBuilderOptions {
  watch: boolean;
  browserTarget: string;
  universalTarget: string;
  ssrExecuteTarget: string;
}

const BROWSER_TARGET_CONFIG = {
  name: 'Browser Target',
  expectedTarget: '@angular-devkit/build-angular:browser',
};
const UNIVERSAL_TARGET_CONFIG = {
  name: 'Universal Target',
  expectedTarget: '@angular-devkit/build-angular:server',
};
const SSR_NODEJS_EXECUTE_CONFIG = {
  name: 'SSR Nodejs Execute',
  expectedTarget: '@nrwl/builders:node-execute',
};

export class SsrBuilder implements Builder<SsrBuilderOptions> {
  constructor(private context: BuilderContext) {}

  run(
    target: BuilderConfiguration<SsrBuilderOptions>
  ): Observable<BuildEvent> {
    const options = target.options;

    return combineLatest(
      this.runFromTargetString(BROWSER_TARGET_CONFIG.name, options.browserTarget, options.watch),
      this.runFromTargetString(UNIVERSAL_TARGET_CONFIG.name, options.universalTarget,
        options.watch),
      // the @nrwl/builders:node-execute dosen't have a watch mode option
      this.runFromTargetString(SSR_NODEJS_EXECUTE_CONFIG.name, options.ssrExecuteTarget,
        options.watch),
    ).pipe(
      map(([browser, universal, execute]) => {
        return {
          success: browser.success && universal.success && execute.success
        };
      })
    );

  }

  private runFromTargetString(name: string,
    targetString: string, watch: boolean): Observable<BuildEvent> {
    const [project, target, configuration] = targetString.split(':');

    this.context.logger.info(`Running ${name} with ${targetString}`);

    let overrides;
    if (name !== SSR_NODEJS_EXECUTE_CONFIG.name) {
      overrides = {watch};
    }

    const config = this.context.architect.getBuilderConfiguration<SsrBuilderOptions>({
      project,
      target,
      configuration,
      overrides,
    });

    return this.context.architect.getBuilderDescription(config).pipe(
      concatMap(buildDescription => {
        return this.context.architect.validateBuilderOptions(
          config,
          buildDescription
        );
      }),
      tap(validatedConfig => {
        const anotherconfig = [BROWSER_TARGET_CONFIG, UNIVERSAL_TARGET_CONFIG,
          SSR_NODEJS_EXECUTE_CONFIG].find(c => c.name === name);
        if (!anotherconfig) {
          throw new Error('Erm, some error? idk how this happened tbh');
        }
        if (anotherconfig.expectedTarget !== validatedConfig.builder) {
          throw new Error(
            `Unsupported builder for ${name}:
    Expected: ${anotherconfig.expectedTarget} but recieved ${validatedConfig.builder}`
            );
        }
      }),
      concatMap(validatedConfig =>
        this.context.architect.run(validatedConfig, this.context) as Observable<BuildEvent>
      )
    );
  }
}

export default SsrBuilder;
