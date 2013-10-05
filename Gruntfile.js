module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib');
  grunt.loadNpmTasks('grunt-ghoul');
  grunt.initConfig({
    connect: {
      server: {
        options: {
          hostname: 'localhost'
        }
      }
    },
    ghoul: {
      tests: {
        // The test runner to use. Can be a string
        // indicating a built-in runner, or a function
        // that serves as a custom runner. If it's a
        // function, the first argument is the Grunt
        // instance used to run the task and the second
        // is the html returned from the `ghoul.done`
        // event.
        runner: 'mocha',

        // Each URL is processed and reported on separately.
        // These runners must run the tests using your
        // framework of choice and then call:
        //
        //     console.log('ghoul.done', document.getElementById('results').innerHTML);
        urls: [
          'http://localhost:8000/path/to/runner1.html',
          'http://localhost:8000/path/to/runner2.html'
        ],

        // You can also pass in PhantomJS options. These
        // options are passed as the `options` parameter
        // when calling `phantomjs.spawn()`.
        phantom: {}
      }
    },
  });
};