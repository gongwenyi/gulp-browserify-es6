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
var imagemin = require('gulp-imagemin'); // 图片压缩
var minifycss = require('gulp-minify-css'); // css压缩
var autoprefixer = require('gulp-autoprefixer'); // css样式自动添加浏览器前缀
var htmlmin = require('gulp-htmlmin'); // html 处理
var clean = require('gulp-clean'); // 清空文件夹
var browserSync = require('browser-sync'); //浏览器自动刷新
var size = require('gulp-size'); // 文件大小显示
var watchify = require('watchify'); // 使用 watchify 提高 js 打包速率（只更新当前修改的文件）
var assign = require('lodash.assign');
var sass = require('gulp-sass'); // 使用 sass
var less = require('gulp-less'); // 使用 less
var concat = require('gulp-concat'); // 合并文件
var base64 = require('gulp-css-base64'); // css 图片转换成 base64

var paths = {
  jsEntry: 'src/js/entry.js',
  jsSrc: 'src/js/**/*.js',
  jsDest: 'dist/js',
  cssSrc: 'src/css/**/*.css',
  scssSrc: 'src/css/**/*.scss',
  lessSrc: 'src/css/**/*.less',
  cssDest: 'dist/css',
  imgSrc: 'src/images/**/*',
  imgDest: 'dist/images',
  htmlSrc: 'src/*.html',
  htmlDest: 'dist',
  debug: 'debug',
  // Must be absolute or relative to source map
  sourceRoot: path.join(__dirname, 'src'),
};

// ===== es6 转 es5, 并且压缩 ======
// 在这里添加自定义 browserify 选项
var customOpts = {
  entries: [paths.jsEntry],
  debug: true,
};
var opts = assign({}, watchify.args, customOpts);
var jsWatch = watchify(browserify(opts));

gulp.task('jsTransform', bundle); // es6 转 es5
jsWatch.on('update', bundle); // 当任何依赖发生改变的时候，运行打包工具
jsWatch.on('log', gutil.log); // 输出编译日志到终端

function bundle(event) {
  if (Array.isArray(event) && event[0]) console.log('>>>>>>>>>>>>>>>>>>>>>  ' + event[0].match(/\\src\\.*$/)[0] + ' was changed' + ', file is reloading...');
  return jsWatch.transform(babel.configure({
      presets: ["es2015"], // Use all of the ES2015 spec
    }))
    .bundle()
    .pipe(source(paths.jsEntry))
    .pipe(buffer())
    .pipe(uglify())
    .on('error', gutil.log)
    // .pipe(sourcemaps.init({loadMaps: true})) // 从 browserify 文件载入 map
    // .pipe(sourcemaps.write('./')) // 写入 .map 文件
    .pipe(rename({dirname: ''}))
    .pipe(gulp.dest(paths.jsDest))
    .pipe(size({ title : '===== js =====' }));
}

var AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

// ===== css 压缩 ======
gulp.task('minifycss', function() {
  return gulp.src(paths.cssSrc) //被压缩的文件
    .pipe(base64())
    .pipe(autoprefixer({
      browsers: ['last 3 versions', 'Android >= 4.0'],
    }))
    .pipe(concat('appCss.css'))
    .pipe(minifycss()) //执行压缩
    .pipe(gulp.dest(paths.cssDest)) //输出文件夹
    .pipe(size({ title : '===== css =====' }));
});

// ===== less 转换并压缩 ======
gulp.task('minifyless', function() {
  return gulp.src(paths.lessSrc) // 被转换的less的文件
    .pipe(less()) // 先把less文件转换成css文件
    .pipe(autoprefixer({
      browsers: ['last 3 versions', 'Android >= 4.0'],
    }))
    .pipe(concat('appLess.css'))
    .pipe(minifycss()) //再压缩转换后的css文件
    .pipe(gulp.dest(paths.cssDest)) //输出文件夹
    .pipe(size({ title : '===== less =====' }));
});

// ===== sass 转换并压缩 ======
gulp.task('minifysass', function() {
  return gulp.src(paths.scssSrc) // 被转换的scss的文件
    .pipe(sass().on('error', sass.logError)) // 先把scss文件转换成css文件
    .pipe(autoprefixer({
      browsers: ['last 3 versions', 'Android >= 4.0'],
    }))
    .pipe(concat('appSass.css'))
    .pipe(minifycss()) //再压缩转换后的css文件
    .pipe(gulp.dest(paths.cssDest)) //输出文件夹
    .pipe(size({ title : '===== sass =====' }));
});

