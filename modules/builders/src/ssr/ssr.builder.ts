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
import { concatMap, map } from 'rxjs/operators';

export interface SsrBuilderOptions {
  watch: boolean;
  browserTarget: string;
  universalTarget: string;
  ssrBuildTarget: string;
  ssrExecuteTarget: string;
}

export class SsrBuilder implements Builder<SsrBuilderOptions> {
  constructor(private context: BuilderContext) {}

  run(
    target: BuilderConfiguration<SsrBuilderOptions>
  ): Observable<BuildEvent> {
    const options = target.options;

    return combineLatest(
      this.runFromTargetString(options.browserTarget, options.watch),
      this.runFromTargetString(options.universalTarget, options.watch),
      this.runFromTargetString(options.ssrBuildTarget, options.watch),
      this.runFromTargetString(options.ssrExecuteTarget, options.watch),
    ).pipe(
      map(([browser, universal, build, execute]) => {
        return {
          success: browser.success && universal.success && build.success && execute.success
        };
      })
    );

  }

  private runFromTargetString(targetString: string, watch: boolean): Observable<BuildEvent> {
    const [project, target, configuration] = targetString.split(':');

    const config = this.context.architect.getBuilderConfiguration<SsrBuilderOptions>({
      project,
      target,
      configuration,
      overrides: {
        watch
      }
    });

    return this.context.architect.getBuilderDescription(config).pipe(
      concatMap(buildDescription => {
        return this.context.architect.validateBuilderOptions(
          config,
          buildDescription
        );
      }),
      concatMap(validatedConfig =>
        this.context.architect.run(validatedConfig, this.context) as Observable<BuildEvent>
      )
    );
  }
}

export default SsrBuilder;
