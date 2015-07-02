'use strict';

var gulp      = require('gulp'),
	bowerFiles  = require('main-bower-files'),
	stylish     = require('jshint-stylish'),
	path        = require('path'),
	open        = require('open'),
	fs          = require('fs'),
	chalk       = require('chalk'),
	args        = require('yargs').argv,
	map         = require('map-stream'),
	browserSync = require('browser-sync'),
	runSequence = require('run-sequence'),
	bb          = require('bitballoon'),
	awspublish  = require('gulp-awspublish'),
	ngConstant  = require('gulp-ng-constant'),
	gulpPlugins = require('gulp-load-plugins')(),
	replace     = require('gulp-replace'),
	insert      = require('gulp-insert'),
	revall      = require('gulp-rev-all'),
	coffee      = require('gulp-coffee'),
	coffeelint  = require('gulp-coffeelint'),
	gettext     = require('gulp-angular-gettext');

// chalk config
var errorLog = chalk.red.bold,
	hintLog    = chalk.blue,
	changeLog  = chalk.red;

var	SETTINGS = {
	src: {
		app:          'app/',
		css:          'app/css/',
		js:           'app/js/',
		templates:    'app/templates/',
		images:       'app/img/',
		fonts:        'app/fonts/',
		translations: 'app/js/translations/',
		bower:        'bower_components/',
		po:           'app/po/'
	},
	build: {
		app:          'build/',
		css:          'build/css/',
		js:           'build/js/',
		templates:    'build/templates/',
		images:       'build/img/',
		fonts:        'build/fonts/',
		translations: 'build/js/translations/',
		bower:        'build/bower/' // If you change this, you will have to change in index.html as well.
	},
	cdn:  'cdn/',
	scss: 'scss/'
};

var bowerConfig = {
	paths: {
		bowerDirectory: SETTINGS.src.bower,
		bowerrc: '.bowerrc',
		bowerJson: 'bower.json'
	}
};

//server and live reload config
var serverConfig = {
	root: SETTINGS.build.app,
	host: 'localhost',
	port: 9000,
	livereload: true
};

// jsHint Options.
var hintOptions = JSON.parse(fs.readFileSync('.jshintrc', 'utf8'));

// Flag for production.
var isProduction = args.type === 'production';

/*============================================================
=>                          Server
============================================================*/

gulp.task('server', function () {

	console.log('------------------>>>> firing server  <<<<-----------------------');
	gulpPlugins.connect.server(serverConfig);
	
	console.log('Started connect web server on http://localhost:' + serverConfig.port + '.');
	open('http://localhost:' + serverConfig.port);
});

gulp.task('tasks', gulpPlugins.taskListing);


/*============================================================
=                           Config                           =
============================================================*/

gulp.task('config', function () {
	var config_src = isProduction ? 'config/production.json' : 'config/development.json';
	var stream = gulp.src(config_src)
		.pipe(ngConstant({
			name: 'config',
			dest: 'config.js'
		}))
		.pipe(replace('angular.', '/*global angular*/\nangular.'))
		.pipe(replace('"', '\''))
		.pipe(gulp.dest(SETTINGS.src.js));
	return stream;
});

/*============================================================
=                           JS-HINT                          =
============================================================*/

gulp.task('js:hint', function () {

	console.log('-------------------------------------------------- JS - HINT');
	var stream = gulp.src([SETTINGS.src.js + 'app.js', '!' + SETTINGS.src.js + 'plugins/*.js', SETTINGS.src.js + '**/*.js', 'gulpfile.js'])
		.pipe(gulpPlugins.jshint(hintOptions))
		.pipe(gulpPlugins.jshint.reporter(stylish));
	return stream;
});


/*============================================================
=                           Concat                           =
============================================================*/

gulp.task('concat', ['concat:bower', 'concat:js', 'concat:css']);


