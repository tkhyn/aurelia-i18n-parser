var gulp = require('gulp');
var paths = require('../paths');

gulp.task('watch', function() {
  gulp.watch(paths.source+"/**/*.js", ['build-commonjs']).on('change', reportChange);
});

// outputs changes to files to the console
function reportChange(event){
  console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
}
