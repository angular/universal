import {task} from 'gulp';

task('ci:build', [':publish:build-releases']);
task('ci:lint', ['lint']);
// Travis sometimes does not exit the process and times out. This is to prevent that.
task('ci:browser', ['test:browser:single-run'], () => process.exit(0));
task('ci:server', ['test:server']);
