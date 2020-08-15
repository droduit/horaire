const gulp = require('gulp');
const babel = require('gulp-babel');

// Include plugins
var plugins = require('gulp-load-plugins')(); // tous les plugins de package.json

// Variables de chemins
const path = {
  dev : {
    js: './src/assets/js/',
    css: './src/assets/css/'
  }, 
  prod : {
    js: './dist/assets/js/',
    css: './dist/assets/css/'
  }
};


// # CSS ---------
gulp.task('css-clean-preprocess-concat-minify', function () {
  gulp.src(path.prod.css + '*.css').pipe(plugins.clean());

  return gulp.src([
      path.dev.css + 'google-fonts.css',
      path.dev.css + 'material-icons.css',
      path.dev.css + 'custom.less',
      path.dev.css + 'bootbox.css',
      path.dev.css + 'lightpick.less'
    ])
    .pipe(plugins.less()) // preprocess less
    .pipe(plugins.concat('bundle.css'))
    .pipe(plugins.csscomb())
    .pipe(plugins.cssbeautify({indent: '  '}))
    .pipe(plugins.autoprefixer())
    .pipe(plugins.csso()) // minify
    .pipe(plugins.rename({suffix: '.min'}))
    .pipe(gulp.dest(path.prod.css));
});

// # JS -----------
gulp.task('js-clean-concat-minify', function() {
  gulp.src(path.prod.js + '*.js').pipe(plugins.clean());

  return gulp.src([
      path.dev.js + 'polyfill.js',

      // --- Dépendences vitales à l'application
      path.dev.js + 'vendor/expiredStorage.js', // Handle storage like cookies
      path.dev.js + 'vendor/bootbox.js', // Modal windows for bootstrap
      path.dev.js + 'vendor/cleave.js', // Format inputs
      path.dev.js + '_variables.js',
      path.dev.js + 'app.js',

      // --- Dépendences pour les modules
      path.dev.js + 'vendor/moment.js', // Lightpick dependency
      path.dev.js + 'vendor/lightpick.js', // Calendar for holiday planner

      // --- Modules de l'application
      path.dev.js + 'modules/index.js', // Code hors modules      
  		path.dev.js + 'modules/config.js',  // Page configuration
      path.dev.js + 'modules/horaire.js',  // Page horaire
      path.dev.js + 'modules/timbrer.js', // Bouton "Timbrer"
      path.dev.js + 'modules/timesheet.js', // Page timesheet
  		// path.dev.js + 'modules/time-converter.js', // Page convertisseur de temps  
      path.dev.js + 'modules/holidayPlan.js' // Planificateur de vacances
    ])
    .pipe(plugins.concat('bundle.js'))
    .pipe(babel())
    .pipe(plugins.uglify())
    .pipe(plugins.rename({suffix: '.min'}))
    .pipe(gulp.dest(path.prod.js));
});

gulp.task('js-clean-concat-minify-sw', function() {
  return gulp.src('./serviceWorker.js')
    .pipe(babel())
    .pipe(plugins.uglify())
    .pipe(plugins.rename({suffix: '.min'}))
    .pipe(gulp.dest('./'));
});

// # HTML
gulp.task('html-minify', function() {
  return gulp.src('./index.html')
    .pipe(plugins.htmlmin({ collapseWhitespace: true }))
    .pipe(plugins.rename({suffix: '.min'}))
    .pipe(gulp.dest("./"));
});

gulp.task('css', gulp.series('css-clean-preprocess-concat-minify')); 
gulp.task('js', gulp.series('js-clean-concat-minify', 'js-clean-concat-minify-sw'));
gulp.task('html', gulp.series('html-minify'));

gulp.task('build', gulp.parallel('css', 'js', 'html'));