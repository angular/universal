var jasmine = require('gulp-jasmine');
var reporters = require('jasmine-reporters');
var karma   = require('karma').server;

module.exports = function (gulp, opts) {
  return {
    karma: function (done) {
      var karmaConfig = {
        port: 9201,
        runnerPort: 9301,
        captureTimeout: 20000,
        growl: true,
        colors: true,
        browsers: [].concat(opts.browser || 'PhantomJS'),
        reporters: [].concat(opts.reporter || 'progress'),
        plugins: ['karma-jasmine', 'karma-phantomjs-launcher'],
        frameworks: ['jasmine'],
        preprocessors: {},
        coverageReporter: { type: 'text-summary', dir: 'test/coverage/' },
        singleRun: !opts.watch,
        autoWatch: !!opts.watch,
        files: [
          'examples/preboot/src/preboot.js',
          'examples/preboot/test/preboot_spec.js'
        ]
      };

      // add coverage reporter and preprocessor if param set at command line
      if (opts.cov) {
        karmaConfig.reporters.push('coverage');
        karmaConfig.preprocessors['examples/preboot/src/preboot.js'] = 'coverage';
      }

      karma.start(karmaConfig, function () { done(); });
    },
    
    // server side unit tests for preboot using jasmine
    unit: function () {
      return gulp.src('examples/preboot/test/preboot_spec.js')
        .pipe(jasmine({
          reporter: new reporters.TerminalReporter({
            verbose: 3,
            showStack: true,
            color: true
          })
        }));
    },
    '': ['test.unit']
  };
};
