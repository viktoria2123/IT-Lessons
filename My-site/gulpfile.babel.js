
const { src, dest, watch, parallel } = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const miniFycss = require('gulp-clean-css');
const sourceMap = require('gulp-sourcemaps');
const cleanCSS = require('gulp-clean-css');
const concat = require('gulp-concat');
const connect = require('gulp-connect');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const jshint = require('gulp-jshint');
const open = require('gulp-open');
const fileinclude = require('gulp-file-include');
const del = require('del');
const changed = require('gulp-changed');
const imagemin = require('gulp-imagemin');
const autoprefixer = require('gulp-autoprefixer');
const mode = require('gulp-mode')();
const htmlmin = require('gulp-htmlmin');

//шлях до папок
const localServer = {
  src: 'src/',
  assets: './src/assets/',
  out: './dist/',
  port: 9099,
  url: 'http://localhost:',
}

// Просто додає html в папку dist/ і додає include щоб можна було писати відносний шлях до файлів і ще багато чтого читати тут https://www.npmjs.com/package/gulp-file-include
function html() {
  return src(`${localServer.src}**/*.html`)
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(mode.production(htmlmin({ collapseWhitespace: true, removeComments: true, }))) //видаляє коментарі при Білд сборці
    .pipe(dest(localServer.out))
    .pipe(connect.reload());
};

//функція яка всі css файли додає в 1 і компілює scss в css і сжимає його
function css() {
  return src(`${localServer.assets}sass/main.scss`)
    .pipe(sourceMap.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(mode.production(miniFycss()))
    .pipe(sourceMap.write())
    .pipe(autoprefixer({ overrideBrowserslist: ['IE 6', 'Chrome 9', 'Firefox 14'] }))
    .pipe(mode.production(cleanCSS({ compatibility: 'ie8' })))
    .pipe(concat('bundle.min.css'))
    .pipe(dest(`${localServer.out}`))
    .pipe(connect.reload());
};

//функція яка додає JS файл в папку dist/ і робить всі плюшки ES6 плюс сжимає файл
function js() {
  return src(`${localServer.assets}**/*.js`)
    .pipe(changed(`${localServer.out}js/*.js`))
    .pipe(sourceMap.init())
    .pipe(babel({
      presets: ['@babel/preset-env', "@babel/react"],
      plugins: ["@babel/plugin-proposal-class-properties"]
    }))
    // .pipe(concat('index.min.js')) //Якшо потрібно все деплоїти в один файлік
    .pipe(mode.production(uglify()))
    .pipe(sourceMap.write('.'))
    .pipe(dest(`${localServer.out}/`));
}

//Функція лінт яка показує помилки якшо вони є
function lint() {
  return src(`${localServer.assets}js/*.js`)
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
}

//Функція яказа закидуе картинки в папку dist/ і ії сжимає автоматом
function img() {
  return src(`${localServer.assets}img/**/*`)
    .pipe(changed(`${localServer.out}img/`))
    .pipe(imagemin())
    .pipe(dest(`${localServer.out}/img`))
};

//Ватч функція яка слідкуя за зміною в файлах в лайв режимі
function gulpWatch() {
  watch(`${localServer.src}**/*.html`, html);
  watch(`${localServer.assets}sass/**/*.scss`, css);
  watch(`${localServer.assets}js/**/*.js`, js);
  watch(`${localServer.assets}img/**/*`, img);
}
//Функція яка очіщає папку dist/ кожного разу коли ви стартуете npm start це щоб чистити кеш
function clean() {
  return del([`${localServer.out}**`, `${!localServer.out}`])
}
//Це локальний сервак
function server() {
  return connect.server({
    port: localServer.port,
    root: localServer.out,
    livereload: true,
  })
}
//Автоматов відкриває в браузері, по дефолту я не додавай в exports.dev
function openLocal() {
  return src(`${localServer.out}index.html`)
    .pipe(open({ uri: `${localServer.url}${localServer.port}/` }))
}

setTimeout(openLocal, 2000); //Відкриває автоматов в браузері

exports.dev = parallel(clean, server, html, css, js, img, gulpWatch); //тут послідовність функцій які запускаются, наприклад ви можете додати щоб автоматом браузер відкривався openLocal