gulp.task('concat:bower', function () {
	console.log('-------------------------------------------------- CONCAT :bower');

	var jsFilter = gulpPlugins.filter('**/*.js'),
		cssFilter = gulpPlugins.filter('**/*.css'),
		assetsFilter = gulpPlugins.filter(['!**/*.js', '!**/*.css', '!**/*.scss']);

	var stream = gulp.src(bowerFiles(bowerConfig), {base: SETTINGS.src.bower})
		.pipe(jsFilter)
		.pipe(gulpPlugins.concat('_bower.js'))
		.pipe(gulpPlugins.if(isProduction, gulpPlugins.uglify()))
		.pipe(gulp.dest(SETTINGS.build.bower))
		.pipe(jsFilter.restore())
		.pipe(cssFilter)
		.pipe(gulpPlugins.sass())
		.pipe(map(function (file, callback) {
			var relativePath = path.dirname(path.relative(path.resolve(SETTINGS.src.bower), file.path));

			// CSS path resolving
			// Taken from https://github.com/enyojs/enyo/blob/master/tools/minifier/minify.js
			var contents = file.contents.toString().replace(/url\([^)]*\)/g, function (match) {
				// find the url path, ignore quotes in url string
				var matches = /url\s*\(\s*(('([^']*)')|("([^"]*)")|([^'"]*))\s*\)/.exec(match),
					url = matches[3] || matches[5] || matches[6];

				// Don't modify data and http(s) urls
				if (/^data:/.test(url) || /^http(:?s)?:/.test(url)) {
					return 'url(' + url + ')';
				}
				return 'url(' + path.join(path.relative(SETTINGS.build.bower, SETTINGS.build.app), SETTINGS.build.bower, relativePath, url) + ')';
			});
			file.contents = new Buffer(contents);

			callback(null, file);
		}))
		.pipe(gulpPlugins.concat('_bower.css'))
		.pipe(gulpPlugins.if(isProduction, gulpPlugins.minifyCss({keepSpecialComments: '*'})))
		.pipe(gulp.dest(SETTINGS.build.bower))
		.pipe(cssFilter.restore())
		.pipe(assetsFilter)
		.pipe(gulp.dest(SETTINGS.build.bower))
		.pipe(assetsFilter.restore())
		.pipe(gulpPlugins.connect.reload());
	return stream;
});

gulp.task('concat:js', ['js:hint'], function () {

	console.log('-------------------------------------------------- CONCAT :js');
	var scriptFilter = gulpPlugins.filter(['**/*.coffee', '*.coffee', '**/*.js', '*.js']),
		coffeeFilter = gulpPlugins.filter(['**/*.coffee', '*.coffee']);

	gulp.src([SETTINGS.src.js + 'plugins/*', SETTINGS.src.js + 'app.*', SETTINGS.src.js + '*', SETTINGS.src.js + '**/*'])
		.pipe(coffeeFilter)
		.pipe(coffeelint())
		.pipe(coffeelint.reporter())
		.pipe(coffee({bare: true}))
		.pipe(coffeeFilter.restore())
		.pipe(scriptFilter)
		.pipe(gulpPlugins.concat('all.js'))
		.pipe(gulpPlugins.if(isProduction, gulpPlugins.uglify()))
		.pipe(gulp.dest(SETTINGS.build.js))
		.pipe(scriptFilter.restore())
		.pipe(gulpPlugins.connect.reload());
});

gulp.task('convert:scss', function () {
	console.log('-------------------------------------------------- COVERT - scss');

	// Callback to show sass error
	var showError = function (err) {
		console.log(errorLog('\n SASS file has error clear it to see changes, see below log ------------->>> \n'));
		console.log(errorLog(err));
	};

	var stream = gulp.src(SETTINGS.src.css + 'application.scss')
		.pipe(gulpPlugins.sass({includePaths: [SETTINGS.src.css], onError: showError}))
		.pipe(gulp.dest(SETTINGS.scss))
		.pipe(gulpPlugins.connect.reload());
	return stream;
});

gulp.task('concat:css', ['convert:scss'], function () {

	console.log('-------------------------------------------------- CONCAT :css ');
	gulp.src([SETTINGS.src.css + 'fonts.css', SETTINGS.scss + 'application.css', SETTINGS.src.css + '*.css'])
		.pipe(gulpPlugins.concat('styles.css'))
		.pipe(gulpPlugins.if(isProduction, gulpPlugins.minifyCss({keepSpecialComments: '*'})))
		.pipe(gulp.dest(SETTINGS.build.css))
		.pipe(gulpPlugins.connect.reload());
});


/*============================================================
=                          Gettext                           =
============================================================*/

gulp.task('pot', function () {
	var stream = gulp.src(['app/templates/**/*.html', 'app/js/controllers/*.js', 'app/js/controllers/*.coffee'])
		.pipe(gettext.extract('template.pot'))
		.pipe(gulp.dest(SETTINGS.src.po));

	return stream;
});

gulp.task('translations', function () {
	var stream = gulp.src(SETTINGS.src.po + '**/*.po')
		.pipe(gettext.compile())
		.pipe(insert.prepend('/* jshint ignore:start */\n'))
		.pipe(insert.append('\n/* jshint ignore:end */'))
		.pipe(gulp.dest(SETTINGS.src.translations));

	return stream;
});


/*============================================================
=                          Minify                            =
============================================================*/

gulp.task('image:min', function () {
	gulp.src(SETTINGS.src.images + '**')
		.pipe(gulpPlugins.imagemin())
		.pipe(gulp.dest(SETTINGS.build.images))
		.pipe(gulpPlugins.connect.reload());
});


