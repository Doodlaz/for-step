'use strict';

const PROJECT_NAME = 'ProjectName';                                           // Указываем название нашего проекта

const gulp = require('gulp');                                                 // Подключаем Gulp
const sass = require('gulp-sass');                                            // для компиляции sass/scss => css
const path = require('path');
const jade = require('gulp-jade');                                            // для компиляции jade => html
const pug = require('gulp-pug');                                              // для компиляции pug => html
const uglify = require('gulp-uglifyjs');                                      // для минимизирования js файлов
const babel = require('gulp-babel');                                          // ES6 => ES5
const sourcemaps = require('gulp-sourcemaps');                                // для создания сорсмапов js и css файлов
const autoprefixer = require('gulp-autoprefixer');                            // для для добавления префиксов в css
const svgSprite = require("gulp-svg-sprite");                                 // для создания svg спрайтов
const rename = require('gulp-rename');                                        // для переименования файлов
const imagemin = require('gulp-imagemin');                                    // для работы с изображениями
const pngquant = require('imagemin-pngquant');                                // для работы с png
const cache = require('gulp-cache');                                          // кеширования
const browserSync = require('browser-sync').create();                         // Создание сервера
const concat = require('gulp-concat');                                        // для конкатенации файлов
const notify = require('gulp-notify');                                        // Уведомление об ошибках
const remember = require('gulp-remember');
const resolver = require('stylus').resolver;                                  // Запоминаем путь для картинок
const gulpIf = require('gulp-if');                                            // Для использование оператора if else
const rimraf = require('rimraf');                                             // для удаление папок/файлов
const changed = require('gulp-changed');                                      // Для проверки на изменения файла
const isDev = !process.env.NODE_ENV || process.env.NODE_ENV == 'development'; // Определяем продакшен или девелопмент

const webpack = require('gulp-webpack');
const gutil = require('gulp-util');

const streamSass = false;                                                     // Запускаем стрим за scss/sass/css файлами и без перезагрузки браузера выводим изменения
const singleReload = false;                                                   // Запускаем релоад браузера при изменениях jade/img/js/libs, актуально использовать с streamSass
const globalReload = false;                                                   // Запускаем релоад браузера при любых изменениях, актуально без streamSass и singleReload

const paths = {                                                               // Создаём обьект для удобного редактирования всех путей в нашем проекте
  build: {                                                                    // Пути нашего билда
    html: './dist/',
    js: './dist/js/',
    css: './dist/css/',
    img: './dist/img/',
    fonts: './dist/fonts/',
    favicons: './dist/'
  },
  src: {                                                                      // Пути наших сорсов
    pug: './sources/views/*.pug',
    js: './sources/js/**/*.js',
    libsDir: './sources/js/libs/*.js',
    libs: './sources/libs/*.js',                                              // Собераем все js библиотеки в libs.min.js
    style: './sources/styles/**/**/**/*.{sass,scss,css}',
    img: './sources/img/**/**/**/*.{jpg,png,gif,svg,jpeg,mp4}',
    fonts: './sources/fonts/**/**/**/*.{ttf,woff,woff2,eot,svg}',
    favicons: './sources/favicons/*'
  },
  clean: {                                                                    // Пути которые мы очищаем перед компиляцией
    html: './dist/*.html',
    js: './dist/js',
    css: './dist/css',
    img: './dist/img',
    fonts: './dist/fonts',
    all: './dist',
  }
};

