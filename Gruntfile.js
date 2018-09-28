module.exports = function(grunt) {
    grunt.initConfig({
        browserify: {
            sample: {
                files: {
                    "src/script.js": ["src/script_src.js"]
                }
            }
        },
        uglify: {
            options: {
                mangle: true,
                compress: true
            },
            build: {
                src: "src/script.js",
                dest: "src/script.min.js"
            }
        },
        pug: {
            sample01: {
                options: {
                        debug: true,
                        pretty: true
                },
                files: {
                    "dist/Parser_ServiceTaskXML.xml": "src/Parser_ServiceTaskXML.pug"
                }
            }
        }
    });

    grunt.loadNpmTasks("grunt-browserify");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-pug");
    grunt.registerTask("_Default", ["browserify", 'uglify', 'pug']);
};