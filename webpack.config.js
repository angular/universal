var fs = require('fs');
var path = require('path');
var webpack = require('webpack');
var sliceArgs = Function.prototype.call.bind(Array.prototype.slice);

// Object containing all node modules 
// for excluding dependencies in server side builds
var nodeModules = {};
fs.readdirSync('node_modules')
  .filter(function(x) {
    return ('.bin' !== x);
  })
  .forEach(function(mod) {
    nodeModules[mod] = 'commonjs ' + mod;
  });

module.exports = {
  resolve: {
    extensions: ['', '.ts', '.js']
  },

  entry: {
    'server/server': './modules/server/server',
    'preboot/server': './modules/preboot/server',
    'preboot/client': './modules/preboot/client',
    'experimental/experimental': './modules/experimental/experimental'
  },

  output: {
    path: root('__build__'),
    filename: '[name].js',
  },

  node: {
    fs: 'empty'
  },

  externals: nodeModules,

  module: {
    loaders: [
      {
        test: /\.ts$/,
        loader: 'typescript-simple-loader'
      }
    ]
  }

}


function root(args) {
  args = sliceArgs(arguments, 0);
  return path.join.apply(path, [__dirname].concat(args));
}