var gulp = require('gulp');
var fs = require('fs')
var rollup = require('rollup')
var babel = require('rollup-plugin-babel')
var open = require("open")
var httpServer = require('http-server')
var fsextra = require('fs-extra')
var cleanCSS = require('gulp-clean-css');

//var replace = require('rollup-plugin-replace')
var version = process.env.VERSION;
var express = require('express');
var app = express();

// var uglify = require('uglify-js')
var uglify = require('gulp-uglify');
var rename = require("gulp-rename");
var concat = require('gulp-concat')
var ora = require('ora')

var config = require('../config')

//发布路径
//dist 对外使用
//test 对内测试
var buildPath = {
    rollup: config.build.dist + 'rollup.js',
    devName: 'xxtppt.dev.js',
    distName: 'xxtppt.js',
    dist: config.build.dist,
    test: config.build.test
}

//清空目录
fsextra.emptyDirSync(buildPath.dist)
fsextra.emptyDirSync(buildPath.test)


var getSize = function(code) {
    return (code.length / 1024).toFixed(2) + 'kb'
}


var blue = function(str) {
    return '\x1b[1m\x1b[34m' + escape(process.cwd()) + str + '\x1b[39m\x1b[22m'
}


var write = function(path, code) {
    return new Promise(function(resolve, reject) {
        fs.writeFile(path, code, function(err) {
            if (err) return reject(err)
            console.log('write: ' + blue(path) + ' ' + getSize(code))
            resolve(code)
        })
    })
}


console.log(
    '压缩js  => rollup and gulp\n' +
    '压缩css => gulp-uglify\n'
)


var spinner = ora('Begin to pack , Please wait for\n')
spinner.start()


new Promise(function(resolve, reject) {
        rollup.rollup({
                entry: config.build.entry,
                plugins: [
                    babel({
                        "presets": ["es2015-rollup"]
                    })
                ]
            })
            .then(function(bundle) {

                //创建目录,如果不存在
                if (!fs.existsSync(buildPath.dist)) {
                    fs.mkdirSync(buildPath.dist);
                    console.log(buildPath.dist + '目录创建成功');
                }

                var code = bundle.generate({
                    format: 'umd',
                    moduleName: 'Aaron'
                }).code

                return write(buildPath.rollup, code)
            })
            .then(resolve)
            .catch(function() {
                console.log('错误')
            })
    })
    .then(function() {
        return new Promise(function combine(resolve, reject) {
            fs.readFile('./src/index.html', "utf8", function(error, data) {
                if (error) throw error;
                var paths = []
                var path;
                var cwdPath = escape(process.cwd())
                var scripts = data.match(/<script.*?>.*?<\/script>/ig);

                scripts.forEach(function(val) {
                    val = val.match(/src="(.*?.js)/);
                    if (val && val.length) {
                        path = val[1]

                        //有效src
                        if (/^lib/.test(path)) {
                            paths.push(config.build.src + path)
                        }
                    }
                })

                //合成xxtppt.js
                paths.push(buildPath.rollup)
                gulp.src(paths)
                    .pipe(concat(buildPath.devName))
                    .on('error', function(err) {
                        console.log('Less Error!', err.message);
                        this.end();
                    })
                    //dev
                    .pipe(gulp.dest(buildPath.dist))
                    .pipe(gulp.dest(buildPath.test))
                    //min
                    .pipe(uglify())
                    .pipe(rename(buildPath.distName))
                    .pipe(gulp.dest(buildPath.dist))
                    .pipe(gulp.dest(buildPath.dist))
                    .pipe(gulp.dest(buildPath.test))
                    .on('end', function() {
                        fs.unlinkSync(buildPath.rollup)
                        resolve && resolve()
                    })

            });
        })
    })
    .then(function() {
        return new Promise(function(resolve, reject) {
            //css
            gulp.src('src/css/*.css')
                .pipe(cleanCSS({
                    compatibility: 'ie8'
                }))
                .pipe(gulp.dest(buildPath.dist))
                .pipe(gulp.dest(buildPath.test))
                .on('end', resolve)
        })
    })
    .then(function() {
        var complete = function() {
            var port = 3000
            var host = '0.0.0.0'
            var server = httpServer.createServer({
                root: './src/'
            })
            server.listen(port, host, function() {
                console.log('served prot:' + port)
                open("http://localhost:" + port + "/test.html");
            });
            spinner.stop()
        }

        //数据库
        if (!fs.existsSync("./src/content/xxtebook.db")) {
            console.log("Can't test Because the xxtebook does not exist")
            spinner.stop()
            return
        }

        if (!fs.existsSync("./src/content/SQLResult.js")) {
            console.log("Can't test Because the SQLResult does not exist")
            spinner.stop()
            return
        }

        //数据库
        fs.exists("./src/content/SQLResult.js", function(result) {
            if (!result) {
                require('./sqlite/index').resolve(complete)
                return;
            }
            complete()
        });
    })



/**
 * 替换所有反斜杠为斜杠
 * @return {[type]} [description]
 */
var escape = function(str) {
    var strs = new Array();
    var a = str;
    strs = a.split("");
    for (var i = 0; i < strs.length; i++) {
        a = a.replace("\\", "/")
    }
    return a;
}


function combine1(resolve, reject) {
    fs.readFile('./src/index.html', "utf8", function(error, data) {
        if (error) throw error;
        var paths = []
        var path;
        var cwdPath = escape(process.cwd())
        var scripts = data.match(/<script.*?>.*?<\/script>/ig);
        fs.writeFileSync(dependJs, '')
        scripts.forEach(function(val) {
            val = val.match(/src="(.*?.js)/);
            if (val && val.length) {
                path = val[1]

                //有效src
                if (/^lib/.test(path)) {
                    // console.log(fs.readFileSync(path))
                    fs.appendFileSync(dependJs, fs.readFileSync(src + path))
                }
            }
        })
        resolve && resolve()
    });
}



//打包
function command(callback) {
    fs.readFile('./index.html', "utf8", function(error, data) {
        if (error) throw error;
        var arr = []
        var path;
        var cwdPath = escape(process.cwd())

        var command = []
        command.push('cd ' + cwdPath + '/lib')
        command.push('\n')
        command.push('java -jar ..\\build\\compiler.jar ')

        var scripts = data.match(/<script.*?>.*?<\/script>/ig);
        scripts.forEach(function(val) {
            val = val.match(/lib.*?.js/);
            if (val && val.length) {
                path = cwdPath + "/" + val[0]
                command.push(path + ' ')
            }
        })

        command.push('--js_output_file=..\\build\\_file\\xxtppt.js')
        command.push('\n')
        command.push('cd ' + cwdPath + '/build')
        command.push('\n')
        command.push('Pause')

        command = command.join('');

        fs.writeFile('build/xxtppt.bat', command, function(err) {
            console('youxi!');
        });

    })
}