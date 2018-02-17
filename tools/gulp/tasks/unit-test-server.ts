import {task} from 'gulp';
import {buildConfig} from 'lib-build-tools';

const {projectDir} = buildConfig;

/**
 * Gulp tasks to run the unit tests in SSR mode
 * This sets the PLATFORM_ID flag to the server and
 * sets the DOCUMENT value to the Domino instance
 */
task('test:server', [':test:build'], (done: () => void) => {

  const jasmine = new (require('jasmine'))({projectBaseDir: projectDir});
  require('zone.js');
  require('zone.js/dist/zone-testing');
  const {TestBed} = require('@angular/core/testing');
  const {ServerTestingModule, platformServerTesting} = require('@angular/platform-server/testing');
  TestBed.initTestEnvironment(
    ServerTestingModule,
    platformServerTesting()
  );

  jasmine.loadConfigFile('test/jasmine.json');
  jasmine.execute();
  done();
});
