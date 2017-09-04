$(function () {
    "use strict";

    try{
        var model = 'firesafety_query';

        //定义表单初始化选项
        var option = get_table_option(model);
        var table = $('#'+model+'_table').DataTable(option);

        //单选监听
        TableTools.selected_listener(table, model+'_table');

        //添加工具栏
        add_tools_control(model);
    }catch(e){
        Tools.group('Running Model Firesafety Query Error.', e);
    }

    /** -------------------------------------------------------------------------- **/
    // 获取列表配置
    function get_table_option(d_model){
        return $.extend({
            dom: '<"#'+d_model+'_tool_bar">frtip',
            ajax:{
                url: TableTools.get_url('/fmap/api/firesafety/query/list/get'),
                type: TableTools.ajax_type,
                dataType: TableTools.ajax_format,
                data:function(params){
                    params.code = $("#"+d_model+"_code").val();
                    params.shop_name = $("#"+d_model+"_shop_name").val();
                }
            },
            aoColumns: [
                { "data": "id" },
                { "data": "code" },
                { "data": "checked_date" },
                { "data": "bill_type_name" },
                { "data": "qualified" },
                { "data": "recheck_status" },
                { "data": "bill_status_name" },
                { "data": "shop_name" },
                { "data": "account" }
            ]
        }, Settings.paging);
    }

    /** 添加工具栏 **/
    function add_tools_control(d_model){
        var listener = {
            success:function(data){
                // 初始化菜单
                var html = template(d_model+'_table_tools', {model: d_model, power: data.json.power});
                $('#'+d_model+'_tool_bar').html(html);
                add_tools_listener(d_model);
                NavOpenAction.do_some_action();
            },
            error:function(xhr,status){ Tools.group('Request Modle:d_model Powers Error.', xhr, status);}
        }
        PageRequest.get_model_permision({model:d_model}, listener);
    }

    // 工具监听
    function add_tools_listener(dmodel){
        $("#"+dmodel+"_search").on('click', click_search);
        $("#"+dmodel+"_inf").on("click", click_inf);
    }

    // 高级查询
    function click_search(){
        table.ajax.reload(function(){ Tools.info("Reqeust Finished.");},true);
    }

    // 查看
    function click_inf(){
        var option = "info";
        var id;
        var action =  NavOpenAction.get_cached_action();
        if (action != null && action.action == "inf"){
            id = action.data.id;
        }else {
            id  = TableTools.get_table_selected(table, 'id');
        }
        if(id !== null){
            var listener = {
                success:function(data){
                    var temp_data_list = data.json.firesafety_list;
                    for(var i=0;i<temp_data_list.length;i++){
                        var temp_data = temp_data_list[i];
                        temp_data.change = option;
                        temp_data.model = model;
                        temp_data.server = Settings.server;
                        temp_data.item_set = change_back_data(temp_data.item_set, temp_data.item);
                    }
                    Tools.group("工单数据:", temp_data_list);

                    var html = template('temp_'+model+'_change', {temp_data_list:temp_data_list});
                    var lisenler = {option: option, body: html, sure_show: "确认", sure:function(){ OpenModal.close();}};
                    OpenModal.open(lisenler);
                }
            };
            PageRequest.get_firesafety_query_by_id({id:id}, listener);
        }else{
            OpenModal.open_alert({option:'warn',body:'请先选择一条数据后操作！'});
        }
    }

    /** 处理服务器返回结果 **/
    function change_back_data(item_set, item_data){
        var item_settings = CharTools.str2array(item_set);
        for(var i=0;i<item_settings.length;i++){
            for(var b=0;b<item_data.length;b++){
                if(item_settings[i].code == item_data[b].code){
                    item_settings[i].data = item_data[b];
                    break;
                }
            }
            for(var c=0;c<item_settings[i].childs.length;c++){
                for(var d=0;d<item_data.length;d++){
                    if(item_settings[i].childs[c].code == item_data[d].code){
                        item_settings[i].childs[c].data = item_data[d];
                        break;
                    }
                }
            }
        }
        return item_settings;
    }

});