// ===== 图片处理 ======
gulp.task('imagemin', function(){
  return gulp.src(paths.imgSrc)
    .pipe(imagemin({
      optimizationLevel: 5, //类型：Number  默认：3  取值范围：0-7（优化等级）
      progressive: false, //类型：Boolean 默认：false 无损压缩jpg图片
      interlaced: true, //类型：Boolean 默认：false 隔行扫描gif进行渲染
      multipass: true, //类型：Boolean 默认：false 多次优化svg直到完全优化
    }))
    .pipe(gulp.dest(paths.imgDest))
    .pipe(size({ title : '===== image =====' }));
});

// ===== html 处理 ======
gulp.task('htmlmin', function () {
  var options = {
    removeComments: true, // 清除HTML注释
    collapseWhitespace: true, // 压缩HTML
    collapseBooleanAttributes: true, // 省略布尔属性的值 <input checked="true"/> ==> <input checked />
    removeEmptyAttributes: true, // 删除所有属性值为空的属性 <input id="" /> ==> <input />
    removeScriptTypeAttributes: true, // 删除<script>的type="text/javascript"
    removeStyleLinkTypeAttributes: true, // 删除<style>和<link>的type="text/css"
    minifyJS: true, // 压缩页面JS
    minifyCSS: true, // 压缩页面CSS
  };
  return gulp.src(paths.htmlSrc)
    .pipe(htmlmin(options))
    // .pipe(base64())
    .pipe(gulp.dest(paths.htmlDest)) // 同名的html,会直接替换
    .pipe(size({ title : '===== html =====' }));
});

// ===== 打包前先清空相应的目录 ======
gulp.task('clean', function() {
  return gulp.src([paths.htmlDest, paths.jsDest, paths.cssDest, paths.imgDest], { read: false })
    .pipe(clean());
});

// ===== 浏览器自动刷新 ======
gulp.task('browser-sync', function() {
  browserSync({
    port: 8086,
    files: "**",
    server: {
      baseDir: "dist", // 指向输出目录
    },
  });
});

// ===== 监视文件的变化并刷新文件 ======
gulp.task('watch', function(){
  //css
  gulp.watch(paths.cssSrc, ['minifycss'])
    .on('change', function (event) {
      console.log('>>>>>>>>>>>>>>>>>>>>>  ' + event.path.match(/\\src\\.*$/)[0] + ' was ' + event.type + ', file is reloading...');
    });
  //less
  gulp.watch(paths.lessSrc, ['minifyless'])
    .on('change', function (event) {
      console.log('>>>>>>>>>>>>>>>>>>>>>  ' + event.path.match(/\\src\\.*$/)[0] + ' was ' + event.type + ', file is reloading...');
    });
  //less
  gulp.watch(paths.scssSrc, ['minifysass'])
    .on('change', function (event) {
      console.log('>>>>>>>>>>>>>>>>>>>>>  ' + event.path.match(/\\src\\.*$/)[0] + ' was ' + event.type + ', file is reloading...');
    });
  //images
  gulp.watch(paths.imgSrc, ['imagemin'])
    .on('change', function (event) {
      console.log('>>>>>>>>>>>>>>>>>>>>>  ' + event.path.match(/\\src\\.*$/)[0] + ' was ' + event.type + ', file is reloading...');
    });
  //html
  gulp.watch(paths.htmlSrc, ['htmlmin'])
    .on('change', function (event) {
      console.log('>>>>>>>>>>>>>>>>>>>>>  ' + event.path.match(/\\src\\.*$/)[0] + ' was ' + event.type + ', file is reloading...');
    });
});

// ===== 默认预设任务 清空图片、样式、js并重建 运行语句 gulp ======
gulp.task('default', ['clean'], function(){
  gulp.start('minifycss', 'minifyless', 'minifysass', 'jsTransform', 'imagemin', 'htmlmin', 'browser-sync', 'watch');
});






