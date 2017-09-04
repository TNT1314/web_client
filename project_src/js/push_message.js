$(function () {
    "use strict";

    try{
        var model = 'push_message';
        //初始化列表
        var option = get_table_option(model);
        var table = $("#"+model+"_table").DataTable(option);
        /** 初始化工具栏菜单 **/
        add_tools_control(model);
        //列表单选监听
        TableTools.selected_listener(table, model+"_table");
        // click_add();
    }catch(e){
        Tools.group("Run Model Push_Message Error.", e);
    }

    /** 获取table设置参数 **/
    function get_table_option(d_model){
        return $.extend({
            dom: '<"#'+d_model+'_tool_bar">frtip',
            ajax:{
                url: TableTools.get_url('/fmap/api/push_message/list/get'),
                type: TableTools.ajax_type,
                dataType: TableTools.ajax_format,
                data:function(params){
                    params.title = $("#"+d_model+"_title").val();
                    params.msg_is_read = $("#"+d_model+"_msg_is_read").val();
                    params.create_user = $("#"+d_model+"_create_user").val();
                }
            },
            aoColumns: [
                { "data": "id" },
                { "data": "message_title" },
                { "data": "message_content" },
                { "data": "create_time" },
                { "data": "msg_is_read" },
                { "data": "create_user" }
            ]
        }, Settings.paging);
    }

    /** 添加工具菜单栏 **/
    function add_tools_control(d_model){
        var listener = {
            success:function(data){
                var html = template(d_model+'_table_tools', {model: d_model, power: data.json.power});
                $("#"+d_model+"_tool_bar").html(html);
                add_tools_listener(d_model);
            },
            error:function(xhr,status){ Tools.group('Request Modle Powers Error.', xhr, status);}
        }
        PageRequest.get_model_permision({'model':d_model}, listener);
    }

    /** 添加工具栏监听 **/
    function add_tools_listener(d_model){
        $("#"+d_model+"_inf").on("click", click_inf);
        $("#"+d_model+"_add").on('click', click_add);
        $("#"+d_model+"_del").on('click', click_del);
        $("#"+d_model+"_search").on('click', click_search);
    }

    function click_search(){
        table.ajax.reload(function(){ Tools.info("Reqeust Finished.");},true);
    }


    //查看
    function click_inf(){
        var option = "info";
        var push_message_id = TableTools.get_table_selected(table, 'id');
        var json_array = {option: 'readmessage', message_id: push_message_id};
        if(push_message_id !== null){
            PageRequest.get_push_message_by_id(
                {id:push_message_id},
                {
                    success:function(data){
                        var temp_data = data.json.push_message;
                        temp_data.change = option;
                        var html_str = template('temp_main_notice_show', temp_data);
                        var lisenler = {
                            option: 'info',
                            body: html_str,
                            sure_show: "确认",
                            sure:function(){
                                if(ValidData(Settings.Socket)){ Settings.Socket.send(CharTools.json2str(json_array)); }
                                OpenModal.close();
                                click_search();
                            }

                        };
                        OpenModal.open(lisenler);
                    }
                }
            );
        }else{
            OpenModal.open_alert({option: 'warn', body: '请先选择一条数据后操作！'});
        }
    }

    // 新增事件
    function click_add(){
        var option = "add";
        var push_message_html = template('temp_main_notice_show',{ change: option});
        var push_message_lisenler = {
            option: option,
            body: push_message_html,
            sub_show: "确认添加",
            sure:function(){
                if (valid_form().form()){
                    var push_message_title = $("#push_message_title").val();
                    var push_message_content = $("#push_message_content").val();
                    var push_message_head_acc = $("#push_acc_id").val();
                    var re_data = { message_title: push_message_title, message_content:push_message_content, username:push_message_head_acc};
                    PageRequest.add_push_message( re_data,
                        {
                            success:function(data){
                                var info = {
                                    option: 'info',
                                    body: '推送消息新增成功！',
                                    sure: function(){
                                        OpenModal.close();
                                        click_search();
                                    }
                                }
                                OpenModal.open_alert(info);
                                Tools.group("Add push_message Success.", data);
                            }
                        }
                    );
                }else {
                    Tools.info("表单本地验证失败");
                }
            }
        }
        OpenModal.open(push_message_lisenler);
        // 初始化联想查询
        init_lenovo_head_acc();
    }

    //验证表单
    function valid_form() {
        return $("#push_message_form").validate({
            rules: {
                push_message_title:{isValidity:true},
                push_acc:{isValidity:true}
            },
            messages: {
                push_message_title:{required:"请填写"},
                push_acc:{required:"请选择"}
            },
            errorClass: "error",
            success: 'valid',
            unhighlight: function (element, errorClass) { //验证通过
                $(element).tooltip('destroy').removeClass(errorClass);
            },
            errorPlacement: function (error, element) {
                if ($(element).next("div").hasClass("tooltip")) {
                    $(element).attr({"data-original-title": $(error).text()}).tooltip("show");
                } else {
                    $(element).attr({"title":$(error).text()}).tooltip("show");
                }
            }
        });
    }

    /** 确认禁用 **/
    function click_del(){
        var option = "delete";
        var push_message_id = TableTools.get_table_selected(table, 'id');
        var message_title = TableTools.get_table_selected(table, 'message_title');
        var create_time = TableTools.get_table_selected(table, 'create_time');
        if(push_message_id !== null){
            var del_push_message_html = '确认删除  ' + message_title + '('+ create_time +')  消息？';
            var del_push_message_listener = {option: option, body: del_push_message_html, sure_show: "确认删除",
                sure:function(){
                    PageRequest.del_push_message(
                        {push_message_id: push_message_id},
                        {
                            success:function(data){
                                var info = { option: 'info', body: '消息删除成功！', sure: function(){ OpenModal.close_confirm();}};
                                OpenModal.open_alert(info);
                                click_search();
                                Tools.group("Delete Push Message Success.", data);
                            },
                            error:function(hxr,htmls){
                                OpenModal.open_alert({
                                    option: 'warn',
                                    body: htmls,
                                    sure: function(){ OpenModal.close_confirm();}
                                });
                                Tools.group("Delete Push Message Error.", hxr, htmls);
                            }
                        }
                    );
                }
            };
            OpenModal.open_confirm(del_push_message_listener);
        }else{
            OpenModal.open_alert({option:'warn',body:'请先选择一条数据后操作！'});
        }
    }


    /** 获取选中纪录某个字段 **/
    function init_lenovo_head_acc(){
        $("#push_acc").autocomplete({
            source: function(request, response) {
                var dim_data = {dim:request.term}
                PageRequest.get_account_lenovo(dim_data, {
                    success:function(data){
                        response($.map(data.json, function(item){ return { label: item.username, value: item.id}}));
                    },
                    error:function(hxr, htmls){
                        OpenModal.open_alert({option:'warn',body:'网络错误，请稍候重试！'});
                        Tools.group("Loading Push Message Error.", hxr, htmls);
                    }
                });
            },
            minLength: 1,
            select: function(event, ui) {
                $("#push_acc_id").val(ui.item.value);
                this.value = ui.item.label;
                return false;
            },
            focus: function(event, ui){
                $("#push_acc_id").val(ui.item.value);
                $("#push_acc").val(ui.item.label);
                return false;
            }
        });

        $("#push_acc").on("keydown",function(event){
            if(event.keyCode===8){
                $("#push_acc_id").val("");
                $("#push_acc").val("");
            }
        });
    }

})