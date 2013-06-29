module.exports = function(grunt)
{
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.initConfig
    ({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: [
                '/*!',
                ' * @name        <%= pkg.title %>',
                ' * @author      <%= pkg.author%> <<%= pkg.repository.url %>>',
                ' * @modified    <%= grunt.template.today("dddd, mmmm dS, yyyy, HH:MM:ss") %>',
                ' * @version     <%= pkg.version %>',
                ' */',
                ''].join('\n')
            },
            main_script:{
                files: {
                    'dist/jquery.postcode.anywhere.min.js':['src/jquery.postcode.anywhere.js']
                }
            }
        }
    });

    grunt.registerTask('default', ['uglify']);
};