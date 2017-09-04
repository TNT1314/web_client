//包装函数
module.exports = function(grunt){
    
    'use strict';
    
    //任务配置,所有插件配置信息
    grunt.initConfig({
        
        //获取package.json 的信息
        pkg: grunt.file.readJSON('package.json'),
        
        //jshint代码检查工具配置信息
        jshint:{
            build: ['project_src/js/*.js'],
            options: {
                jshintrc: 'project_profile/.jshintrc'
            }
        },
        
        //js代码压缩工具配置信息
        uglify: {
            options: {
                compress: false,
                stripBanners: false,
                banner: '/*! <%=pkg.name%>-<%=pkg.version%>.js */\n'
            },
//            build:{
//                src: 'project_src/js/*.js',
//                dest: 'project_build/js/app.min.js'
//            },
            build: {//任务三：按原文件结构压缩js文件夹内所有JS文件
                options: {
                    compress: false,
                },
                files: [{
                    expand: true,
                    cwd:'project_src/js',//js目录下
                    src:'**/*.js',//所有js文件
                    dest: '<%=pkg.outpath%>/js'//输出到此目录下
                    //"outpath": "/usr/local/Cellar/nginx/1.8.0/html/map_marker",
                }]
            },
        },
        
        //css压缩工具
        less:{
            production:{
                options: {
                    compress: true
                },
                files: {
                    "project_build/css/app.css": "project_src/less/import.less"
                }
            } 
        },
        
        //css代码检测工具配置信息
        csslint:{
            build: ["<%=pkg.outpath%>/css/*.css"],
            options: {
                csslintrc: 'project_profile/.csslintrc'
            }
        },
        
        //文件拷贝
        copy: {
            main: {
                files: [
                    {expand: true, cwd: 'project_src/plugins/', src:['**'], dest: '<%=pkg.outpath%>/plugins/', filter: 'isFile'},
                    {expand: true, cwd: 'project_src/', src:['**.{html,ico}'], dest: '<%=pkg.outpath%>/', filter: 'isFile'},
                    {expand: true, cwd: 'project_src/widget/', src:['**'], dest: '<%=pkg.outpath%>/widget/', filter: 'isFile'},
                    {expand: true, cwd: 'project_src/pages/', src:['**'], dest: '<%=pkg.outpath%>/pages/', filter: 'isFile'},
                    {expand: true, cwd: 'project_src/images/', src:['**'], dest: '<%=pkg.outpath%>/images/', filter: 'isFile'}
                ]
            }
        },
        
        clean:{
            build: {
                src: ['<%=pkg.outpath%>/images/**']
            }
        },
        
        // 图片压缩插件
        imagemin: {                          // Task
            dynamic: {                         // Another target
              files: [{
                expand: true,                  // Enable dynamic expansion
                cwd: 'project_src/images/',                   // Src matches are relative to this path
                src: ['**/*.{png,jpg,gif}'],   // Actual patterns to match
                dest: '<%=pkg.outpath%>/images/'                  // Destination path prefix
              }]
            }
        },
        
        //files监听插件配置
        watch:{
            build:{
                files: ["project_src/**"],
                tasks: ['uglify', 'less', 'clean', 'copy', 'jshint'],
                option:{ span: false}
            }
        }
    });
    
    //加载压缩插件
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-csslint');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-imagemin');
    grunt.loadNpmTasks('grunt-contrib-watch');
    
    grunt.registerTask('build', ['uglify', 'less', 'clean', 'copy']);
    
    //注册默认插件执行
    grunt.registerTask('default', ['uglify', 'less', 'clean', 'copy',  'jshint', 'csslint', 'watch']);
};