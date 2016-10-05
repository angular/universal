var webpack = require('webpack');
var path = require('path');
var clone = require('js.clone');

var UglifyJsPlugin = require('webpack/lib/optimize/UglifyJsPlugin');
var DedupePlugin = require('webpack/lib/optimize/DedupePlugin');
var ContextReplacementPlugin = require('webpack/lib/ContextReplacementPlugin');
var TsConfigPathsPlugin = require('awesome-typescript-loader').TsConfigPathsPlugin;
var ForkCheckerPlugin = require('awesome-typescript-loader').ForkCheckerPlugin;
var NgcWebpackPlugin = require('@ngtools/webpack').NgcWebpackPlugin;

var sharedPlugins = [
  // new DedupePlugin(),
  // new UglifyJsPlugin({
  //   // beautify: true, //debug
  //   // mangle: false, //debug
  //   // mangle: true, //prod
  //   compress: {
  //     screw_ie8: true,
  //     keep_fnames: true,
  //     // drop_debugger: false,
  //     // dead_code: true,
  //     // unused: true
  //   },
  //   comments: false,
  // }),
  // new NgcWebpackPlugin({
  //   project: './ngc-tsconfig.json',
  //   baseDir: root('.'),
  //   entryModule: root('./src/app.browser.aot#MainModule')
  // }),
  // new NgcWebpackPlugin({
  //   project: './ngc-tsconfig.json',
  //   baseDir: root('.'),
  //   entryModule: root('./src/app.node.aot#MainModule')
  // }),
  new ContextReplacementPlugin(
    // The (\\|\/) piece accounts for path separators in *nix and Windows
    /angular(\\|\/)core(\\|\/)(esm(\\|\/)src|src)(\\|\/)linker/,
    root('./src'),
    { }
  ),
  new TsConfigPathsPlugin({
    tsconfig: 'tsconfig.json'
  }),
  new ForkCheckerPlugin()
];
var webpackConfig = setTypeScriptAlias(require('./tsconfig.json'), {
  cache: true,

  devtool: 'source-map',

  output: {
    filename: '[name]-bundle.js',
    path: './dist',
  },

  module: {
    loaders: [
      // .ts files for TypeScript
      { test: /\.(js|ts)$/, loaders: ['awesome-typescript-loader', 'angular2-template-loader'], exclude: [/node_modules/] },
      { test: /\.json$/, loader: 'json-loader' },
      { test: /\.html$/, loader: 'raw-loader' },
      { test: /\.css$/, loader: 'raw-loader' },
    ],

  },

  plugins: [
    // don't define plugins here. define them above in shared plugins
  ],

  resolve: {

    // mainFields: ['jsnext:main', 'main', 'jsnext:browser', 'browser', 'jsnext:main', 'module'],

    extensions: ['.ts', '.js', '.json'],

    alias: {
      // 'rxjs': root('node_modules/rxjs-es'),
      // '@angular/common': root('node_modules/@angular/common/esm'),
      // '@angular/compiler': root('node_modules/@angular/cpmiler/esm'),
      // '@angular/core': root('node_modules/@angular/core/esm'),
      // '@angular/forms': root('node_modules/@angular/forms/esm'),
      // '@angular/http': root('node_modules/@angular/http/esm'),
      // '@angular/platform-browser': root('node_modules/@angular/platform-browser/esm'),
      // '@angular/platform-browser-dynamic': root('node_modules/@angular/platform-browser-dynamic/esm'),
      // '@angular/platform-server': root('node_modules/@angular/platform-server/esm'),

    }

  },

})

module.exports = [
  plugins(sharedPlugins, require('./webpack.config-browser')(clone(webpackConfig))),
  plugins(sharedPlugins, require('./webpack.config-server')(clone(webpackConfig))),
]


function plugins(plugins, config) {
  config.plugins = config.plugins.concat(plugins);
  return config
}


function setTypeScriptAlias(tsConfig, config) {
  var newConfig = clone(config);
  newConfig = newConfig || {};
  newConfig.resolve = newConfig.resolve || {};
  newConfig.resolve.alias = newConfig.resolve.alias || {};
  var tsPaths = tsConfig.compilerOptions.paths;
  for (var prop in tsPaths) {
    newConfig.resolve.alias[prop]  = root(tsPaths[prop][0]);
  }
  return newConfig;
}

function root(args) {
  args = Array.prototype.slice.call(arguments, 0);
  return path.join.apply(path, [__dirname].concat(args));
}
