'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var cheerio = require('cheerio');
var shine = require('js-beautify').html_beautify;
var beautify = require('js-beautify').js_beautify;
var EOL = require('os').EOL;
var _ = require('underscore');
var ast = require('ast-query');
var fs = require('fs');

// Function generator function - LOL
var f = function(name) {
  return function() {
    return this[name].apply(this, arguments);
  };
};

module.exports = yeoman.generators.Base.extend({
  prompting: function () {
    var done = this.async();

    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the swell ' + chalk.red('Tryout') + ' generator!'
    ));

    var prompts = [{
      "name": "appName",
      "message": "What is your tryout's name?"
    }, {
      "name": "requirejs",
      "message": "Do you want to use requirejs?",
      "type": "confirm",
      "default": true
    }, {
      "name": "foundation",
      "message": "Do you want to use foundation?",
      "type": "confirm",
      "default": true
    }, {
      "name": "marionette",
      "message": "Do you want to use Marionette?",
      "type": "confirm",
      "default": true
    }];

    this.prompt(prompts, function (props) {
      this.props = props;
      // To access props later use this.props.someOption;

      done();
    }.bind(this));
  },

  writing: {

    // Create the main directory structure.
    dirs: function() {
      this.mkdir('app');
      this.mkdir('app/js');
      this.mkdir('app/css');
    },

    app: function() {
      var t = f('templatePath').bind(this);
      var d = f('destinationPath').bind(this);

      // Allright time to copy and template
      var context = {
        "name": this.props.appName
      };

      // Files hash
      var files = {
        "_bowerrc": ".bowerrc",
        "_bower.json": "bower.json",
        "_package.json": "package.json",
        "_index.html": "app/index.html",
        "_server.js": "server.js"
      };

      for (var hash in files) {
        var tpl = this.templatePath(hash);
        var dst = this.destinationPath(files[hash]);
        this.fs.copyTpl(tpl, dst, context);
      }

      // Copy the bare css dir as well
      var css = fs.readdirSync(this.templatePath('css'));
      for (var i in css) {
        var src = this.templatePath('css/'+css[i]);
        var dst = this.destinationPath('app/css/'+css[i]);
        this.fs.copy(src, dst);
      }

      // Now create index.html. Note however that based on whether we're using 
      // requirejs or not we'll use cheerio to include requirejs.
      if (this.props.requirejs) {
        this.log('Injecting requirejs in index.html');
        var path = this.destinationPath('app/index.html');
        this.fs.copy(path, path, {
          process: function(raw) {
            var $ = cheerio.load(raw);
            var $script = $('<script>').attr({
              "type": "text/javascript",
              "src": "js/vendor/requirejs/require.js",
              "data-main": "js/init.js"
            });
            $('title').after($script);
            return shine($.html(), {
              "extra_liners": []
            });
          }
        });

        // Next, generate the requirejs config file. Note that depending on 
        // what will be included
        this.log('Generating requirejs config file');

        var config = {
          "baseUrl": "js",
          "shim": {},
          "paths": {
            "jquery": "vendor/jquery/dist/jquery",
            "underscore": "vendor/underscore/underscore"
          }
        };

        if (this.props.foundation) {
          config.shim.foundation = {
            "deps": ["jquery"],
            "exports": "jQuery.fn.foundation"
          };
        }
        if (this.props.marionette) {
          _.extend(config.paths, {
            "backbone": "vendor/backbone/backbone",
            "Marionette": "vendor/marionette/lib/core/marionette",
            "backbone.wreqr": "vendor/backbone.wreqr/lib/backbone.wreqr",
            "backbone.babysitter": "vendor/backbone.babysitter/lib/backbone.babysitter",
            "handlebars": "vendor/handlebars/handlebars",
            "hbs": "vendor/requirejs-hbs/hbs"
          });
        }

        this.fs.copyTpl(
          this.templatePath('_init.js'),
          this.destinationPath('app/js/init.js'),
          {
            "config": JSON.stringify(config, null, 4)
          }
        );

        this.log('Generating requirejs main file');
        this.fs.copy(
          this.templatePath('_main.js'),
          this.destinationPath('app/js/main.js')
        );

      }

      // Create the foundation files
      if (this.props.foundation) {
        // Files hash
        var files = {
          "scss/_foundation.scss": "app/scss/foundation.scss",
          "scss/_settings.scss": "app/scss/settings.scss",
          "scss/_app.scss": "app/scss/app.scss"
        };

        for (var hash in files) {
          var tpl = this.templatePath(hash);
          var dst = this.destinationPath(files[hash]);
          this.fs.copyTpl(tpl, dst, context);
        }

        // Also include foundation in the index.html file.
        var path = this.destinationPath('app/index.html');
        this.fs.copy(path, path, {
          process: function(raw) {
            var $ = cheerio.load(raw);
            var $link = $('<link>').attr({
              "rel": "stylesheet",
              "type": "text/css",
              "href": "css/foundation.css"
            });
            $('head').append($link);
            var $link = $('<link>').attr({
              "rel": "stylesheet",
              "type": "text/css",
              "href": "css/app.css"
            });
            $('head').append($link);
            return shine($.html(), {
              "extra_liners": []
            });
          }
        });

      }

      // Create marionette files
      if (this.props.marionette) {

        // Files hash
        var files = {
          "js/_base-item-view.js": "app/js/common/base-item-view.js",
          "js/_base-composite-view.js": "app/js/common/base-composite-view.js"
        };

        for (var hash in files) {
          var tpl = this.templatePath(hash);
          var dst = this.destinationPath(files[hash]);
          this.fs.copyTpl(tpl, dst, context);
        }

      }

    },

    // Creates the grunt file
    grunt: function() {

      // Conigure grunt
      var config = {
        "watch": {}
      };
      var tasks = ['grunt-contrib-watch'];

      // Set everything up
      if (this.props.foundation) {
        config.sass = {
          "options": {
            "includePaths": ['app/js/vendor/foundation/scss']
          },
          "foundation": {
            "options": {
              "outputStyle": "compressed",
              "sourceMap": false
            },
            "files": {
              "app/css/foundation.css": "app/scss/foundation.scss"
            }
          },
          "app": {
            "options": {
              "outputStyle": "compressed",
              "sourceMap": true
            },
            "files": {
              "app/css/app.css": "app/scss/app.scss"
            }
          }
        };
        tasks.push('grunt-sass');
      }
      if (this.props.requirejs) {
        tasks.push('grunt-contrib-requirejs');
      }

      // At last copy and parse the grunt file
      this.fs.copyTpl(
        this.templatePath('_Gruntfile.js'),
        this.destinationPath('Gruntfile.js'),
        {
          "load": (function() {
            var js = '';
            for (var i in tasks) {
              js += "  grunt.loadNpmTasks('"+tasks[i]+"');"+EOL;
            }
            return js;
          })()
        }
      )
      this.fs.copy(
        this.destinationPath('Gruntfile.js'),
        this.destinationPath('Gruntfile.js'),
        {
          process: function(contents) {
            var code = ast(contents+'');
            var expr = code.callExpression('grunt.initConfig');
            expr.arguments.at(0).value(JSON.stringify(config));
            return beautify(code+'', {
              "indent_size": 2
            });
          }
        }
      );
    }

  },

  install: function () {

    // Determine the npm dependencies. Largely depends of course on what the 
    // user specified to be included. For example, if foundation needs to be 
    // included we'll setup grunt as well etc. etc.
    var dev = ['express', 'grunt', 'grunt-contrib-watch'];

    if (this.props.requirejs) {
      dev.push('grunt-contrib-requirejs');
    }
    if (this.props.foundation) {
      dev.push('grunt-sass');
    }

    this.npmInstall(dev, {
      "saveDev": true
    })

    // Now determine the bower dependencies.
    var deps = ['jquery', 'underscore'];
    if (this.props.requirejs) {
      deps.push('requirejs');
    }
    if (this.props.foundation) {
      deps.push('foundation=zurb/bower-foundation#5.4.7');
    }
    if (this.props.marionette) {
      deps.push.apply(deps, [
        'marionette',
        'backbone',
        'backbone.epoxy',
        'requirejs-plugins',
        'requirejs-text',
        'requirejs-hbs',
        'handlebars'
      ]);
    }

    // Install the bower dependencies
    this.bowerInstall(deps, {
      "save": true
    });
  }
});