// // js es6 转 es5
// gulp.task('jsTransform', function (done) {
//   return browserify({
//     entries: [paths.jsEntry],
//     debug: true
//   }).transform(babel.configure({
//       // Use all of the ES2015 spec
//       presets: ["es2015"]
//     }))
//     .bundle()
//     .pipe(source(paths.jsEntry))
//     .pipe(buffer())
//     // .pipe(sourcemaps.init())
//     .pipe(uglify())
//     .on('error', gutil.log)
//     // .pipe(sourcemaps.write('./', { sourceRoot: paths.sourceRoot }))
//     .pipe(rename({dirname: ''}))
//     .pipe(gulp.dest(paths.jsDest))
//     .pipe(size());

// });

// //css 压缩
// gulp.task('minifycss', function() {
//   return gulp.src(paths.cssSrc)          //被压缩的文件
//     .pipe(autoprefixer({
//       browsers: ['last 3 versions', 'Android >= 4.0']
//     }))
//     .pipe(minifycss())             //执行压缩
//     .pipe(gulp.dest(paths.cssDest)) //输出文件夹
//     .pipe(size());
// });

// // 图片处理
// gulp.task('imagemin', function(){
//   return gulp.src(paths.imgSrc)
//     .pipe(imagemin({
//       optimizationLevel: 5, //类型：Number  默认：3  取值范围：0-7（优化等级）
//       progressive: false, //类型：Boolean 默认：false 无损压缩jpg图片
//       interlaced: true, //类型：Boolean 默认：false 隔行扫描gif进行渲染
//       multipass: true //类型：Boolean 默认：false 多次优化svg直到完全优化
//     }))
//     .pipe(gulp.dest(paths.imgDest))
//     .pipe(size());
// });

// //html 处理
// gulp.task('htmlmin', function () {
//   var options = {
//     removeComments: true,//清除HTML注释
//     collapseWhitespace: true,//压缩HTML
//     collapseBooleanAttributes: true,//省略布尔属性的值 <input checked="true"/> ==> <input checked />
//     removeEmptyAttributes: true,//删除所有属性值为空的属性 <input id="" /> ==> <input />
//     removeScriptTypeAttributes: true,//删除<script>的type="text/javascript"
//     removeStyleLinkTypeAttributes: true,//删除<style>和<link>的type="text/css"
//     minifyJS: true,//压缩页面JS
//     minifyCSS: true//压缩页面CSS
//   };
//   return gulp.src(paths.htmlSrc)
//     .pipe(htmlmin(options))
//     .pipe(gulp.dest(paths.htmlDest)) //同名的html,会直接替换
//     .pipe(size());
// });

// // clean被执行时,先清空对应目录下图片、样式、js
// gulp.task('clean', function() {
//   return gulp.src([paths.htmlDest, paths.jsDest, paths.cssDest, paths.imgDest], {read: false})
//     .pipe(clean());
// });

// //浏览器自动刷新
// gulp.task('browser-sync', function() {
//   browserSync({
//     files: "**",
//     server: {
//       baseDir: "dist" // 指向输出目录
//     }
//   });
// });

// //watch
// gulp.task('watch',function(){
//   //css
//   gulp.watch(paths.cssSrc, ['minifycss']).on('change', function (event) {
//     console.log('>>>>>>>>>>>>>>>>>>>>>  ' + event.path.match(/\\src\\.*$/)[0] + ' was ' + event.type + ', file is reloading...');
//   });
//   //js
//   gulp.watch(paths.jsSrc, ['jsTransform']).on('change', function (event) {
//     console.log('>>>>>>>>>>>>>>>>>>>>>  ' + event.path.match(/\\src\\.*$/)[0] + ' was ' + event.type + ', file is reloading...');
//   });
//   //images
//   gulp.watch(paths.imgSrc, ['imagemin']).on('change', function (event) {
//     console.log('>>>>>>>>>>>>>>>>>>>>>  ' + event.path.match(/\\src\\.*$/)[0] + ' was ' + event.type + ', file is reloading...');
//   });
//   //html
//   gulp.watch(paths.htmlSrc, ['htmlmin']).on('change', function (event) {
//     console.log('>>>>>>>>>>>>>>>>>>>>>  ' + event.path.match(/\\src\\.*$/)[0] + ' was ' + event.type + ', file is reloading...');
//   });
// });

// // 默认预设任务 清空图片、样式、js并重建 运行语句 gulp
// gulp.task('default', ['clean'], function(){
//   gulp.start('minifycss','jsTransform','imagemin','htmlmin', 'browser-sync', 'watch');
// });
