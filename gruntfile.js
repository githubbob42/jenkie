module.exports = function(grunt) {
  
  grunt.initConfig({
    bower: {
      install: {
        dest: 'extension/lib/fonts',
        js_dest: 'extension/lib/js',
        css_dest: 'extension/lib/css',
        less_dest: 'extension/lib/css'
      }
    },
    jshint: {
      all: [ 'extension/js/*.js' ]
    }
  });

  grunt.loadNpmTasks('grunt-bower');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  
  grunt.registerTask('default', [ 'bower:install', 'jshint' ]);
};
