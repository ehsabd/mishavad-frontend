'use strict'
const gulp = require('gulp')
const templateCache = require('gulp-angular-templatecache')
const minifyHtml = require('gulp-minify-html')
const concat = require('gulp-concat')
const uglify = require('gulp-uglify')
const rename = require('gulp-rename')
const ngannotate = require('gulp-ng-annotate')
const closure = require('gulp-jsclosure')
const p = require('path')
const debug = require("gulp-debug");
/**
* Paths configuration, easy to change and/or use in multiple tasks
*/
const paths = {
  javascripts: [
	'./FrontEnd/app/app.module.js',
    /*
     * this file should not be commited to git, you write HTML!
     * it should also not beeing watched by gulp if it then triggers a change
     * or gulp will be left in an infinite loop (see below)
     */
	'./app.templates.js',
	'./FrontEnd/app/**/*.js',
  './FrontEnd/app/**/**/*.js',
  './git_clones/ngImgCrop/ng-img-crop.js'
  ],
  templates: [
    './FrontEnd/app/**/*.html',
    './FrontEnd/app/**/**/*.html'
  ]
}

/**
* Takes html templates and transform them to angular templates (javascript)
*/
gulp.task('templates', function() {
  return gulp.src(paths.templates)
   .pipe(minifyHtml({
        empty: true,
        spare: true,
        quotes: true
    }))
    .pipe(templateCache({
      module: 'app.templates',
	  root:'app',
      standalone: true,
      /**
       * Here, I'm removing .html so that `$templateCache` holds
       * the template in `views/home` instead of `views/home.html`.
       * I'm keeping the directory structure for the template's name
       */
      transformUrl: function(url) {
        return url.replace(p.extname(url), '')
      }
    }))
    .pipe(debug())
    //put all those to our javascript file
    .pipe(concat('app.templates.js'))
    .pipe(gulp.dest('./'))
})

/**
* Concat, closure, annotate, uglify scripts
* @beforeDo `gulp templates`
*/
gulp.task('scripts', ['templates'], function() {
  return gulp.src(paths.javascripts)
    //first, I'm building a clean 'main.js' file
    .pipe(concat('./FrontEnd/main.js'))
    .pipe(closure({angular: true}))
    .pipe(ngannotate())
    .pipe(gulp.dest('./'))
    //then, uglify the `main.js` and rename it to `main.min.js`
    //mangling might cause issues with angular
    .pipe(uglify({mangle: false}))
    .pipe(rename('main.js'))
    .pipe(gulp.dest('./FrontEnd/minified/'))
})

/**
* The command `gulp` will resolve in `gulp scripts`
*/
gulp.task('default', ['scripts'])

/**
* Watch the paths you want and execute the scripts task
* @beforeDo default (small useful hack)
*/
gulp.task('watch', ['default'], function() {
  /**
   * Either don't add `templates.js` to the js paths 
   * and add it later to the scripts task source or remove it here.
   * Indeed, if `templates.js` is beeing watched, 
   * it'll run the templates task and it might change the file. 
   * The task will then run again, etc.
   * You can use https://github.com/urish/gulp-add-src to add it to the `script`
   * sources.
   */
  let js = paths.javascripts.slice().concat(paths.templates.slice());
  js.splice(js.indexOf('./app.templates.js'), 1)
  var watcher = gulp.watch(js,{readDelay:1000}, ['scripts'])
  watcher.on('change', function(event) {
    console.log('File ' + event.path + ' was ' + event.type);
  })
  return watcher
})
