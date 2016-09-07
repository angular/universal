/**
 * Some of the gulp tasks can accept command line arguments.
 * For example, `build` and `test` can accept --module=universal,grunt-prerender
 * to build or test only those modules.
 */
import * as child_process from 'child_process';
import * as buildUtils from './build-utils';
import * as ts from 'typescript';
import * as gulpTs from 'gulp-typescript';

const gulp = require('gulp');
const gulpChangelog = require('gulp-conventional-changelog');
const gulpJasmine = require('gulp-jasmine');
const istanbul = require('gulp-istanbul');
const jsonTransform = require('gulp-json-transform');
const rimraf = require('rimraf');
const args = require('minimist')(process.argv);
const tsConfig = require('./tsconfig.json');
const rootPkg = require('./package.json');
const runSequence = require('run-sequence');
const replace = require('gulp-replace');
const rename = require('gulp-rename');

// For any task that contains "test" or if --test arg is passed, include spec files
let isTest = false;

process.argv.forEach((arg)=> {
  if (arg.indexOf('test') > -1) {
    isTest = true;
  }
});

const files = buildUtils.getTargetFiles(isTest, args['module'], tsConfig);
const compilerOptions = buildUtils.getCompilerOptions(tsConfig);
const host = ts.createCompilerHost(compilerOptions);
const program = ts.createProgram(files, compilerOptions, host);
const sourceFiles = program.getSourceFiles().map(f => f.path);

gulp.task('watch', () => {
  return gulp.watch(sourceFiles, build);
});

gulp.task('test:watch', ['test'], () => {
  gulp.watch(sourceFiles, () => {
    buildTest(sourceFiles)
      .then(() => {
        runSequence(['pre-test', 'test']);
      });
  });
});

gulp.task('pre-test', ['build:test'], function () {
  return gulp.src(['./dist/**/!(*.spec).js'])
    .pipe(istanbul({ includeUntested: true }))
    .pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], () => {
  return gulp.src(['./dist/**/*.spec.js', './build-utils.spec.js'])
    .pipe(gulpJasmine({
      includeStackTrace: true
    }))
    .pipe(istanbul.writeReports({
      dir: './coverage',
      reporters: ['html'],
      reportOpts: { dir: './coverage' }
    }));
});

gulp.task('build', ['clean'], build);
gulp.task('build:test', ['clean'], () => buildTest(sourceFiles));
gulp.task('default', ['build']);

// This is handy when using npm link from dist/modules to test universal
// updates. If you use the normal buid with `clean` your npm link symlinks
// get wiped out and need recreating with each build which can be difficult
// for development and testing
gulp.task('build:no-clean', build);

function build() {
  return new Promise((resolve, reject) => {
    child_process.exec('node_modules/.bin/ngc', (err, stdout, stderr) => {
      if (err) {
        reject(err);
        return;
      }

      if (stdout) {
        console.log(stdout);
        resolve(stdout);
        return;
      }

      if (stderr) {
        console.warn(stderr);
        reject(stderr);
        return;
      }

      resolve();
    });
  })
    .then(() => {
      return new Promise((resolve, reject) => {
        gulp
          .src('compiled/ngc/modules/**/*')
          .pipe(rename(buildUtils.stripSrcFromPath))
          .pipe(replace(/\.\/src\//g, './'))
          .pipe(gulp.dest('dist'))
          .on('error', reject)
          .on('end', resolve);
      });
    });
}

function buildTest(path: string[]): Promise<any> {
  // TODO: remove this if it every works in watch mode without needing to re-create.
  let project = gulpTs.createProject('tsconfig.json', {
    typescript: require('typescript'),
    rootDir: 'modules'
  });
  let output = gulp.src(path)
    .pipe(gulpTs(project));
  // Using a promise instead of merging streams since end
  // event on streams seems not to be propagated when merged.
  return new Promise((resolve) => {
    var doneCount = 0;
    output.js
      .pipe(rename(buildUtils.stripSrcFromPath))
      .pipe(replace(/\.\/src\//g, './'))
      .pipe(gulp.dest('dist'))
      .on('end', maybeDone);
    output.dts
      .pipe(rename(buildUtils.stripSrcFromPath))
      .pipe(replace(/\.\/src\//g, './'))
      .pipe(gulp.dest('dist'))
      .on('end', maybeDone);

    function maybeDone() {
      doneCount++;
      if (doneCount === 2) {
        resolve();
      }
    }
  });

}

gulp.task('rewrite_packages', () => {
  const allModules = buildUtils.getAllModules();
  const publishedModuleNames = buildUtils.getPublishedModuleNames(allModules);
  const rootDependencies = buildUtils.getRootDependencies(rootPkg, publishedModuleNames);
  gulp.src('modules/**/package.json')
    .pipe(jsonTransform((data, _file) => {
      if (data.main) {
        data.main = data.main.replace('src/', '').replace('.ts', '.js');
      }
      if (data.browser) {
        data.browser = data.browser.replace('src/', '').replace('.ts', '.js');
      }
      Object.keys(data)
        .filter(k => ['dependencies', 'peerDependencies'].indexOf(k) > -1)
        .forEach(k => {
          data = Object.assign({}, data, {
            [k]: buildUtils.getRootDependencyVersion(Object.keys(data[k]), rootDependencies)
          });
        });
      return buildUtils.addMetadataToPackage(data, rootPkg);
    }, 2))
    .pipe(gulp.dest('dist'));
});

gulp.task('clean', () => {
  rimraf.sync('dist');
  rimraf.sync('coverage');
  rimraf.sync('compiled');
});

gulp.task('pre-publish', ['build', 'rewrite_packages', 'changelog', 'copy_license', 'copy_files']);

gulp.task('copy_license', () => {
  return buildUtils.getAllModules().reduce((stream, mod: string) => {
    return stream.pipe(gulp.dest(`dist/${mod}`));
  }, gulp.src('LICENSE'));
});

gulp.task('copy_files', () => {
  return gulp.src('modules/universal/typings.d.ts')
    .pipe(replace(/\.\/src\//g, './'))
    .pipe(gulp.dest(`dist/universal`));
});

gulp.task('changelog', () => {
  return gulp.src('CHANGELOG.md')
    .pipe(gulpChangelog({
      preset: 'angular',
      releaseCount: 1
    }, {
      // Conventional Changelog Context
      // We have to manually set version number so it doesn't get prefixed with `v`
      // See https://github.com/conventional-changelog/conventional-changelog-core/issues/10
      currentTag: rootPkg.version
    }))
    .pipe(gulp.dest('./'));
});
