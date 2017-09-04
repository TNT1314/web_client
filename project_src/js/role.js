$(function () {
    "use strict"

    try{
        /** 角色管理 **/
        var model = 'role';
        
        //列表初始化选项
        var option = get_table_option(model);
        var table = $("#"+model+"_table").DataTable(option);

        //增加监听
        TableTools.selected_listener(table, model+"_table");

        //初始化菜单
        add_tools_control(model);

    }catch(e){
        Tools.group('Run Model:role Error.', e);
    }
    
    /** 获取table配置选项 **/
    function get_table_option(d_model){
       return $.extend({
            dom: '<"#'+d_model+'_tool_bar">frtip',
            ajax:{
                url: TableTools.get_url('/fmap/api/role/list/get'),
                type: TableTools.ajax_type,
                dataType: TableTools.ajax_format,
                data:function(params){
                    params.code = $("#"+d_model+"_code").val();
                    params.name = $("#"+d_model+"_name").val();
                }
            },
            aoColumns: [
                { "data": "id" },
                { "data": "code" },
                { "data": "name" },
                { "data": "desc" },
                { "data": "create_user" },
                { "data": "create_time" },
                { "data": "change_user" },
                { "data": "change_time" }
            ]
        }, Settings.paging);
    }

    /** 增加tools_bar **/
    function add_tools_control(d_model){
        var listener = {
            success:function(data){
                var html = template(d_model+'_table_tools', {model: d_model, power: data.json.power});
                $("#"+d_model+"_tool_bar").html(html);
                add_tools_listener(d_model);
                NavOpenAction.do_some_action();
            },
            error:function(xhr,status){ Tools.group('Request Modle Powers Error.', xhr, status);}
        }
        PageRequest.get_model_permision({'model':d_model}, listener);
    }
    
    /** 增加tools监听 **/
    function add_tools_listener(d_model){
        $("#"+d_model+"_search").on('click', click_search);
        $("#"+d_model+"_inf").on("click", click_inf);
        $("#"+d_model+"_add").on('click', click_add);
        $("#"+d_model+"_edi").on('click', click_edi);
    }

    /** 查询列表 **/
    function click_search(){
        table.ajax.reload(function(){Tools.info("Reqeust Finished.");}, true);
    }

    /** 查看 **/
    function click_inf(){
        var option = 'info';
        var role_id;
        var action =  NavOpenAction.get_cached_action();
        if (action != null && action.action == "inf"){
            role_id = action.data.id;
        }else {
            role_id  = TableTools.get_table_selected(table, 'id');
        }
        if(role_id !== null){
            PageRequest.get_role_by_id(
                {id:role_id},
                {
                    success:function(data){
                        var temp_data = data.json.role;
                        temp_data.model = model;
                        temp_data.change = option;
                        var html_str = template('temp_role_change', temp_data);
                        var listener = {option: option,body: html_str,sure_show: "确认",
                            sure:function(){ OpenModal.close(); }
                        };
                        OpenModal.open(listener);
                        add_undo_redo_item_listener();
                    }
                }
            );
        }else{
            OpenModal.open_alert({option: 'warn', body: '请先选择一条数据后操作！'});
        }
    }

    /** 新增事件 **/
    function click_add(){
        var option = 'add';
        NavOpenAction.get_cached_action();
        var listener = {
            success:function(data){
                /** 初始化模版 **/
                var industrys = data.json;
                var add_html = template('temp_role_change',
                    {
                        change: option,
                        model: model,
                        server: Settings.server,
                        indu_choice: industrys
                    }
                );

                /** 模版监听函数 **/
                var add_listener = {
                    option: option,
                    body: add_html,
                    sure_show: "确认添加",
                    sure:function(){
                        if (valid_form().form() && check_undo_redo_to()){
                            $(":disabled").removeAttr("disabled");
                            var add_data = serializeform();
                            PageRequest.add_role(
                                add_data,
                                {
                                    success:function(data){
                                        var warm = {
                                            option: 'info',
                                            body: '角色信息增加成功！',
                                            sure: function(){
                                                OpenModal.close();
                                                click_search();
                                            }
                                        }
                                        OpenModal.open_alert(warm);
                                        Tools.group("Add Role Success.", data);
                                    },
                                    error:function(code, message){
                                        OpenModal.open_alert({ option: 'warn', body: '错误信息：'+message+'('+code+')' });
                                    }
                                })
                        }else {
                            Tools.info("表单本地验证失败");
                            if (!check_undo_redo_to()){
                                if (! $("#undo_redo_to").hasClass("tooltip")){
                                    $("#undo_redo_to").attr({"data-original-title":"请添加角色权限信息"}).tooltip("show");
                                }
                            }else {
                                $("#undo_redo_to").tooltip('destroy');
                            }
                        }
                    }
                }
                OpenModal.open(add_listener);
                add_del_roles_listener();
                add_undo_redo_item_listener();
            }
        };
        PageRequest.get_permission_info_list(listener);
    }

    /** 修改事件 **/
    function click_edi(){
        // 声明操作类型
        var option = "edit";
        var role_id;
        var action =  NavOpenAction.get_cached_action();
        if (action != null && action.action == "edi"){
            role_id = action.data.id;
        }else {
            role_id  = TableTools.get_table_selected(table, 'id');
        }
        if(role_id !== null){
            var load_industry_listener = {
                success:function(back_data){
                    var industrys = back_data.json;
                    PageRequest.get_role_by_id(
                        {id:role_id},
                        {
                            success:function(data){
                                var edit_temp_data = data.json.role;
                                edit_temp_data.change = option;
                                edit_temp_data.model = model;

                                var new_industrys = [];
                                for (var i=0;i<industrys.roles.length;i++){
                                    var item = industrys.roles[i];
                                    var flag = true;
                                    for(var j=0;j<edit_temp_data.item.length;j++){
                                        var sub = edit_temp_data.item[j];
                                        if (item.id === sub.permission.id){
                                            flag = false;
                                            edit_temp_data.item[j].value_data = industrys.roles[i];
                                            break;
                                        }
                                    }
                                    if (flag === true){
                                        new_industrys.push(item);
                                    }
                                }

                                edit_temp_data.indu_choice = new_industrys;
                                Tools.info("模版渲染工具");
                                var edit_html = template('temp_role_change', edit_temp_data);
                                var edit_listener = {
                                    option: option,
                                    body: edit_html,
                                    sure_show: "确认修改",
                                    sure:function(){
                                        if (valid_form().form() && check_undo_redo_to()){
                                            $(":disabled").removeAttr("disabled");
                                            var add_data = serializeform();
                                            PageRequest.add_role(
                                                add_data,
                                                {
                                                    success:function(data){
                                                        var warm = {
                                                            option: 'info',
                                                            body: '角色信息修改成功！',
                                                            sure: function(){
                                                                OpenModal.close();
                                                                click_search();
                                                            }
                                                        }
                                                        OpenModal.open_alert(warm);
                                                        Tools.group("Change Role Success.", data);
                                                    },
                                                    error:function(code, message){
                                                        OpenModal.open_alert({ option: 'warn', body: '错误信息：'+message+'('+code+')' });
                                                    }
                                                })
                                        }else {
                                            Tools.info("表单本地验证失败");
                                            if (!check_undo_redo_to()){
                                                if (! $("#undo_redo_to").hasClass("tooltip")){
                                                    $("#undo_redo_to").attr({"data-original-title":"请添加角色权限信息"}).tooltip("show");
                                                }
                                            }else {
                                                $("#undo_redo_to").tooltip('destroy');
                                            }
                                        }
                                    }
                                };
                                OpenModal.open(edit_listener);
                                add_del_roles_listener();
                                add_undo_redo_item_listener();
                            }
                        }
                    );
                }
            };
            PageRequest.get_permission_info_list(load_industry_listener);
        }else{
            OpenModal.open_alert({option:'warn',body:'请先选择一条数据后操作！'});
        }
    }

    /** 验证表单 **/
    function valid_form() {
        return $("#role_form").validate({
            rules: {
                role_name:{isValidity:true},
                role_desc:{isValidity:true}
            },
            messages: {
                role_name:{required:"请填写"},
                role_desc:{required:"请填写"}
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
    
    /** 遍历undo_redo_to **/
    function check_undo_redo_to() {
        var flag = false;
        if ($("#undo_redo_to").children().size() > 0){
            $("#undo_redo_to").children().find($(".item_checkd")).each(function (index,ele) {
                if ($(ele).is(':checked')){
                    flag = true;
                    return false;
                }
            });
        }
        return flag;
    }

    /** 序列化表单结果 **/
    function serializeform(){
        var form_data = {};
        form_data.id = $("#"+model+"_id").val();
        form_data.name = $("#"+model+"_name").val();
        form_data.desc = $("#"+model+"_desc").val();

        var item = [];
        $("#undo_redo_to").children().each(function (index,ele) {
            var value = $(ele).attr('data-value');
            var data_value = CharTools.str2json(value);
            var id = data_value.id;
            var flag = false;
            var items = {};
            items.id = id;
            $(ele).children().find($(".item_checkd")).each(function (i,e) {
                if ($(e).is(':checked')){
                    flag = true;
                }
                var key = $(e).attr('name');
                var val = $(e).is(':checked');
                items[key] = val;
            });
            if (flag){
                item[index] = items;
            }
        });
        form_data.item = CharTools.json2str(item);
        return form_data;
    }

    /** 监听添加、移除权限 listener **/
    function add_del_roles_listener() {
        $("#undo_redo_leftSelected").on('click', function () {
            if ($("#undo_redo").children().size() > 0){
                $("#undo_redo").children().each(function (index,ele) {
                    var selected = $(ele).attr('data-selected');
                    if (selected === 'true'){
                        var value = $(ele).attr('data-value');
                        var data_value = CharTools.str2json(value);
                        var html = template('undo_redo_to_item',
                            {
                                value: data_value
                            }
                        );
                        $("#undo_redo_to").append(html);
                        ele.remove();
                        add_undo_redo_item_listener();
                        undo_redo_item_checkd();
                    }
                });
            }
        });
        $("#undo_redo_rightSelected").on('click', function () {
            if ($("#undo_redo_to").children().size() > 0){
                $("#undo_redo_to").children().each(function (index,ele) {
                    var selected = $(ele).attr('data-selected');
                    if (selected === 'true'){
                        var value = $(ele).attr('data-value');
                        var data_value = CharTools.str2json(value);
                        var html = template('undo_redo_item',
                            {
                                value: data_value
                            }
                        );
                        $("#undo_redo").append(html);
                        ele.remove();
                        add_undo_redo_item_listener();
                    }
                });
            }
        });
        $("#undo_redo_left").on('click',function () {
            if ($("#undo_redo").children().size() > 0){
                $("#undo_redo").children().each(function (index,ele) {
                    var value = $(ele).attr('data-value');
                    var data_value = CharTools.str2json(value);
                    var html = template('undo_redo_to_item',
                        {
                            value: data_value
                        }
                    );
                    $("#undo_redo_to").append(html);
                    ele.remove();
                    add_undo_redo_item_listener();
                    undo_redo_item_checkd();
                });
            }
        });
        $("#undo_redo_right").on('click', function () {
            if ($("#undo_redo_to").children().size() > 0){
                $("#undo_redo_to").children().each(function (index,ele) {
                    var value = $(ele).attr('data-value');
                    var data_value = CharTools.str2json(value);
                    var html = template('undo_redo_item',
                        {
                            value: data_value
                        }
                    );
                    $("#undo_redo").append(html);
                    ele.remove();
                    add_undo_redo_item_listener();
                });
            }
        });

    }

    /** 监听undo_redo_item checkd选中 listener **/
    function undo_redo_item_checkd() {
        $(".item_checkd").off('click');
        $(".item_checkd").on('click',function () {
            if ($(this).is(':checked')){
                $(this).attr("value",true);
            }else {
                $(this).attr("value",false);
            }
        });
    }

    /** 监听undo_redo_item选中 listener **/
    function add_undo_redo_item_listener() {
        $(".undo_redo_item").off('click');
        $(".undo_redo_item").on('click', function () {
            $(this).siblings().each(function (index,el) {
                $(el).attr("style","background-color:#FFF;");
                $(el).attr("data-selected",false);
            });
            if ($(this).attr('data-selected') === 'true'){
                $(this).attr("style","background-color:#FFF;");
                $(this).attr("data-selected",false);
            }else {
                $(this).attr("style","background-color:#00a7d0;");
                $(this).attr("data-selected",true);
            }
        });
        $(".undo_redo_to_item").off('click');
        $(".undo_redo_to_item").on('click', function () {
            $(this).parent().siblings().each(function (index,el) {
                $(el).attr("style","background-color:#FFF;");
                $(el).attr("data-selected",false);
            });

            if ($(this).parent().attr('data-selected') === 'true'){
                $(this).parent().attr("style","background-color:#FFF;");
                $(this).parent().attr("data-selected",false);
            }else {
                $(this).parent().attr("style","background-color:#00a7d0;");
                $(this).parent().attr("data-selected",true);
            }
        });
    }
});