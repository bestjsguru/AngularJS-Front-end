"use strict";

var config = require('./config.json');

var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var minify = require('gulp-clean-css');
var rename = require("gulp-rename");
var rev = require("gulp-rev");
var usemin = require("gulp-usemin");
var prefix = require('gulp-autoprefixer');
var ngAnnotate = require('gulp-ng-annotate');
var clean = require('gulp-clean');
var minifyHtml = require('gulp-minify-html');
var ngHtml2Js = require('gulp-ng-html2js');
var less = require('gulp-less');
var sourcemaps = require('gulp-sourcemaps');
var plumber = require('gulp-plumber');
var debug = require('gulp-debug');
var cached = require('gulp-cached');
var remember = require('gulp-remember');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var watchify = require('watchify');
var browserify = require('browserify');
var babelify = require('babelify');
var makeCssUrl = require('gulp-make-css-url-version');
var notify = require('gulp-notify');
var replace = require('gulp-replace');
var gitRev = require('git-rev-sync');
var fs = require('fs');

require('colors');

gulp.task('default', ['less', 'html', 'fonts', 'images', 'es6', 'assets', 'index']);
gulp.task('dev', ['less-watch', 'html-watch', 'fonts', 'images', 'es6-dev', 'dev-proxy']);
gulp.task('dev-noproxy', ['less-watch', 'html-watch', 'fonts', 'images', 'es6-dev']);
gulp.task('default-with-proxy', ['default', 'dev-proxy']);

gulp.task('dev-proxy', function () {
    var proxy = require('./server');
    //todo make more gulp-friendly
    proxy.run();
});

gulp.task('less-dev', buildLess.bind(this, false));
gulp.task('less', buildLess.bind(this, true));

gulp.task('less-watch', ['less-dev'], function () {
    gulp.watch('app/**/**/**/*.less', ['less-dev']);
});

// HTML
gulp.task('html', ['less'], buildTemplates.bind(this, true));
gulp.task('html-dev', buildTemplates.bind(this, false));
gulp.task('html-watch', ['html-dev'], function () {
    gulp.watch('app/content/**/**/*.html', ['html-dev']);
});

// Fonts
gulp.task('fonts', function() {
    return gulp.src([
        'app/bower_components/font-awesome/fonts/fontawesome-webfont.*',
        'app/bower_components/bootstrap/fonts/glyphicons-halflings-*.*'
    ]).pipe(gulp.dest('app/fonts/'));
});

gulp.task('images', function() {
    return gulp.src([
        'app/bower_components/select2/select2.png',
        'app/bower_components/select2/select2x2.png',
        'app/bower_components/select2/select2-spinner.gif'
    ]).pipe(gulp.dest('app/styles/'));
});

// Assets
gulp.task('assets', ['es6'], function() {
    return gulp.src('app/index.html')
        .pipe(usemin({
            css_vendor: [minify({level: 1}), prefix(config.gulp.browsers), 'concat', rev()],
            css_main: [minify({level: 1}), prefix(config.gulp.browsers), 'concat', rev()],
            js_vendor: [ngAnnotate(), uglify({mangle: false}), rev()],
            js_main: [rev()],
            js_partials: [rev()]
        }))
        .pipe(gulp.dest('app/'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('app/'))
        .on('end', function () {
            var fs = require('fs');

            fs.readFile('app/rev-manifest.json', {encoding: 'utf-8', flag: 'rs'}, function(e, data) {
                console.log('Rev manifest:');
                if (e) return console.log(e);
                console.log(data);
            });
        });
});

// Minify index.html file in the end
gulp.task('index', ['assets'], function() {
    return gulp.src('app/index.html')
        .pipe(minifyHtml({
            empty: true,
            spare: true,
            quotes: true
        }))
        //.pipe(uglify({mangle: false}))
        .pipe(gulp.dest('app/'));
});

// Build css from less files, and in case if we are in
// development environment build sourcemaps too
function buildLess(prod) {
    var src = gulp.src('app/styles/*.less')
        .pipe(plumber(function (err) {
            var plugin = '(' + err.plugin + ')';
            console.log('Less compile error '.bold.red + plugin.cyan + ':' + err.message);
            this.emit('end')
        }));

    if (!prod) src = src.pipe(sourcemaps.init());

    src = src.pipe(less());
    if (!prod) src.on("error", notify.onError(function (error) { return "Message to the notifier: " + error.message; }));

    src = src.pipe(prefix(config.gulp.browsers));

    if (!prod) src = src.pipe(sourcemaps.write());

    src = src.pipe(makeCssUrl());

    return src.pipe(gulp.dest('app/styles')).on('error', function () {
        console.log('--->', arguments, this);
    });
}

function buildTemplates(prod) {
    var src = gulp.src("app/content/**/**/*.html", {base: 'app'});
    if (prod) {
        src = src.pipe(minifyHtml({
            empty: true,
            spare: true,
            quotes: true
        }));
    }
    src = src.pipe(ngHtml2Js({
        moduleName: "truedashApp"
    })).pipe(concat("partials.min.js"));

    if (prod) src = src.pipe(uglify({mangle: false}));
    return src.pipe(gulp.dest('app/content/'));

}

var bundler = watchify(browserify('./app/index.js', {cache: {}, packageCache: {}, fullPaths: true, debug:true})
        .transform(babelify.configure({sourceMapRelative: __dirname + '/app/'}))
    ).on('update', ES6BuildDev);

function ES6BuildDev() {
    var hash = gitRev.short();
    var version = gitRev.tag();
    return bundler.bundle()
        .on('error', function (error) {
            console.log('Browserify error'.red.bold, error.message);
            notify.onError(function (error) { return "Message to the notifier: " + error.message; })(error);
        })
        .pipe(source('main.js'))
        .pipe(buffer())
        .pipe(debug())
        .pipe(sourcemaps.init({loadMaps: true}))
        //add additional processing here (uglify)
        .pipe(sourcemaps.write())
        .pipe(replace('###REV_NUMBER###', hash))
        .pipe(replace('###APP_VERSION###', version))
        .pipe(replace('###CURRENT_SERVER###', process.env.CURRENT_SERVER || 'dev'))
        .pipe(gulp.dest('app/built/'));
}

gulp.task('es6-dev', ['html-dev'], ES6BuildDev);
gulp.task('es6', ['html', 'fonts'], function () {
    var hash = gitRev.short();
    var version = gitRev.tag();
    return browserify('./app/index.js')
        .transform(babelify.configure())
        .bundle()
        .on('error', function (a, b) {
            console.log('Browserify error'.red.bold, a.message);
        })
        .pipe(source('main.js'))
        .pipe(buffer())
        .pipe(replace('###REV_NUMBER###', hash))
        .pipe(replace('###APP_VERSION###', version))
        .pipe(replace('###CURRENT_SERVER###', process.env.CURRENT_SERVER || 'dev'))
        .pipe(uglify({mangle: false}))
        .pipe(gulp.dest('app/built/'));
});
