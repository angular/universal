import {red} from 'chalk';
import {readdirSync, readFileSync, statSync} from 'fs';
import {task} from 'gulp';
import {buildConfig} from 'lib-build-tools';
import {IMinimatch, Minimatch} from 'minimatch';
import {join} from 'path';
import {execNodeTask} from '../util/task_helpers';

// These types lack of type definitions
const madge = require('madge');

/** List of flags that will passed to the different TSLint tasks. */
const tsLintBaseFlags = ['-c', 'tslint.json', '--project', './tsconfig.json'];

/** Path to the output of the ASP.NET Core engine package. */
const aspOutPath = join(buildConfig.outputDir, 'packages', 'aspnetcore-engine');

/** Path to the output of the Common package. */
const commonOutPath = join(buildConfig.outputDir, 'packages', 'common');

/** Path to the output of the Express engine package. */
const expressOutPath = join(buildConfig.outputDir, 'packages', 'express-engine');

/** Path to the output of the Hapi engine package. */
const hapiOutPath = join(buildConfig.outputDir, 'packages', 'hapi-engine');

/** Path to the output of the Module Map NgFactory Loader package. */
const mmnlOutPath = join(buildConfig.outputDir, 'packages', 'module-map-ngfactory-loader');


/** Path for the Github owners file. */
const ownersFilePath = '.github/CODEOWNERS';

/** Path for the .gitignore file. */
const gitIgnorePath = '.gitignore';

// TODO(CaerusKaru): add back 'ownerslint' when we add a CODEOWNERS file to the repo
task('lint', ['tslint', 'madge']);

/** Task to run TSLint against the e2e/ and src/ directories. */
task('tslint', execNodeTask('tslint', tsLintBaseFlags));

/** Task that automatically fixes TSLint warnings. */
task('tslint:fix', execNodeTask('tslint', [...tsLintBaseFlags, '--fix']));

/** Task that runs madge to detect circular dependencies. */
task('madge', [
  'aspnetcore-engine:clean-build',
  'common:clean-build',
  'express-engine:clean-build',
  'hapi-engine:clean-build',
  'module-map-ngfactory-loader:clean-build'], () => {
  madge([aspOutPath, commonOutPath, expressOutPath, hapiOutPath, mmnlOutPath]).then((res: any) => {
    const circularModules = res.circular();

    if (circularModules.length) {
      console.error();
      console.error(red(`Madge found modules with circular dependencies.`));
      console.error(formatMadgeCircularModules(circularModules));
      console.error();
    }
  });
});

task('ownerslint', () => {
  let errors = 0;

  let ownedPaths = readFileSync(ownersFilePath, 'utf8').split('\n')
  // Trim lines.
    .map(line => line.trim())
    // Remove empty lines and comments.
    .filter(line => line && !line.startsWith('#'))
    // Split off just the path glob.
    .map(line => line.split(/\s+/)[0])
    // Turn paths into Minimatch objects.
    .map(path => new Minimatch(path, {dot: true, matchBase: true}));

  let ignoredPaths = readFileSync(gitIgnorePath, 'utf8').split('\n')
  // Trim lines.
    .map(line => line.trim())
    // Remove empty lines and comments.
    .filter(line => line && !line.startsWith('#'))
    // Turn paths into Minimatch objects.
    .map(path => new Minimatch(path, {dot: true, matchBase: true}));

  for (let paths = getChildPaths('.'); paths.length;) {
    paths = Array.prototype.concat(...paths
    // Remove ignored paths
      .filter(path => !ignoredPaths.reduce(
        (isIgnored, ignoredPath) => isIgnored || ignoredPath.match('/' + path), false))
      // Remove paths that match an owned path.
      .filter(path => !ownedPaths.reduce(
        (isOwned, ownedPath) => isOwned || isOwnedBy(path, ownedPath), false))
      // Report an error for any files that didn't match any owned paths.
      .filter(path => {
        if (statSync(path).isFile()) {
          console.log(red(`No code owner found for "${path}".`));
          errors++;
          return false;
        }
        return true;
      })
      // Get the next level of children for any directories.
      .map(path => getChildPaths(path)));
  }

  if (errors) {
    throw Error(`Found ${errors} files with no owner.`);
  }
});

/** Check if the given path is owned by the given owned path matcher. */
function isOwnedBy(path: string, ownedPath: IMinimatch) {
  // If the owned path ends with `**` its safe to eliminate whole directories.
  if (ownedPath.pattern.endsWith('**') || statSync(path).isFile()) {
    return ownedPath.match('/' + path);
  }
  return false;
}

/** Get the immediate child paths of the given path. */
function getChildPaths(path: string) {
  return readdirSync(path).map(child => join(path, child));
}

/** Returns a string that formats the graph of circular modules. */
function formatMadgeCircularModules(circularModules: string[][]): string {
  return circularModules.map((modulePaths: string[]) => `\n - ${modulePaths.join(' > ')}`).join('');
}