/*============================================================
=                           Copy                             =
============================================================*/

gulp.task('copy', ['copy:html', 'copy:images', 'copy:fonts', 'copy:html:root']);


gulp.task('copy:html', function () {
	
	console.log('-------------------------------------------------- COPY :html');
	gulp.src([SETTINGS.src.templates + '*.html', SETTINGS.src.templates + '**/*.html'])
		.pipe(gulpPlugins.if(isProduction, gulpPlugins.minifyHtml({comments: false, quotes: true, spare: true, empty: true, cdata: true})))
		.pipe(gulp.dest(SETTINGS.build.templates))
		.pipe(gulpPlugins.connect.reload());
});

gulp.task('copy:html:root', function () {
	
	console.log('-------------------------------------------------- COPY :html:root');
	gulp.src(SETTINGS.src.app + '*.html')
		.pipe(gulpPlugins.if(isProduction, gulpPlugins.minifyHtml({comments: false, quotes: true, spare: true, empty: true, cdata: true})))
		.pipe(gulp.dest(SETTINGS.build.app))
		.pipe(gulpPlugins.connect.reload());
});

gulp.task('copy:images', function () {

	console.log('-------------------------------------------------- COPY :images');
	gulp.src([SETTINGS.src.images + '*.*', SETTINGS.src.images + '**/*.*'])
		.pipe(gulp.dest(SETTINGS.build.images));
});

gulp.task('copy:fonts', function () {

	console.log('-------------------------------------------------- COPY :fonts');
	gulp.src([SETTINGS.src.fonts + '*', SETTINGS.src.fonts + '**/*'])
		.pipe(gulp.dest(SETTINGS.build.fonts));
});


/*=========================================================================================================
=												Watch

	In case the watch fails due to limited number of watches available on your system, execute this
	command on terminal

	$ echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
=========================================================================================================*/
	
gulp.task('watch', function () {
	
	console.log('watching all the files.....');

	var watchedFiles = [];

	watchedFiles.push(gulp.watch([SETTINGS.src.css + '*.css',   SETTINGS.src.css + '**/*.css'],   ['concat:css']));
	
	watchedFiles.push(gulp.watch([SETTINGS.src.css + '*.scss',  SETTINGS.src.css + '**/*.scss'],  ['concat:css']));

	watchedFiles.push(gulp.watch([SETTINGS.src.js + '*.js',     SETTINGS.src.js + '**/*.js'],     ['pot', 'concat:js']));

	watchedFiles.push(gulp.watch([SETTINGS.src.js + '*.coffee', SETTINGS.src.js + '**/*.coffee'], ['pot', 'concat:js']));

	watchedFiles.push(gulp.watch([SETTINGS.src.app + '*.html'], ['copy:html:root']));

	watchedFiles.push(gulp.watch([SETTINGS.src.images + '*.*', SETTINGS.src.images + '**/*.*'], ['copy:images']));

	watchedFiles.push(gulp.watch([SETTINGS.src.fonts + '*.*',  SETTINGS.src.fonts + '**/*.*'],  ['copy:fonts']));

	watchedFiles.push(gulp.watch([SETTINGS.src.bower + '*.js', SETTINGS.src.bower + '**/*.js'], ['concat:bower']));

	watchedFiles.push(gulp.watch([SETTINGS.src.templates + '*.html', SETTINGS.src.templates + '**/*.html'], ['pot', 'copy:html']));

	watchedFiles.push(gulp.watch([SETTINGS.src.po + '*.po',    SETTINGS.src.po + '**/*.po'],    ['translations', 'concat:js']));

	// Just to add log messages on Terminal, in case any file is changed
	var onChange = function (event) {
		if (event.type === 'deleted') {
			runSequence('clean');
			setTimeout(function () {
				runSequence('copy', 'concat', 'watch');
			}, 500);
		}
		console.log(changeLog('-------------------------------------------------->>>> File ' + event.path + ' was ------->>>> ' + event.type));
	};

	watchedFiles.forEach(function (watchedFile) {
		watchedFile.on('change', onChange);
	});
	
});


/*============================================================
=                            Clean                           =
============================================================*/

var cleanFiles = function (files, logMessage) {
	console.log('-------------------------------------------------- CLEAN :' + logMessage);
	return gulp.src(files, {read: false})
		.pipe(gulpPlugins.rimraf({force: true}));
};

gulp.task('clean', function () {
	return cleanFiles([SETTINGS.build.app], 'all files');
});

gulp.task('clean:css', function () {
	return cleanFiles([SETTINGS.build.css], 'css');
});

gulp.task('clean:js', function () {
	return cleanFiles([SETTINGS.build.js], 'js');
});

gulp.task('clean:html', function () {
	return cleanFiles([SETTINGS.build.templates], 'html');
});

