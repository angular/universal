// @ts-check
// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

const { SpecReporter } = require('jasmine-spec-reporter');
const { exec, execSync } = require('child_process');
let serverDaemon;

/**
 * @type { import("protractor").Config }
 */
exports.config = {
  allScriptsTimeout: 11000,
  specs: [
    './src/**/*.e2e-spec.ts'
  ],
  capabilities: {
    browserName: 'chrome',
    chromeOptions: {
      args: ['--no-sandbox'],
      binary: process.env.CHROME_BIN,
    }
  },
  directConnect: true,
  baseUrl: 'http://localhost:4001/',
  framework: 'jasmine',
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000,
    print: function() {}
  },
  onPrepare() {
    require('ts-node').register({
      project: require('path').join(__dirname, './tsconfig.json')
    });
    jasmine.getEnv().addReporter(new SpecReporter({ spec: { displayStacktrace: true } }));
    execSync(
      'ng run express-engine-ivy-prerender:prerender --routes=/ --routes=pokemon/pikachu',
      { stdio: 'inherit' },
    );
    serverDaemon = exec('PORT=4001 node dist/express-engine-ivy-prerender/server/main.js');
  },
  onComplete() {
    serverDaemon.kill();
  },
};
