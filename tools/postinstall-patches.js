try {
  require.resolve('shelljs');
} catch (e) {
  // We are in an bazel managed external node_modules repository
  // and the resolve has failed because node did not preserve the symlink
  // when loading the script.
  // This can be fixed using the --preserve-symlinks-main flag which
  // is introduced in node 10.2.0
  console.warn(
    `Running postinstall-patches.js script in an external repository requires --preserve-symlinks-main node flag introduced in node 10.2.0. ` +
    `Current node version is ${process.version}. Node called with '${process.argv.join(" ")}'.`);
  process.exit(0);
}

const {set, cd, sed, echo, ls} = require('shelljs');
const {readFileSync} = require('fs');
const path = require('path');
const log = console.log;

// COMMENTED OUT BECAUSE WE CURRENTLY REQUIRE NO PATCHES
// UNCOMMENT TO REENABLE PATCHING AND LOG OUTPUT
//
log('===== about to run the postinstall-patches.js script     =====');
// fail on first error
set('-e');
// print commands as being executed
set('-v');
// jump to project root
cd(path.join(__dirname, '../'));

/* EXAMPLE PATCH:
// https://github.com/ReactiveX/rxjs/pull/3302
// make node_modules/rxjs compilable with Typescript 2.7
// remove when we update to rxjs v6
log('\n# patch: reactivex/rxjs#3302 make node_modules/rxjs compilable with Typescript 2.7');
sed('-i', '(\'response\' in xhr)', '(\'response\' in (xhr as any))',
    'node_modules/rxjs/src/observable/dom/AjaxObservable.ts');
*/

// Workaround https://github.com/bazelbuild/rules_nodejs/issues/1033
// TypeScript doesn't understand typings without "declare module" unless
// they are actually resolved by the @types default mechanism
log('\n# patch: @types/hapi__* adding declare module wrappers');
ls('node_modules/@types').filter(f => f.startsWith('hapi__')).forEach(pkg => {
  const modName = '@' + pkg.replace('__', '/');
  const typingsFile = `node_modules/@types/${pkg}/index.d.ts`;
  // Only add the patch if it is not already there.
  if (readFileSync(typingsFile, 'utf8').indexOf('/*added by tools/postinstall_patches.js*/') ===
    -1) {
    const insertPrefix = `/*added by tools/postinstall_patches.js*/ declare module "${modName}" { `;
    sed('-i', `(// Type definitions for ${modName})`, insertPrefix + '$1', typingsFile);
    echo('}').toEnd(typingsFile);
  }
});

log(`\n# patch: @ngtools/webpack workaround for error 'Angular Compiler was detected but it was an instance of the wrong class.'`);
sed(
  '-i',
  'resolveLoader: {',
  'resolveLoader: { symlinks: false,',
  'node_modules/@angular-devkit/build-angular/src/angular-cli-files/models/webpack-configs/common.js'
);

log(`\n# patch:  Cannot find module '@babel/preset-env' from`);
sed(
  '-i',
  `'@babel/preset-env'`,
  `require.resolve('@babel/preset-env')`,
  'node_modules/@angular-devkit/build-angular/src/utils/process-bundle.js'
);

log('===== finished running the postinstall-patches.js script =====');
