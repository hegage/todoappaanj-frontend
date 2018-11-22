var gulp = require('gulp'),
      $    = require('gulp-load-plugins')();


gulp.task('sass', function () {
    return gulp.src('./scss/main.scss')
      .pipe($.sass().on('error', $.sass.logError))
      .pipe(gulp.dest('./css'));
  });


  gulp.task('default', () => {
    gulp.watch('./**/*.scss', ['sass']);
  });