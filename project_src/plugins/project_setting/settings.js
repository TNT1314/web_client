/**
* settings js
* author:wormer
*/

/** 全局调试信息 **/
if(!window.console){ window.console = {}; }
var console = window.console;  
var cons_funcs = [
    'assert', 'clear', 'count', 'debug', 'dir', 'dirxml',  
    'error', 'exception', 'group', 'groupCollapsed', 'groupEnd',  
    'info', 'log', 'markTimeline', 'profile', 'profileEnd',  
    'table', 'time', 'timeEnd', 'timeStamp', 'trace', 'warn'
];

for(var i=0,l=cons_funcs.length;i<l;i++) {  
    var func = cons_funcs[i];  
    if(!console[func]) console[func] = function(){};  
}
if(!console.memory){ console.memory = {};}

Date.prototype.Format = function (fmt) { //author: meizz 
    "use strict"
    
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "h+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if(/(y+)/.test(fmt)){
        fmt = fmt.replace( RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    } 
    for(var k in o){
        if (new RegExp("(" + k + ")").test(fmt)){
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        } 
    }
    return fmt;
}
 
$.fn.serializeObject = function(){
    "use strict"
    var o = {};  
    var a = this.serializeArray();  
    $.each(a, function() {  
        if (o[this.name]) {  
            if (!o[this.name].push) { o[this.name] = [ o[this.name] ]; }  
            o[this.name].push(this.value || '');  
        } else {  
            o[this.name] = this.value || '';  
        }
    });  
    return o;  
}

/** 验证数据是否有效**/
var ValidData = function(val){
    return val !== null && val !== undefined && val !== '' ? true : false;
}

/** 时间格式化 **/
var OutTime = function(){
    "use strict"
    return new Date().Format('yyyy-MM-dd hh:mm:ss');
}

/** 输出工具类 */
var Tools = {
    info:function(){
        "use strict"
        
        if(Settings.debug === true){
            var con_char = OutTime() + ": ";
            for(var i=0;i<arguments.length;i++){
                con_char += arguments[i];
            }
            console.log(con_char);
        }
    },
    /** 分组打印,可以输出对象 **/
    group:function(){
        "use strict"
        
        if(Settings.debug === true){
            if(arguments.length>=1){
                var group_title = OutTime() + ": " + arguments[0];
                console.group(group_title);
                for(var i=1;i<arguments.length;i++){ console.log(arguments[i]);}
                console.groupEnd();
            }
        }
    }
}

/** 全局定义内容 **/
var Settings = {
    /** soket使用 **/
    Socket: undefined,
    
    /** 是否开启调试 **/
    debug: true,
    
    /** 服务请求路径 **/
    // server: 'http://192.168.1.20:8000',
    server: '/service',
//    server: 'http://192.168.1.18:8001',
    // server: 'http://192.168.1.6:8888',
    
    /** Websoket请求路径 **/
    ws_server: 'ws://'+window.location.host+'/ws/',
    // ws_server: 'ws://192.168.1.6:8888/ws/',
//    ws_server: 'ws://192.168.1.18:8001/ws/',

    /** 数据请求格式 **/
    ajax_format: 'json',
    
    /** 列表配置选项 **/
    paging: { 
        autoWidth: false,
        searching: false,
        ordering: false,
        lengthChange: false,
        processing: true,
        serverSide: true,
        lengthMenu: false,
        pageLength: 10,
        displayStart: 0,
        columnDefs: [
            {
                "targets": [0],
                "visible": false,
                "searchable": false
            }
        ],
        language: {
            sProcessing: "查询中...",
            sLengthMenu: "显示 _MENU_ 项结果",
            sZeroRecords: "没有匹配结果",
            sInfo: "显示第 _START_ 至 _END_ 项结果，共 _TOTAL_ 项",
            sInfoEmpty: "显示第 0 至 0 项结果，共 0 项",
            sInfoFiltered: "(由 _MAX_ 项结果过滤)",
            sInfoPostFix: "",
            sSearch: "搜索:",
            sUrl: "",
            sEmptyTable: "表中数据为空",
            sLoadingRecords: "查询中...",
            sInfoThousands: ",",
            oPaginate: {
                sFirst: "首页",
                sPrevious: "上页",
                sNext: "下页",
                sLast: "末页"
            },
            oAria: {
                sSortAscending: ": 以升序排列此列",
                sSortDescending: ": 以降序排列此列"
            }
        }
    },
    areaChartOptions:{
      //Boolean - If we should show the scale at all
      showScale: true,
      //Boolean - Whether grid lines are shown across the chart
      scaleShowGridLines: false,
      //String - Colour of the grid lines
      scaleGridLineColor: "rgba(0,0,0,.05)",
      //Number - Width of the grid lines
      scaleGridLineWidth: 1,
      //Boolean - Whether to show horizontal lines (except X axis)
      scaleShowHorizontalLines: true,
      //Boolean - Whether to show vertical lines (except Y axis)
      scaleShowVerticalLines: true,
      //Boolean - Whether the line is curved between points
      bezierCurve: true,
      //Number - Tension of the bezier curve between points
      bezierCurveTension: 0.3,
      //Boolean - Whether to show a dot for each point
      pointDot: false,
      //Number - Radius of each point dot in pixels
      pointDotRadius: 4,
      //Number - Pixel width of point dot stroke
      pointDotStrokeWidth: 1,
      //Number - amount extra to add to the radius to cater for hit detection outside the drawn point
      pointHitDetectionRadius: 20,
      //Boolean - Whether to show a stroke for datasets
      datasetStroke: true,
      //Number - Pixel width of dataset stroke
      datasetStrokeWidth: 2,
      //Boolean - Whether to fill the dataset with a color
      datasetFill: true,
      //String - A legend template
      legendTemplate: "",
      //Boolean - whether to maintain the starting aspect ratio or not when responsive, if set to false, will take up entire container
      maintainAspectRatio: true,
      //Boolean - whether to make the chart responsive to window resizing
      responsive: true
    },
    barChartOptions:{
      //Boolean - Whether the scale should start at zero, or an order of magnitude down from the lowest value
      scaleBeginAtZero: true,
      //Boolean - Whether grid lines are shown across the chart
      scaleShowGridLines: true,
      //String - Colour of the grid lines
      scaleGridLineColor: "rgba(0,0,0,.05)",
      //Number - Width of the grid lines
      scaleGridLineWidth: 1,
      //Boolean - Whether to show horizontal lines (except X axis)
      scaleShowHorizontalLines: true,
      //Boolean - Whether to show vertical lines (except Y axis)
      scaleShowVerticalLines: true,
      //Boolean - If there is a stroke on each bar
      barShowStroke: true,
      //Number - Pixel width of the bar stroke
      barStrokeWidth: 2,
      //Number - Spacing between each of the X value sets
      barValueSpacing: 5,
      //Number - Spacing between data sets within X values
      barDatasetSpacing: 1,
      //String - A legend template
      legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].fillColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>",
      //Boolean - whether to make the chart responsive
      responsive: true,
      maintainAspectRatio: true
    }
}