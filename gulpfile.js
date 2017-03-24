/* jshint undef: false, unused: false */

var gulp = require('gulp'),
    minifycss = require('gulp-minify-css'),
    cleanCSS = require('gulp-clean-css'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    jshint = require('gulp-jshint');

/* 语法检查 */
gulp.task('jshint',  function () {
    'use strict';
    return gulp.src('js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

/* 压缩css */
// gulp.task('minify-css', function() {
//     'use strict';
//     return gulp.src('styles/*.css')
//         .pipe(cleanCSS({compatibility: 'ie8'}))
//         .pipe(gulp.dest('minified/css'));
// });

/* 压缩css */
gulp.task('minifycss',  function() {
    'use strict';
    return gulp.src('css/*.css')    //需要操作的文件
        .pipe(rename({suffix: '.min'}))   //rename压缩后的文件名
        .pipe(minifycss())   //执行压缩
        .pipe(gulp.dest('minified/css'));   //输出文件夹
});

/* 压缩js */
gulp.task('minifyjs', function() {
    'use strict';
    return gulp.src(['js/resources.js','js/class.js','js/util.js','js/controller.js',
        'js/dommanager.js','js/data.js','js/app.js','js/engine.js'])    //顺序加载
        .pipe(concat('main.js'))            //合并到 main.js
        .pipe(gulp.dest('minified/js'))     //输出到文件夹
        .pipe(rename({suffix: '.min'}))     //rename压缩后的文件名
        .pipe(uglify())    //压缩
        .pipe(gulp.dest('minified/js'));  //输出
});

/* 默认命令，在cmd中输入gulp后，执行的就是这个任务(压缩js需要在检查js之后操作) */
gulp.task('default', ['jshint'], function() {
    'use strict';
    gulp.start('minifycss', 'minifyjs');
});
