var webpack = require('webpack');
var path = require('path');
module.exports = {
  entry: './common/main.js',
  output: {
    filename: './build/ricohapi-webrtc.js',
    library: "RicohAPIWebRTC",
    libraryTarget: "umd"
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel',
      exclude: /^(?!.*ricoh).*(?=node_modules).*$/,
      query: {
        presets: ['es2015'],
        compact: false,
        cacheDirectory: true
      }
    },
    {
      test: /\.js$/,
      loader: "strip-loader?strip[]=console.log"
    }
    ],
    noParse: [/validate\.js/]
  },
  resolve: {
    extensions: ['', '.js'],
    modulesDirectories: ['node_modules'],
    module: {
      noParse: [ /\.\/data\//, /\.\/nightwatch\// ],
    },
  },
};
