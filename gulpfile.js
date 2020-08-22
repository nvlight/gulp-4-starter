// Определяем переменную "preprocessor"
let preprocessor = 'less'; // Выбор препроцессора в проекте - sass или less

// Определяем константы Gulp
const { src, dest, parallel, series, watch } = require('gulp');

// Подключаем Browsersync
const browserSync = require('browser-sync').create();

// Подключаем gulp-concat
const concat = require('gulp-concat');
 
// Подключаем gulp-uglify-es
const uglify = require('gulp-uglify-es').default;

// Подключаем модули gulp-sass и gulp-less
const sass = require('gulp-sass');
const less = require('gulp-less');

// Подключаем Autoprefixer
const autoprefixer = require('gulp-autoprefixer');
	 
// Подключаем модуль gulp-clean-css
const cleancss = require('gulp-clean-css');

// Подключаем gulp-imagemin для работы с изображениями
const imagemin = require('gulp-imagemin');
	 
// Подключаем модуль gulp-newer
const newer = require('gulp-newer');
 
// Подключаем модуль del
const del = require('del');

// Определяем логику работы Browsersync
function browsersync() {
	browserSync.init({ // Инициализация Browsersync
		server: { baseDir: 'src/' }, // Указываем папку сервера
		notify: false, // Отключаем уведомления
		online: true // Режим работы: true или false
	})
}

// первоначальная сборка скриптов 
function scripts() {
	return src([ // Берём файлы из источников
		//'node_modules/jquery/dist/jquery.min.js', // Пример подключения библиотеки
		'src/js/app.js', // Пользовательские скрипты, использующие библиотеку, должны быть подключены в конце
		])
	.pipe(concat('app.min.js')) // Конкатенируем в один файл
	.pipe(uglify()) // Сжимаем JavaScript
	.pipe(dest('src/js/')) // Выгружаем готовый файл в папку назначения
	.pipe(browserSync.stream()) // Триггерим Browsersync для обновления страницы
}

function startwatch() {
	 
	// Выбираем все файлы JS в проекте, а затем исключим с суффиксом .min.js
	watch(['src/**/*.js', '!src/**/*.min.js'], scripts);
	 
	// Мониторим файлы препроцессора на изменения
	watch('src/**/' + preprocessor + '/**/*', styles);

	// Мониторим файлы HTML на изменения
	watch('src/**/*.html').on('change', browserSync.reload);

	// Мониторим папку-источник изображений и выполняем images(), если есть изменения
	watch('src/img/src/**/*', images);
}

function styles() {
	return src('src/' + preprocessor + '/main.' + preprocessor + '') // Выбираем источник: "app/sass/main.sass" или "app/less/main.less"
	.pipe(eval(preprocessor)()) // Преобразуем значение переменной "preprocessor" в функцию
	.pipe(concat('app.min.css')) // Конкатенируем в файл app.min.js
	.pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true })) // Создадим префиксы с помощью Autoprefixer
	.pipe(cleancss( { level: { 1: { specialComments: 0 } }/* , format: 'beautify' */ } )) // Минифицируем стили
	.pipe(dest('src/css/')) // Выгрузим результат в папку "app/css/"
	.pipe(browserSync.stream()) // Сделаем инъекцию в браузер
}

function images() {
	return src('src/img/src/**/*') // Берём все изображения из папки источника
	.pipe(newer('src/img/dest/')) // Проверяем, было ли изменено (сжато) изображение ранее
	.pipe(imagemin()) // Сжимаем и оптимизируем изображеня
	.pipe(dest('src/img/dest/')) // Выгружаем оптимизированные изображения в папку назначения
}

function cleanimg() {
	return del('src/img/dest/**/*', { force: true }) // Удаляем всё содержимое папки "app/images/dest/"
}

function buildcopy() {
	return src([ // Выбираем нужные файлы
		'src/css/**/*.min.css',
		'src/js/**/*.min.js',
		'src/img/dest/**/*',
		'src/**/*.html',
		], { base: 'src' }) // Параметр "base" сохраняет структуру проекта при копировании
	.pipe(dest('dist')) // Выгружаем в папку с финальной сборкой
}

function cleandist() {
	return del('dist/**/*', { force: true }) // Удаляем всё содержимое папки "dist/"
}

// Экспортируем функцию browsersync() как таск browsersync. Значение после знака = это имеющаяся функция.
exports.browsersync = browsersync;

// Экспортируем функцию scripts() в таск scripts
exports.scripts = scripts;	

// Экспортируем функцию styles() в таск styles
exports.styles = styles;

// Экспорт функции images() в таск images
exports.images = images;

// Экспортируем функцию cleanimg() как таск cleanimg
exports.cleanimg = cleanimg;

// очистить папку dist
exports.cleandist = cleandist

// Создаём новый таск "build", который последовательно выполняет нужные операции
exports.build = series(cleandist, styles, scripts, images, buildcopy);

// Экспортируем дефолтный таск с нужным набором функций
exports.default = parallel(scripts, styles, browsersync, startwatch);