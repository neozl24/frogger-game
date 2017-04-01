/* jshint undef: false, unused: false */

var gulp = require('gulp'),
    minifyhtml = require('gulp-htmlmin'),
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

/* 压缩html */
gulp.task('minifyhtml', function () {
    'use strict';
    var options = {
        removeComments: true,//清除HTML注释
        collapseWhitespace: true,//压缩HTML
        collapseBooleanAttributes: true,//省略布尔属性的值 <input checked="true"/> ==> <input />
        removeEmptyAttributes: true,//删除所有空属性值 <input id="" /> ==> <input />
        removeScriptTypeAttributes: true,//删除<script>的type="text/javascript"
        removeStyleLinkTypeAttributes: true,//删除<style>和<link>的type="text/css"
        minifyJS: true,//压缩页面JS
        minifyCSS: true//压缩页面CSS
    };
    gulp.src('*.html')
        .pipe(rename({suffix: '.min'}))//rename压缩后的文件名
        .pipe(minifyhtml(options))
        .pipe(gulp.dest('minified/html'));
});

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
    gulp.start('minifycss', 'minifyjs', 'minifyhtml');
});
