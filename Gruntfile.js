'use strict';

module.exports = function(grunt) {
    require('time-grunt')(grunt);
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        clean: {
            build: ['build/*'],
            dev: ['public/**/*'],
            prod: ['dist/**/*']
        },

        concat: {
            build: {
                files: [{
                    src: ['client/js/*'],
                    dest: 'build/main.js'
                }, {
                    src: ['client/css/*'],
                    dest: 'build/main.css'
                }]
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
                    src: '*.js',
                    dest: 'dist/js/'
                }]
            }
        },

        cssmin: {
            prod: {
                expand: true,
                cwd: 'build/',
                src: '*.css',
                dest: 'dist/css/'
            }
        },

        copy: {
            dev: {
                files: [{
                    expand: true,
                    cwd: 'build/',
                    src: '*.js',
                    dest: 'public/js/'
                }, {
                    expand: true,
                    cwd: 'build/',
                    src: '*.css',
                    dest: 'public/css/'
                }, {
                    expand: true,
                    cwd: 'client/img',
                    src: '**',
                    dest: 'public/img/'
                }, {
                    expand: true,
                    cwd: 'client/',
                    src: 'index.html',
                    dest: 'public/'
                }]
            },
            prod: {
                files: [{
                    expand: true,
                    cwd: 'client/img',
                    src: '**',
                    dest: 'dist/img/'
                }, {
                    expand: true,
                    cwd: 'client/',
                    src: 'index.html',
                    dest: 'dist/'
                }]
            }
        },

        jshint: {
            all: ['client/js/*.js']
        },

        watch: {
            scripts: {
                files: ['client/js/*.js', 'client/css/*.css'],
                tasks: ['clean:build', 'clean:dev', 'concat:build', 'copy:dev']
            }
        },

        nodemon: {
            dev: {
                script: 'server.js',
                options: {
                    nodeArgs: ['--debug'],
                    env: {
                        PORT: '3000'
                    }
                }
            }
        },

//        shell: {
//            mongodb: {
//                command: 'mongod',
//                options: {
//                    async: true
//                }
//            }
//        },

        concurrent: {
            dev: {
                tasks: ['nodemon:dev', 'watch:scripts'],
                options: {
                    logConcurrentOutput: true
                }
            }
        }

    });

    grunt.registerTask('build:dev', ['clean:build', 'clean:dev', 'jshint:all', 'concat:build', 'copy:dev']);
    grunt.registerTask('build:prod', ['clean:build', 'clean:prod', 'concat:build', 'uglify:prod', 'cssmin:prod', 'copy:prod']);

    grunt.registerTask('server', ['build:dev', 'concurrent:dev']);
};
