const gulp = require('gulp');
const eslint = require('gulp-eslint');
const webserver = require('gulp-webserver');
const webpack = require('webpack-stream');
const webpackConfig = require('./webpack.config.js');

gulp.task('build', function() {
  return gulp.src('')
    .pipe(webpack(webpackConfig))
    .pipe(gulp.dest('./oneway-broadcast'))
    .pipe(gulp.dest('./oneway-watch'))
    .pipe(gulp.dest('./twoway'));
});

gulp.task('lint', function() {
  return gulp.src(['common/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError());
});
