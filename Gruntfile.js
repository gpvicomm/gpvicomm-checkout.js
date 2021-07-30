module.exports = function (grunt) {
  const package_json = require('./package.json');
  const options = {encoding: 'utf-8'};

  const configure_gateway_data = () => {
    for (let type_file in {js: '', css: ''}) {
      let file_name = `payment_checkout_stable.min.${type_file}`;
      let data = grunt.file.read(file_name, [options]);
      for (let key in package_json.payment_gateway) {
        console.log(`Replacing key ${key} with value ${package_json.payment_gateway[key]}`);
        data = data.replace(new RegExp(key, "g"), package_json.payment_gateway[key]);
      }
      grunt.file.write(file_name, data, [options]);
      console.log(`>> Gateway → ${package_json.payment_gateway.pg__gateway_name__} configured in file ${file_name}`);
    }
  };

  grunt.initConfig({

    //
    // Server in localhost
    //
    connect: {
      server: {
        options: {
          port: 9002
        }
      }
    },

    //
    // CSS Minify
    //
    cssmin: {
      options: {
        shorthandCompacting: false,
        roundingPrecision: -1
      },
      "css": {
        files: {
          "payment_checkout_stable.min.css": ["./src/css/**/*.css"]
        }
      }
    },

    //
    // JavaScript Minify
    //
    uglify: {
      options: {
        mangle: false
      },
      js: {
        files: {
          "payment_checkout_stable.min.js": ["src/js/**/*.js"]
        }
      }
    },

    //
    // Watch Configuration
    //
    watch: {
      "css": {
        files: [
          "./src/css/**/*.css"
        ],
        tasks: ["cssmin:css"],
        options: {
          livereload: true
        }
      },
      "js": {
        files: [
          './src/js/**/*.js'
        ],
        tasks: ["uglify-es:js"],
        options: {
          livereload: true
        }
      }
    }

  });

  //
  // Plugin loading
  //
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-uglify-es');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-connect');


  //
  // Task definition
  //
  grunt.registerTask('configure_gateway_data', ['Replace gateway data in js/css files'], configure_gateway_data);
  grunt.registerTask('default', ['connect', 'watch']);
  grunt.registerTask('build', ['cssmin:css', 'uglify:js', 'configure_gateway_data']);

};