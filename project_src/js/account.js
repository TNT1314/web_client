$(function () {
    "use strict"

    try{
        var model = 'account';
        // 获取table初始化参数
        var options = get_table_options(model);
        // 初始化列表
        var table = $('#'+model+'_table').DataTable(options);
        // 添加列表单选监听
        TableTools.selected_listener(table, model+'_table');
        // 添加工具栏
        add_tools_control(model);
    }catch(e){
        Tools.group('Run Model Account Error.', e);
    }

    /** ----------------------------------- 内部方法 ----------------------------------------**/
    /** 获取table初始化参数 **/
    function get_table_options(d_model){
        return $.extend(
        {
            dom: '<"#'+d_model+'_tool_bar">frtip',
            ajax:{
                url: TableTools.get_url('/fmap/api/account/list/get'),
                type: TableTools.ajax_type,
                dataType: TableTools.ajax_format,
                data: function(params){
                    params.name = $("#"+d_model+"_name").val();
                    params.username = $("#"+d_model+"_username").val();
                    params.mobile = $("#"+d_model+"_mobile").val();
                    params.email = $("#"+d_model+"_email").val();
                }
            },
            aoColumns: [
                { "data": "id" },
                { "data": "username" },
                { "data": "name" },
                { "data": "mobile1" },
                { "data": "mobile2" },
                { "data": "email" }
            ]
        }, Settings.paging);
    }

    /** 初始化工具栏 **/
    function add_tools_control(d_model){
        var listener = {
            success:function(data){
                var tools = template('account_table_tools', {model: d_model, power: data.json.power});
                // 初始化菜单
                $("#"+d_model+"_tool_bar").html(tools);
                add_tools_listener(d_model);
                NavOpenAction.do_some_action();
            },
            error:function(xhr,status){ Tools.group('Request Modle Powers Error.', xhr, status);}
        }
        PageRequest.get_model_permision({'model':d_model}, listener);
    }

    /** 工具栏监听 **/
    function add_tools_listener(dmodel){
        $("#"+dmodel+"_inf").on("click", click_inf);
        $("#"+dmodel+"_add").on('click', click_add);
        $("#"+dmodel+"_edi").on('click', click_edi);
        $("#"+dmodel+"_del").on('click', click_del);
        $("#"+dmodel+"_search").on('click', click_search);
    }

    /** 点击查询 **/
    function click_search(){
        table.ajax.reload(function(){ Tools.info("Reqeust Done Finished.");}, true);
    }

    //查看数据
    function click_inf(){
        var id = TableTools.get_table_selected(table, 'id');
        if(id !== null){
            var rq_data = {id:id};
            PageRequest.get_account_by_id(
                rq_data,
                {
                    success: function (data) {
                        var temp_data = data.json.account;
                        temp_data.change = 'info';
                        temp_data.model = 'account';
                        temp_data.server = Settings.server;
                        var html_str = template('temp_account_change', temp_data);
                        var lisenler = {
                            option: 'info', body: html_str, server: Settings.server, sure_show: "确认",
                            sure: function () { OpenModal.close();}
                        };
                        //展开
                        OpenModal.open(lisenler);
                        $("#add_role").hide();
                    }
                }
            );
        }else{
            OpenModal.open_alert({option:'warn',body:'请先选择一条数据后操作！'});
        }
    }

    // 新增事件
    function click_add(){
        var option = 'add';
        NavOpenAction.get_cached_action();
        var listener = {
            success:function(data){
                /** 初始化模版 **/
                var industrys = data.json;
                var add_html = template('temp_account_change',
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
                        if (valid_form().form()){
                            $(":disabled").removeAttr("disabled");
                            var add_data = $("#account_form").serializeObject();
                            Tools.info($("#account_form").serialize());
                            PageRequest.change_account(
                                add_data,
                                {
                                    success:function(data){
                                        var warm = {
                                            option: 'info',
                                            body: '人员信息增加成功！',
                                            sure: function(){
                                                OpenModal.close();
                                                click_search();
                                            }
                                        }
                                        OpenModal.open_alert(warm);
                                        Tools.group("Add Account Success.", data);
                                    },
                                    error:function(code, message){
                                        OpenModal.open_alert({ option: 'warn', body: '错误信息：'+message+'('+code+')' });
                                    }
                                });
                        }else {
                            Tools.info("Form Validate Fail!");
                        }
                    }
                }
                OpenModal.open(add_listener);
                // 初始化联想查询
                init_lenovo_role();
                
                $("#avatar").on("change", image2base64);
                
                $("#avatar_id").on("click", function () {
                    $("#avatar").click();
                });
                $("#add_role").on("click",add_role);
            }
        };
        PageRequest.get_account_choice(listener);
    }

    /** 修改事件 **/
    function click_edi(){
        // 声明操作类型
        var option = "edit";
        NavOpenAction.get_cached_action();
        var account_id = TableTools.get_table_selected(table, 'id');
        if(account_id !== null){
            var load_industry_listener = {
                success:function(back_data){
                    var industrys = back_data.json;
                    PageRequest.get_account_by_id(
                        {id:account_id},
                        {
                            success:function(data){
                                var edit_temp_data = data.json.account;
                                edit_temp_data.change = option;
                                edit_temp_data.model = model;
                                edit_temp_data.server = Settings.server;
                                edit_temp_data.indu_choice = industrys;
                                Tools.info("模版渲染工具");
                                var edit_html = template('temp_account_change', edit_temp_data);
                                var edit_listener = {
                                    option: option,
                                    body: edit_html,
                                    sure_show: "确认修改",
                                    sure:function(){
                                        if (valid_form().form()){
                                            $(":disabled").removeAttr("disabled");
                                            $("#add_role").on("click",add_role());
                                            var add_data = $("#account_form").serializeObject();
                                            Tools.info($("#account_form").serialize());
                                            PageRequest.change_account(
                                                add_data,
                                                {
                                                    success:function(data){
                                                        var warm = {
                                                            option: 'info',
                                                            body: '人员信息修改成功！',
                                                            sure: function(){
                                                                OpenModal.close();
                                                                click_search();
                                                            }
                                                        }
                                                        OpenModal.open_alert(warm);
                                                        Tools.group("Change Account Success.", data);
                                                    },
                                                    error:function(code, message){
                                                        OpenModal.open_alert({ option: 'warn', body: '错误信息：'+message+'('+code+')' });
                                                    }
                                                })
                                        }else {
                                            Tools.info("Form Validate Fail!");
                                        }
                                    }
                                };
                                OpenModal.open(edit_listener);
                                
                                $("#avatar").on("change", image2base64);
                                $("#avatar_id").on("click", function () {
                                    $("#avatar").click();
                                });
                                $("#add_role").on("click",add_role);

                                // 初始化联想查询
                                init_lenovo_role();
                            }
                        }
                    );
                }
            };
            PageRequest.get_account_choice(load_industry_listener);
        }else{
            OpenModal.open_alert({option:'warn',body:'请先选择一条数据后操作！'});
        }
    }

    //验证表单
    function valid_form() {
        return $("#account_form").validate({
            rules: {
                name:{isValidity:true},
                identity_card:{isIdentityCard:true},
                mobile1:{isMobile:true},
                mobile2:{isMobile:true},
                email:{isEmail:true},
                username:{isValidity:true},
                password:{isValidity:true},
                account_acc:{isValidity:true}
            },
            messages: {
                identity_card:{required:"请填写"},
                mobile1:{required:"请填写"},
                email:{required:"请填写"},
                username:{required:"请填写"},
                password:{required:"请填写"},
                account_acc:{required:"请选择"}
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

    // 确认禁用
    function click_del(){
        var account_id = TableTools.get_table_selected(table, 'id');
        var account_name = TableTools.get_table_selected(table, 'name');
        if(account_id !== null){
            var del_body = '确认删除 ' + account_name + '账号信息？';
            var del_listener = {
                option: 'delete',
                body: del_body,
                sure_show: "确认删除",
                sure:function(){
                    PageRequest.del_account(
                        {id: account_id},
                        {
                            success:function(data){
                                var info = { option: 'info', body: '账号删除成功！', sure: function(){ OpenModal.close_confirm();}};
                                OpenModal.open_alert(info);
                                click_search();
                                Tools.group("Delete Account Success.", data);
                            },
                            error:function(hxr,htmls){
                                OpenModal.open_alert({option: 'warn', body: '网络错误，请稍候重试！'});
                                Tools.group("Delete Region Error.", hxr, htmls);
                            }
                        }
                    );
                }
            };
            OpenModal.open_confirm(del_listener);
        }else{
            OpenModal.open_alert({option: 'warn', body: '请先选择一条数据后操作！'});
        }
    }
    // 初始化联想查询
    function init_lenovo_role(){
        $("#account_acc").autocomplete({
            source: function(request, response) {
                var dim_data = {dim:request.term}
                PageRequest.get_base_role_list(dim_data, {
                    success:function(data){
                        response($.map(data.json, function(item){ return { label: item.name, value: item.id}}));
                    },
                    error:function(hxr, htmls){
                        OpenModal.open_alert({option:'warn',body: htmls});
                        Tools.group("Loading Region Duty Person Error.", hxr, htmls);
                    }
                });
            },
            minLength: 1,
            select: function(event, ui) {
                $("#account_acc_id").val(ui.item.value);
                this.value = ui.item.label;
                return false;
            },
            focus: function(event, ui){
                $("#account_acc_id").val(ui.item.value);
                $("#account_acc").val(ui.item.label);
                return false;
            }
        });

        $("#head_acc").on("keydown",function(event){
            if(event.keyCode===8){
                $("#account_acc_id").val("");
                $("#account_acc").val("");
            }
        });
    }
    function add_role(){
        NavTable.open_menu_by_name_new("权限管理", {
            model: 'role',
            action: 'add'
        });
    }
    function image2base64(e) {
        var file = $(e.target).prop("files")[0]; //获取file对象
        var element_id = $(e.target).attr("id");

        //判断file的类型是不是图片类型。
        var reader = new FileReader(); //声明一个FileReader实例
        reader.readAsDataURL(file); //调用readAsDataURL方法来读取选中的图像文件
        //最后在onload事件中
        reader.onload = function () {
            var image_result = this.result;
            $("#avatar_id").attr("src", image_result);
            image_result = image_result.split('base64,')[1];
            $("#" + element_id + "_hidden").val(image_result);
        };
    }

});