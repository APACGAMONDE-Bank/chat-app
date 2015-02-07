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

        browserify: {
            app: {
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
            build: {
                files: [{
                    src: ['build/app.js'],
                    dest: 'build/main.js'
                }, {
                    src: ['node_modules/bootstrap/dist/css/bootstrap.css', 'client/css/*.css'],
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
            dev: {
                files: [{
                    expand: true,
                    cwd: 'build/',
                    src: 'main.js',
                    dest: 'public/js/'
                }, {
                    expand: true,
                    cwd: 'build/',
                    src: 'main.css',
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
            options: {
                jshintrc: '.jshintrc',
                ignores: ['client/js/client.js']
            },
            all: ['Gruntfile.js', 'server.js', 'client/js/*.js']
        },

        watch: {
            scripts: {
                files: ['client/js/*.js', 'client/css/*.css'],
                tasks: ['build:dev']
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

    grunt.registerTask('build:dev', ['clean:build', 'clean:dev', 'browserify:app', 'jshint:all', 'concat:build', 'copy:dev']);
    grunt.registerTask('build:prod', ['clean:build', 'clean:prod', 'concat:build', 'uglify:prod', 'cssmin:prod', 'copy:prod']);

    grunt.registerTask('server', ['build:dev', 'concurrent:dev']);
};
