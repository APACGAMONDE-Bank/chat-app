'use strict';

var config = require('./config');

module.exports = function(grunt) {
    require('time-grunt')(grunt);
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        clean: {
            js: ['build/*.js', 'public/js/*.js'],
            css: ['build/*.css', 'public/css/*.css'],
            static: ['public/*.html'],
            assets: ['public/fonts/**/*', 'public/img/**/*'],
            prod: ['build/**/*', 'dist/**/*']
        },

        browserify: {
            client: {
                options: {
                    transform: ['reactify'],
                    extensions: ['.jsx']
                },
                files: [{
                    src: ['client/js/client.js'],
                    dest: 'build/app.js'
                }]
            }
        },

        concat: {
            js: {
                src: ['build/app.js'],
                dest: 'build/main.js'
            },
            css: {
                src: ['node_modules/bootstrap/dist/css/bootstrap.css', 'client/css/*.css'],
                dest: 'build/main.css'
            }
        },

        uglify: {
            prod: {
                options: {
                    compress: true,
                    verbose: true
                },
                files: [{
                    expand: true,
                    cwd: 'build/',
                    src: 'main.js',
                    dest: 'dist/js/'
                }]
            }
        },

        cssmin: {
            prod: {
                expand: true,
                cwd: 'build/',
                src: 'main.css',
                dest: 'dist/css/'
            }
        },

        copy: {
            js: {
                expand: true,
                cwd: 'build/',
                src: 'main.js',
                dest: 'public/js/'
            },
            css: {
                expand: true,
                cwd: 'build/',
                src: 'main.css',
                dest: 'public/css/'
            },
            static: {
                expand: true,
                cwd: 'client/',
                src: 'index.html',
                dest: 'public/'
            },
            assets: {
                files: [{
                    expand: true,
                    cwd: 'client/img',
                    src: '**/*',
                    dest: 'public/img/'
                }, {
                    expand: true,
                    cwd: 'node_modules/bootstrap/dist/fonts/',
                    src: '*',
                    dest: 'public/fonts/'
                }]
            },
            prod: {
                files: [{
                    expand: true,
                    cwd: 'client/img',
                    src: '**/*',
                    dest: 'dist/img/'
                }, {
                    expand: true,
                    cwd: 'client/',
                    src: 'index.html',
                    dest: 'dist/'
                }, {
                    expand: true,
                    cwd: 'node_modules/bootstrap/dist/fonts/',
                    src: '*',
                    dest: 'dist/fonts/'
                }]
            }
        },

        jshint: {
            options: {
                jshintrc: '.jshintrc',
                ignores: ['client/js/client.js']
            },
            server: ['Gruntfile.js', 'server.js', 'app/**/*.js'],
            client: ['client/js/**/*.js'],
            tests: ['test/**/*.js']
        },

        watch: {
            js: {
                files: ['client/js/**/*.js'],
                tasks: ['recompile:js']
            },
            css: {
                files: ['client/css/*.css'],
                tasks: ['recompile:css']
            },
            static: {
                files: ['client/*.html'],
                tasks: ['recopy:static']
            },
            assets: {
                files: ['client/img/**/*', 'client/fonts/*'],
                tasks: ['recopy:assets']
            }
        },

        nodemon: {
            dev: {
                script: 'server.js',
                options: {
                    cwd: __dirname,
                    nodeArgs: ['--debug'],
                    env: {
                        PORT: ''+config.PORT
                    },
                    ext: 'js',
                    ignore: ['node_modules/**', 'build/**/*', 'public/**/*']
                }
            }
        },

        concurrent: {
            dev: {
                tasks: ['nodemon:dev', 'watch'],
                options: {
                    logConcurrentOutput: true
                }
            }
        },

        mochaTest: {
            options: {
                reporter: 'spec'
            },
            src: ['test/*.js']
        }

    });

    grunt.registerTask('recompile:js', ['jshint:client', 'clean:js', 'browserify:client', 'concat:js', 'copy:js']);
    grunt.registerTask('recompile:css', ['clean:css', 'concat:css', 'copy:css']);
    grunt.registerTask('recopy:static', ['clean:static', 'copy:static']);
    grunt.registerTask('recopy:assets', ['clean:assets', 'copy:assets']);

    grunt.registerTask('clean:dev', ['clean:js', 'clean:css', 'clean:static', 'clean:assets']);
    grunt.registerTask('copy:dev', ['copy:js', 'copy:css', 'copy:static', 'copy:assets']);

    grunt.registerTask('build:dev', ['jshint', 'clean:dev', 'browserify:client', 'concat', 'copy:dev']);
    grunt.registerTask('build:prod', ['clean:prod', 'concat', 'uglify', 'cssmin', 'copy:prod']);

    grunt.registerTask('test', ['jshint', 'mochaTest']);

    grunt.registerTask('server', ['build:dev', 'concurrent:dev']);
};
