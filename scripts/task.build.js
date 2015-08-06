/**
 * This task is used to build all resources need to run examples
 */
module.exports = function (gulp) {
  return {
    
    // build a version of preboot to examples so we can do manual tests and karma unit tests
    preboot: function () {
      var preboot = require('../dist/preboot/server');
      return preboot.getClientCodeStream({
        appRoot:  'app',         // selector for root element
        freeze:   'spinner',     // show spinner w button click & freeze page
        replay:   'rerender',    // rerender replay strategy
        buffer:   true,          // client app will write to hidden div until bootstrap complete
        debug:    true,
        uglify:   false,
        presets:  ['keyPress', 'buttonPress', 'focus']
      })
      .pipe(gulp.dest('./modules/examples/preboot/src')); 
    },
    '': ['build.preboot']
  };
};
