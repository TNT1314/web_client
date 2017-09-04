$(function () {
    "use strict"
    
    var model = 'user';
    
    try{

        //定义初始化
        var opt = $.extend(
        {
            dom: '<"#user_tool_bar_div">frtip',
            process: true,
            serverSide: true,
            ajax:{
                url: Settings.server + '/fmap/api/app/list/test?format=jsonp',
                dataType: 'jsonp',
                type: 'GET',
                data: function(d){
                    d.query = 'hehe'
                }
            },
            aoColumns: [
                { "data": "id" },
                { "data": "first_name" },
                { "data": "last_name" },
                { "data": "position" },
                { "data": "office" },
                { "data": "start_date" },
                { "data": "salary" }
            ],
            "columns": [
                { "searchable": false },
                { "searchable": false },
                { "searchable": false },
                { "searchable": false },
                { "searchable": false },
                { "searchable": false },
                { "searchable": false }
             ] 
        }, Settings.paging);
        
        var table = $("#list_user").DataTable(opt);
        
        $('#list_user tbody').on( 'click', 'tr', function () {
            if ( $(this).hasClass('selected') ) {
                $(this).removeClass('selected');
            }else {
                table.$('tr.selected').removeClass('selected');
                $(this).addClass('selected');
            }
        });
        
        
        
        // 初始化菜单
        var html_str = template(
            'temp_user_tools', 
            {   
                model: model,
                power: {
                    add: true,
                    edi: false,
                    aud: true,
                    del: true
                }
            }
        );
        
        $("#user_tool_bar_div").html(html_str);
        $("#"+model+"_add").on('click', click_add);
        $("#"+model+"_aud").on('click', click_aud);
    }catch(e){
        Tools.group('Run Model Error.', e);
    }
    
    /** -------------------------------------------------------------------------- **/
    // 新增事件
    function click_add(){
        var html_str = template('temp_user_change',{change:'add'});
   
        var lisenler = {
            title: '<i class="fa fa-plus-square-o"></i> &nbsp;&nbsp;新增用户',
            body: html_str,
            sub_show: "新增用户",
            sub:function(){ console.log('开始工作啦！');}
        }
        OpenModal.open(lisenler);
    }
    
    // 审批内容
    function click_aud(){
        var id = TableTools.get_table_selected(table, 'id');
        if(id !== null){
            var body = '确认ID:' + id + '的记录真实有效？';
            var listener = {
                title: '<i class="fa fa-check-square-o"></i> &nbsp;&nbsp;审批确认',
                body: body,
                sub_show: "确认",
                sub:function(){ Tools.info('审批成功！');}
            }
            OpenModal.open_confirm(listener);
        }else{ 
            OpenModal.open_alert({option: 'warn', body: '请先选择一条数据后操作！'});
        }
    }
});