const serverConfig = {                                                         // Конфиг для сервера
  server: {
    baseDir: paths.build.html                                               // Указываем дирикторию которая будет корнем нашего сервера
  },
  tunnel: false,                                                      // Отключаем тунель (https://site.localtunnel.me)
  host: 'localhost',                                                // Указываем хост, указываем - localhost
  port: 3000,                                                       // Указываем порт, указываем - 3000
  logPrefix: PROJECT_NAME,                                               // Указываем название нашего проекта
  open: "local",                                                    // Указываем что нам открывать по стандарту
  ghostMode: {
    clicks: false,                                                      // Отключаем трансляцию кликов
    forms: false,                                                      // Отключаем инпуты
    scroll: false                                                       // Отключаем трансляцию скролла
  },
  logFileChanges: false,                                                      // Отключаем лог изменения файлов
  logSnippet: false,                                                      // Отключаем лог снипитов
  online: false,                                                      // Отключаем статус
  ui: false,                                                      // Отключаем пользовательский интерфейс
  notify: false                                                       // Отключаем уведомления в браузере
};

/********************************************************************************
 * {sass,scss,css} & sourcemaps
 ********************************************************************************/
gulp.task('sass', () => {                                                       // Компилируем sass/scss в css
  return gulp.src(paths.src.style)                                            // Выберем файлы по нужному пути
    .pipe(gulpIf(isDev, sourcemaps.init()))                                 // Инициализируем sourcemap
    .pipe(sass({                                                            // Найтройки sass/scss
      outputStyle: 'compressed',
      define: {url: resolver()}
    }).on('error', notify.onError()))
    .pipe(autoprefixer('last 3 version', '> 1%', 'IE 9', {cascade: true}))// Найтройки autoprefixer
    .pipe(gulpIf(isDev, sourcemaps.write('./')))                            // Записываем sourcemap
    .pipe(gulp.dest(paths.build.css))                                       // Выгружаем готовые css файлы в папку указаную в paths.build.css
    .pipe(gulpIf(streamSass, browserSync.stream()));
});

/********************************************************************************
 * pug
 ********************************************************************************/
gulp.task('pug', () => {                                                       // Компилируем pug в html
  return gulp.src(paths.src.pug)                                             // Выберем файлы по нужному пути
    .pipe(pug({pretty: true})).on('error', notify.onError())              // Найтройки pug
    .pipe(gulp.dest(paths.build.html))                                      // Выгружаем готовый html в папку указаную в paths.build.html
    .pipe(gulpIf(singleReload, browserSync.stream()));
});

/********************************************************************************
 * images
 ********************************************************************************/
gulp.task('img', () => {                                                        // Копирование и оптимизация всех изображение
  return gulp.src(paths.src.img)                                              // Берем все изображения
    .pipe(cache(imagemin({                                                  // Сжимаем их с наилучшими настройками с учетом кеширования
      interlaced: true,
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
      use: [pngquant()]
    })))
    .pipe(gulp.dest(paths.build.img))                                       // Выгружаем готовые картинки в папку указаную в paths.build.img
    .pipe(gulpIf(singleReload, browserSync.stream()));
});

/********************************************************************************
 * javascript libraries
 ********************************************************************************/
gulp.task('libs', () => {                                                       // Создание минимизированого файла(libs.min.js) состоящих из js библиотек которые находятся sources/libs
  return gulp.src(paths.src.libs)                                             // Выберем файлы по нужному пути
    .pipe(concat('libs.min.js'))                                            // Собираем их в кучу в новом файле libs.min.js
    .pipe(babel({
      presets: ['env']
    }))
    .pipe(uglify())                                                         // Сжимаем JS файл
    .pipe(gulp.dest(paths.build.js))                                        // Выгружаем в папку указаную в paths.build.js
    .pipe(gulpIf(singleReload, browserSync.stream()));
});

/********************************************************************************
 * custom javascript
 ********************************************************************************/
gulp.task('javascript', function () {
  return gulp.src(['sources/js/core.js', 'sources/js/modules/**/*.js'])
    .pipe(webpack(require('./webpack.config.js')))
    .on('error', gutil.log)
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest(paths.build.js));
});

/********************************************************************************
 * svg-sprite html
 ********************************************************************************/
