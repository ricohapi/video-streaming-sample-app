module.exports = {
  entry: './samples/main.js',
  output: {
    filename: './build/bundle.js'
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel',
      query: {
        presets: ['es2015'],
        compact: false
      }
    }]
  },
  resolve: {
    extensions: ['', '.js']
  }
};