gulp.task('clean:images', function () {
	return cleanFiles([SETTINGS.build.images], 'images');
});

gulp.task('clean:fonts', function () {
	return cleanFiles([SETTINGS.build.fonts + '*.*', SETTINGS.build.fonts + '**/*.*'], 'fonts');
});

gulp.task('clean:cdn', function () {
	return cleanFiles([SETTINGS.cdn], 'CDN files');
});

gulp.task('clean:zip', function () {
	return cleanFiles(['zip/**/*', '!zip/build-*.zip'], 'zip');
});


/*============================================================
=                        Revisioning                         =
============================================================*/

gulp.task('revisioning', ['clean:cdn'], function () {

	return gulp.src(SETTINGS.build.app + '**')
		.pipe(revall({ ignore: [/^\/index.html/g] }))
		.pipe(gulp.dest(SETTINGS.cdn));
});


/*============================================================
=                             Zip                            =
============================================================*/

gulp.task('zip', function () {
	gulp.src([SETTINGS.build.app + '*', SETTINGS.build.app + '**/*'])
		.pipe(gulpPlugins.zip('build-' + new Date() + '.zip'))
		.pipe(gulp.dest('./zip/'));

	setTimeout(function () {
		runSequence('clean:zip');
	}, 500); // wait for file creation
		
});


/*============================================================
=                            Start                           =
============================================================*/


gulp.task('build', function () {
	console.log(hintLog('-------------------------------------------------- BUILD - Development Mode'));
	runSequence('config', 'translations', 'copy', 'concat', 'watch');
});

gulp.task('build:prod', function () {
	console.log(hintLog('-------------------------------------------------- BUILD - Production Mode'));
	isProduction = true;
	runSequence('config', 'translations', 'copy', 'concat', 'watch');
});

gulp.task('publish', function () {
	console.log(hintLog('-------------------------------------------------- PUBLISH - Production Mode'));
	isProduction = true;
	runSequence('clean', 'config', 'translations', 'copy', 'concat', 'revisioning', 'aws:publish');
});

gulp.task('default', ['build', 'server']);

// Just in case you are too lazy to type: $ gulp --type production
gulp.task('prod', ['build:prod', 'server']);



/*============================================================
=                       Browser Sync                         =
============================================================*/

gulp.task('bs', function () {
	browserSync.init([SETTINGS.build.app + 'index.html', SETTINGS.build + 'templates/*.html', SETTINGS.build.css + '*css', SETTINGS.build.js + '*.js'], {
		proxy: {
			host: '127.0.0.1',
			port: serverConfig.port
		}
	});
});

/*============================================================
=                    BitBalloon Publish                      =
============================================================*/

gulp.task('bb:publish', function () {
	return bb.deploy({
		access_token: '12b439dc1c0687be3ac671f8bdc8849769d846df7fbac68b54296d71b002637c',
		site_id: '1be7971c-6115-4f5f-b399-5b6fc62cd019',
		dir: SETTINGS.cdn
	}, function (err, deploy) {
		if (err) {
			throw (err);
		}
	});
});


/*============================================================
=                       AWS Publish                          =
============================================================*/

gulp.task('aws:publish', function () {

	var awsconfig = require('./awsconfig.json');

	// create a new publisher
	var publisher = awspublish.create({
		key:    awsconfig.AWS_KEY,
		secret: awsconfig.AWS_SECRET,
		bucket: awsconfig.BUCKET
	});

	// define custom headers
	var headers = {
		'Cache-Control': 'max-age=315360000, no-transform, public'
	};

	var index_header = {
    'Cache-Control': 'max-age=0, no-transform, public'
  };

	var assets_filter  = gulpPlugins.filter(['**/*.html', '**/*.js', '**/*.css']);
	var index_filter   = gulpPlugins.filter(['**/index.html']);
	var noindex_filter = gulpPlugins.filter(['**/*', '!**/index.html']);

	return gulp.src(SETTINGS.cdn + '**/*')
		// gzip, Set Content-Encoding headers and add .gz extension
		.pipe(assets_filter)
		.pipe(awspublish.gzip())
		.pipe(assets_filter.restore())

		// publisher will add Content-Length, Content-Type and headers specified above
		// If not specified it will set x-amz-acl to public-read by default
		.pipe(noindex_filter)
		.pipe(publisher.publish(headers))
		.pipe(noindex_filter.restore())

		// index.html without cache
		.pipe(index_filter)
		.pipe(publisher.publish(index_header))
		.pipe(index_filter.restore())

		// create a cache file to speed up consecutive uploads
		.pipe(publisher.cache())

		// this will publish and sync bucket files with the one in your public directory
		.pipe(publisher.sync())

		 // print upload updates to console
		.pipe(awspublish.reporter());
});

