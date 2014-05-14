/*global module:false*/

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    stylus: {
      index: {
        src: ['client/stylus/index/main.styl'],
        dest: 'dist/css/index.css'
      },
      login: {
        src: ['client/stylus/login/main.styl'],
        dest: 'dist/css/login.css'
      },
      keyword: {
        src: ['client/stylus/keyword/main.styl'],
        dest: 'dist/css/keyword.css'
      },
      category: {
        src: ['client/stylus/category/main.styl'],
        dest: 'dist/css/category.css'
      },
      cost: {
        src: ['client/stylus/cost/main.styl'],
        dest: 'dist/css/cost.css'
      },
      list: {
        src: ['client/stylus/list/main.styl'],
        dest: 'dist/css/list.css'
      }
    },

    cssmin: {
      compress: {
        files: {
          // 'dist/css/add.min.css': ['dist/css/add.css'],
          // 'dist/css/user.min.css': ['dist/css/user.css'],
          // 'dist/css/detail.min.css': ['dist/css/detail.css'],
          // 'dist/css/post.min.css': ['dist/css/post.css']
        }
      }
    },

    watch: {
      stylesheets: {
        files: [
          'client/stylus/**/*.styl',
          'client/modules/**/*.styl'
        ],
        tasks: ['stylus', 'cssmin']
      },
      scripts: {
        files: ['client/js/*.js',
          'client/js/**/*.js',
          'client/modules/**/*.js'
        ],
        tasks: ['ozma']
      },
      genstatic: {
        files: [
          'views/*.jade',
          'views/**/*.jade',
          'client/modules/**/*'
        ],
        tasks: ['genstatic', 'jade']
      }
    },
    jade: {
      site: {
        files: {
          'dist/template/': ['client/views/*.jade', 'client/modules/**/*.jade']
        }
      },
      options: {
        basePath: 'client'
      }
    },
    uglify: {
      site: {
        files: {
          'dist/js/common.min.js': ['dist/js/common/main.js'],
          'dist/js/index.min.js': ['dist/js/index/main.js'],
          // 'dist/js/user.min.js': ['dist/js/user/main.js'],
          'dist/js/detail.min.js': ['dist/js/detail/main.js'],
          'dist/js/post.min.js': ['dist/js/post/main.js']
        }
      }
    },

    ozma: {
      common: {
        src: 'client/js/common/main.js',
        saveConfig: false,
        debounceDelay: 3000,
        config: {
          baseUrl: "client/",
          distUrl: "dist/",
          loader: "js/libs/oz.js",
          disableAutoSuffix: true
        }
      },
      index: {
        src: 'client/js/index/main.js',
        saveConfig: false,
        debounceDelay: 3000,
        config: {
          baseUrl: "client/",
          distUrl: "dist/",
          loader: "js/libs/oz.js",
          disableAutoSuffix: true
        }
      },
      post: {
        src: 'client/js/post/main.js',
        saveConfig: false,
        debounceDelay: 3000,
        config: {
          baseUrl: "client/",
          distUrl: "dist/",
          loader: "js/libs/oz.js",
          disableAutoSuffix: true
        }
      },
      detail: {
        src: 'client/js/detail/main.js',
        saveConfig: false,
        debounceDelay: 3000,
        config: {
          baseUrl: "client/",
          distUrl: "dist/",
          loader: "js/libs/oz.js",
          disableAutoSuffix: true
        }
      },
      // user: {
      //   src: 'client/js/user/main.js',
      //   saveConfig: false,
      //   debounceDelay: 3000,
      //   config: {
      //     baseUrl: "client/",
      //     distUrl: "dist/",
      //     loader: "js/libs/oz.js",
      //     disableAutoSuffix: true
      //   }
      // }
    },
    genstatic: {
      index: {
        file: 'views/index.jade',
        modulePath: 'client/modules',
        prefix: {
          js: 'modules',
          stylesheet: '../../modules'
        },
        dest: {
          js: 'client/js/index/modules.js',
          stylesheet: 'client/stylus/index/modules.styl'
        }
      },
      login: {
        file: 'views/login.jade',
        modulePath: 'client/modules',
        prefix: {
          js: 'modules',
          stylesheet: '../../modules'
        },
        dest: {
          js: 'client/js/login/modules.js',
          stylesheet: 'client/stylus/login/modules.styl'
        }
      },
      keyword: {
        file: 'views/keyword.jade',
        modulePath: 'client/modules',
        prefix: {
          js: 'modules',
          stylesheet: '../../modules'
        },
        dest: {
          js: 'client/js/keyword/modules.js',
          stylesheet: 'client/stylus/keyword/modules.styl'
        }
      },
      category: {
        file: 'views/category.jade',
        modulePath: 'client/modules',
        prefix: {
          js: 'modules',
          stylesheet: '../../modules'
        },
        dest: {
          js: 'client/js/category/modules.js',
          stylesheet: 'client/stylus/category/modules.styl'
        }
      },
      cost: {
        file: 'views/cost.jade',
        modulePath: 'client/modules',
        prefix: {
          js: 'modules',
          stylesheet: '../../modules'
        },
        dest: {
          js: 'client/js/cost/modules.js',
          stylesheet: 'client/stylus/cost/modules.styl'
        }
      },
      list: {
        file: 'views/list.jade',
        modulePath: 'client/modules',
        prefix: {
          js: 'modules',
          stylesheet: '../../modules'
        },
        dest: {
          js: 'client/js/list/modules.js',
          stylesheet: 'client/stylus/list/modules.styl'
        }
      }
      // user: {
      //   file: 'views/user.jade',
      //   modulePath: 'client/modules',
      //   prefix: {
      //     js: 'modules',
      //     stylesheet: '../../modules'
      //   },
      //   dest: {
      //     js: 'client/js/user/modules.js',
      //     stylesheet: 'client/stylus/user/modules.styl'
      //   }
      // }
    }
  });

  // grunt.loadNpmTasks('grunt-ozjs');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-stylus');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-genstatic');
  grunt.loadNpmTasks('grunt-jade-runtime');

  // By default, lint and run all tests.
  grunt.registerTask('default', ['watch']);

  grunt.registerTask('build', ['genstatic', 'stylus', 'ozma', 'cssmin', 'uglify', 'jade']);
};