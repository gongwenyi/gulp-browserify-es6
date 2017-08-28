'use strict';

var gulp = require('gulp');
var source = require('vinyl-source-stream');
var rename = require('gulp-rename');
var browserify = require('browserify');
var glob = require('glob');
var es = require('event-stream');
var gulpBabel = require('gulp-babel');
var buffer = require('vinyl-buffer');
var sourcemaps = require('gulp-sourcemaps');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var path = require('path');
var babel = require('babelify');
var imagemin = require('gulp-imagemin');        // 图片压缩
var minifycss = require('gulp-minify-css');    // css压缩
var autoprefixer = require('gulp-autoprefixer');    // css样式自动添加浏览器前缀
var htmlmin = require('gulp-htmlmin');        // html 处理
var clean = require('gulp-clean');            // 清空文件夹
var browserSync = require('browser-sync');  //浏览器自动刷新
var traceur = require('gulp-traceur');

var paths = {
    jsSrc: 'src/js/*.js',
    jsDest: 'dist/js',
    cssSrc: 'src/css/**/*.css',
    cssDest: 'dist/css',
    imgSrc: 'src/images/**/*',
    imgDest: 'dist/images',
    htmlSrc: 'src/*.html',
    htmlDest: 'dist',
    debug: 'debug',
    // Must be absolute or relative to source map
    sourceRoot: path.join(__dirname, 'src')
};

// js es6 转 es5
gulp.task('jsTransform', function (done) {
    glob(paths.jsSrc, function (err, files) {
        if (err) done(err);

        var tasks = files.map(function (entry) {
            return browserify({
                entries: [entry],
                debug: true
            }).transform(babel.configure({
                    // Use all of the ES2015 spec
                    presets: ["es2015"]
                }))
                .bundle()
                .pipe(source(entry))
                .pipe(buffer())
                // .pipe(sourcemaps.init())
                .pipe(uglify())
                .on('error', gutil.log)
                // .pipe(sourcemaps.write('./', { sourceRoot: paths.sourceRoot }))
                .pipe(rename({dirname: ''}))
                .pipe(gulp.dest(paths.jsDest));
        });
        es.merge(tasks).on('end', done);
    })
});

//css 压缩
gulp.task('minifycss',function() {
    return gulp.src(paths.cssSrc)                  //被压缩的文件
        .pipe(autoprefixer({
            browsers: ['last 3 versions', 'Android >= 4.0']
        }))
        .pipe(minifycss())                       //执行压缩
        .pipe(gulp.dest(paths.cssDest));        //输出文件夹
});

// 图片处理
gulp.task('imagemin',function(){
    return gulp.src(paths.imgSrc)
        .pipe(imagemin({
            optimizationLevel: 5, //类型：Number  默认：3  取值范围：0-7（优化等级）
            progressive: false, //类型：Boolean 默认：false 无损压缩jpg图片
            interlaced: true, //类型：Boolean 默认：false 隔行扫描gif进行渲染
            multipass: true //类型：Boolean 默认：false 多次优化svg直到完全优化
        }))
        .pipe(gulp.dest(paths.imgDest));
});

//html 处理
gulp.task('htmlmin', function () {
    var options = {
        removeComments: true,//清除HTML注释
        collapseWhitespace: true,//压缩HTML
        collapseBooleanAttributes: true,//省略布尔属性的值 <input checked="true"/> ==> <input checked />
        removeEmptyAttributes: true,//删除所有属性值为空的属性 <input id="" /> ==> <input />
        removeScriptTypeAttributes: true,//删除<script>的type="text/javascript"
        removeStyleLinkTypeAttributes: true,//删除<style>和<link>的type="text/css"
        minifyJS: true,//压缩页面JS
        minifyCSS: true//压缩页面CSS
    };
    return gulp.src(paths.htmlSrc)
        .pipe(htmlmin(options))
        .pipe(gulp.dest(paths.htmlDest));//同名的html,会直接替换
});

// clean被执行时,先清空对应目录下图片、样式、js
gulp.task('clean',function() {
    return gulp.src([paths.jsDest, paths.cssDest, paths.imgDest], {read: false})
        .pipe(clean());
});

//浏览器自动刷新
gulp.task('browser-sync', function() {
  browserSync({
    files: "**",
    server: {
        baseDir: "dist" // 指向输出目录
    }
  });
});

//watch
gulp.task('watch',function(){
    //css
    gulp.watch(paths.cssSrc, ['minifycss']);
    //js
    gulp.watch(paths.jsSrc, ['jsTransform']);
    //images
    gulp.watch(paths.imgSrc, ['imagemin']);
    //html
    gulp.watch(paths.htmlSrc, ['htmlmin']);
});

// 默认预设任务 清空图片、样式、js并重建 运行语句 gulp
gulp.task('default', ['clean'],function(){
    gulp.start('minifycss','jsTransform','imagemin','htmlmin', 'browser-sync', 'watch');
});