gulp.task('svg', () => {                                                        // Создания svg-symbol спрайта который вставляется в html и вызывается с помощью use
  return gulp.src(['./sources/svgs/html/*.svg'])
    .pipe(svgSprite({                                                       // Найтройки svg symbol
      mode: {
        symbol: {
          dist: './',
          inline: false,
          sprite: './svg-sprite.svg'
        }
      }
    }))
    .on('error', (error) => {
      console.log(error);
    })
    .pipe(gulp.dest(paths.build.img));                                      // Выгружаем в папку указаную в paths.build.img
});

/********************************************************************************
 * svg-sprite css
 ********************************************************************************/
gulp.task('svg-css', () => {                                                    // Создания свг спрайта из свг файлов которые находятся sources/svgs/css
  return gulp.src(['./sources/svgs/css/*.svg'])
    .pipe(svgSprite({                                                       // Найтройки svg sprite
      mode: {
        css: {
          dest: '.',
          sprite: 'svg-sprite.svg',
          layout: 'vertical',
          prefix: '.i-',
          dimensions: true,
          render: {
            scss: {
              dest: '_sprite.scss'
            }
          }
        }
      }
    }))
    .on('error', (error) => {
      console.log(error);
    })
    .pipe(gulpIf('*.scss', gulp.dest('./sources/styles/003-patterns'), gulp.dest(paths.build.css)));
});

/********************************************************************************
 * clean
 ********************************************************************************/
gulp.task('clean', cb => {                                                    // Удаление всех билдов перед новой компиляцией
  let cl = paths.clean;
  rimraf(cl.all, cb);
});

/********************************************************************************
 * watch
 ********************************************************************************/

gulp.task('watch', () => {                                                      // Запуска вотчера (gulp watch)

  let filepath = (filepath) => {
    remember.forget('svg-css', path.resolve(filepath));
  }, src = paths.src;

  gulp.watch([src.style], gulp.series('sass')).on('unlink', filepath);
  gulp.watch(['./sources/views/**/*.pug'], gulp.series('pug')).on('unlink', filepath);
  gulp.watch([src.img], gulp.series('img')).on('unlink', filepath);
  gulp.watch([src.js], gulp.series('javascript')).on('unlink', filepath);
  gulp.watch(['./sources/svgs/html/*.svg'], gulp.series('svg')).on('unlink', filepath);
  gulp.watch(['./sources/svgs/css/*.svg'], gulp.series('svg-css')).on('unlink', filepath);

});

/********************************************************************************
 * Copy files/folders
 ********************************************************************************/
gulp.task('copy', () => {                                                       // Копирования файлов (gulp copy)
  return gulp.src(paths.src.fonts)                                            // Выберем файлы по нужному пути
    .pipe(gulp.dest(paths.build.fonts))                                     // Выгружаем шрифты в папку указаную в paths.build.fonts
});

/********************************************************************************
 * Copy files/folders
 ********************************************************************************/
gulp.task('favicons', () => {                                                       // Копирования файлов (gulp copy)
  return gulp.src(paths.src.favicons)                                            // Выберем файлы по нужному пути
    .pipe(gulp.dest(paths.build.favicons))                                     // Выгружаем шрифты в папку указаную в paths.build.fonts
});

/*******************************************************************************
 * build
 *******************************************************************************/
gulp.task('build', gulp.series(                                                // Таска для создания билдов
  'clean',
  gulp.parallel('javascript', 'libs', 'svg', 'svg-css', 'img'), 'sass', 'pug', 'copy', 'favicons'),
  'watch'
);

/********************************************************************************
 * server start
 ********************************************************************************/
gulp.task('server', () => {                                                     // Таска для запуска сервера (gulp server)
  browserSync.init(serverConfig);                                             // Запускаем сервер с переменной в которой указан конфиг
});

/********************************************************************************
 * default
 ********************************************************************************/
gulp.task('default', gulp.series('build',                                       // Дефолтная таска для билдинга, запуска сервера и вотчера (gulp)
  gulp.parallel('watch', 'server'))
);