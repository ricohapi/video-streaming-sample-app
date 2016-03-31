var gulp = require('gulp'),
  webserver = require('gulp-webserver'),
  webpack = require('webpack-stream'),
  webpackConfig = require('./webpack.config.js');

gulp.task('run', function () {
    gulp.src('')
        .pipe(webserver({
            host: 'localhost',
            port: 8034,
            open: true,
            fallback: 'samples/index.html'
        }));
});

gulp.task('build', function() {
  return gulp.src('')
    .pipe(webpack(webpackConfig))
    .pipe(gulp.dest(''));
});