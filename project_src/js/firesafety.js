$(function () {
    "use strict"
    
    try{
        var model = 'firesafety';
        
        //定义表单初始化选项
        var option = get_table_option(model);
        var table = $('#'+model+'_table').DataTable(option);
        
        //单选监听
        TableTools.selected_listener(table, model+'_table');
        
        //添加工具栏
        add_tools_control(model);
    }catch(e){
        Tools.group('Running Model Firesafety Error.', e);
    }
    
    /** -------------------------------------------------------------------------- **/
    // 获取列表配置
    function get_table_option(d_model){
        return $.extend({
            dom: '<"#'+d_model+'_tool_bar">frtip',
            ajax:{
                url: TableTools.get_url('/fmap/api/firesafety/list/get'),
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
        $("#"+dmodel+"_add").on('click', click_add);
        $("#"+dmodel+"_recheck").on('click', click_recheck)
        $("#"+dmodel+"_edi").on('click', click_edi);
        $("#"+dmodel+"_upload_image").on('click', click_upload_image);
        $("#"+dmodel+"_sub").on('click', click_sub);
        $("#"+dmodel+"_pri").on('click', click_pri);
        $("#"+dmodel+"_del").on('click', click_del);
    }
    
    // 高级查询
    function click_search(){
        table.ajax.reload(function(){ Tools.info("Reqeust Finished.");},true);
    }
    
    
    function click_inf(){
        // 声明操作类型
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
                    Tools.group("ccc1",data);
                    var temp_data = data.json.firesafety;
                    temp_data.change = option;
                    temp_data.model = model;
                    temp_data.server = Settings.server;
                    
                    Tools.group("工单数据:", temp_data);
                    
                    /** 通过配置加载 **/
                    temp_data.item_set = change_back_data(temp_data.item_set, temp_data.item);
                    var html = template('temp_'+model+'_change', temp_data);
                    var lisenler = {option: option, body: html, sure_show: "确认", sure:function(){ OpenModal.close();}};
                    OpenModal.open(lisenler);
                }
            };
            PageRequest.get_firesafety_by_id({id:id}, listener);
        }else{
            OpenModal.open_alert({option:'warn',body:'请先选择一条数据后操作！'});
        }
    }
    
    function click_pri(){
        // 声明操作类型
        var id  = TableTools.get_table_selected(table, 'id');
        if(id !== null){
            window.open(Settings.server+'/fmap/api/pdf/print/firesafetybill?id='+id);
        }else{
            OpenModal.open_alert({option:'warn',body:'请先选择一条数据后操作！'});
        }
    }
    
    // 新增事件
    function click_add(){
        var option = 'add';
        var shopname;
        var shopid;
        var action =  NavOpenAction.get_cached_action();
        Tools.group("ccc",action);
        if (action != null && action.action == "add"){
            shopname = action.data.name;
            shopid = action.data.id;
        }
        Tools.group("ddd",shopname);

        var load_listener = {
            success:function(data){
                /** 初始化模版 **/
                data.shop_name = shopname;
                data.shop_id = shopid;
                var html = template('temp_'+model+'_change',{change: option, model: model, server: Settings.server, bill_type: 1,item_set: data.json.settings,shop_name:data.shop_name,shop:data.shop_id});
                
                /** 模版监听函数 **/
                var add_lisenler = { 
                    option: option,
                    body: html,
                    sure_show: "确认添加",
                    sure:function(){
                        $(":disabled").removeAttr("disabled");
                        var add_data = serializeform();
                        Tools.group("Add Firesafety.", add_data);
                        PageRequest.change_firesafety( 
                            add_data,
                            {
                                success:function(data){
                                    OpenModal.open_alert({ option: 'info', body: data.code_desc,
                                        sure: function(){  OpenModal.close(); click_search();}});
                                    Tools.group("Add Firesafety Success.", data);
                                }
                            }
                        );
                    }
                }
                
                OpenModal.open(add_lisenler);
                add_listener_in_add();   
            },
            error:function(hxr, html){
                OpenModal.open_alert({option: 'warn',body: '网络错误，请稍候重试！',sure: function(){ OpenModal.close_alert();}});
                Tools.group("Loading Bill Settings.", hxr, html);
            }
        };
        PageRequest.get_firesafety_setting(load_listener);
    }
    
    // 新增复检单据
    function click_recheck(){
        var option = "add";
        var id = TableTools.get_table_selected(table, 'id');

        var action =  NavOpenAction.get_cached_action();
        Tools.group("eee",action);
        if (action != null && action.action == "recheck"){
            id = action.data.id;
        }else {
            id  = TableTools.get_table_selected(table, 'id');
        }
        
        if(id !== null){
            var listener = {
                success:function(data){
                    var temp_data = data.json.firesafety;
                    if(!temp_data.qualified && temp_data.recheck_status==1){
                        temp_data.change = option;
                        temp_data.model = model;
                        temp_data.server = Settings.server;
                        temp_data.parent = temp_data.id;
                        temp_data.id = null;
                        temp_data.code = null;
                        temp_data.bill_type = 2;
                        temp_data.item_set = change_back_data(temp_data.item_set, temp_data.item);
                        temp_data.item_set = get_not_qualified_set(temp_data.item_set, temp_data.item);

                        var html = template('temp_'+model+'_change', temp_data);
                        var edit_lisenler = { 
                            option: option,  body: html, sure_show: "提交复检单",
                            sure:function(){
                                $(":disabled").removeAttr("disabled");
                                var req_data = serializeform();
                                PageRequest.change_firesafety(
                                    req_data,
                                    {
                                        success:function(data){
                                            var info = { 
                                                option: 'info', body: data.code_desc,
                                                sure: function(){
                                                    OpenModal.close();
                                                    click_search();
                                                }
                                            }
                                            OpenModal.open_alert(info);
                                            Tools.group("Update Firesafety Success.", data);
                                        }
                                    }
                                );
                            }
                        };
                        OpenModal.open(edit_lisenler);
                        add_listener_in_add();
                    }else{
                        var code = TableTools.get_table_selected(table, 'code');
                        OpenModal.open_alert({option: 'info', body: "工单（"+code+")：已合格或已复检，请确认后操作！"});
                    }
                }
            };
            PageRequest.get_firesafety_by_id({id:id}, listener);
        }else{
            OpenModal.open_alert({option:'warn',body:'请先选择一条数据后操作！'});
        }
    }
    
    function click_edi(){
        // 声明操作类型
        var option = "edit";
        var id;
        var action =  NavOpenAction.get_cached_action();
        if (action != null && action.action == "edi"){
            id = action.data.id;
        }else {
            id  = TableTools.get_table_selected(table, 'id');
        }
        if(id !== null){
            var listener = {
                success:function(data){
                    var temp_data = data.json.firesafety;
                    temp_data.change = option;
                    temp_data.model = model;
                    temp_data.server = Settings.server;
                    
                    /** 通过配置加载 **/
                    temp_data.item_set = change_back_data(temp_data.item_set, temp_data.item);
                    
                    var edit_html = template('temp_'+model+'_change', temp_data);
                    var edit_lisenler = { 
                        option: option,
                        body: edit_html,
                        sure_show: "确认修改",
                        sure:function(){
                            $(":disabled").removeAttr("disabled");
                            var req_data = serializeform();
                            PageRequest.change_firesafety(
                                req_data,
                                {
                                    success:function(data){
                                        OpenModal.open_alert({ 
                                            option: 'info', body: data.code_desc,
                                            sure: function(){
                                                OpenModal.close();
                                                click_search();
                                            }
                                        });
                                        Tools.group("Update Firesafety Success.", data);
                                    }
                                }
                            );
                        }
                    };
                    OpenModal.open(edit_lisenler);
                    add_listener_in_add();
                }
            };
            PageRequest.get_firesafety_by_id({id:id}, listener);
        }else{
            OpenModal.open_alert({option:'warn',body:'请先选择一条数据后操作！'});
        }
    }
    
    function click_upload_image(){
        // 声明操作类型
        var option = "add";
        var id = TableTools.get_table_selected(table, 'id');
        
        if(id !== null){
            var load_data_listener = {
                success:function(data){
                    var temp_data = data.json.firesafety;
                    Tools.group("FireSafety Bills Data.", temp_data);
                    temp_data.model = model;
                    temp_data.server = Settings.server;
                    var html = template('temp_'+model+'_upload_image', temp_data);
                    var lisenler = { 
                        option: option,  
                        body: html, 
                        sure_show: "确认提交",
                        sure:function(){
                            var req_data = serialize_upload_form();
                            if(validate_upload(req_data)){
                                PageRequest.upload_firesafety_images(
                                    req_data,
                                    {
                                        success:function(data){
                                            var info = { 
                                                option: 'info', body: data.code_desc,
                                                sure: function(){
                                                    OpenModal.close();
                                                    click_search();
                                                }
                                            }
                                            OpenModal.open_alert(info);
                                            Tools.group("Update Firesafety Success.", data);
                                        }
                                    }
                                );
                            }else{
                                OpenModal.open_alert({
                                    option: 'warm', 
                                    body: '上传图片的内容不能超过10M！'
                                });
                            }  
                        }
                    };
                    OpenModal.open(lisenler);
                    $("#"+model+"_add_uploads").on("click", click_add_uploads);
                }
            };
            PageRequest.get_firesafety_by_id({id:id}, load_data_listener);
        }else{
            OpenModal.open_alert({option:'warn',body:'请先选择一条数据后操作！'});
        }
        
        var fire_dom = 0;
        // 增加新控件
        function click_add_uploads(e){
            fire_dom++;
            var up_dom = [];
            up_dom.push('<div class="row model_div_row">');
            up_dom.push('   <div class="col-sm-2">');
            up_dom.push('       <label class="model_div_span">请选择图片</lable>');
            up_dom.push('   </div>');
            up_dom.push('   <div class="col-sm-9">');
            up_dom.push('       <input type="file" id="'+model+'_image_'+fire_dom+'" class="form-control model_div_input" />');
            up_dom.push('       <input type="hidden" id="'+model+'_image_'+fire_dom+'_hidden" class="form-control '+model+'_uplad_images" />');
            up_dom.push('   </div>');
            up_dom.push('   <div class="col-sm-1" style="line-height:34px;">');
            up_dom.push('       <a id="'+model+'_close" class="btn btn-block btn-sm">');
            up_dom.push('           <i class="fa fa-times"></i>移除');
            up_dom.push('       </a>');
            up_dom.push('   </div>');
            up_dom.push('</div>');
            
            $(e.target).parent().parent().before(up_dom.join(''));
            $("#"+model+"_close").on("click",function(e){
                $(e.target).parent().parent().remove();
            });
            $("#"+model+"_image_"+fire_dom).on("change", image2base64);
            
            function image2base64(e){
                var file = $(e.target).prop("files")[0]; //获取file对象
                var element_id = $(e.target).attr("id");

                //判断file的类型是不是图片类型。
                var reader = new FileReader(); //声明一个FileReader实例
                reader.readAsDataURL(file); //调用readAsDataURL方法来读取选中的图像文件
                //最后在onload事件中
                reader.onload = function(){
                    var image_result = this.result;
                    image_result = image_result.split('base64,')[1];
                    $("#"+element_id+"_hidden").val(image_result);
                }
            }
        }
    }
    
    /** 提交方法 **/
    function click_sub(){
        var id = TableTools.get_table_selected(table, 'id');
        var code = TableTools.get_table_selected(table, 'code');
        
        if(id !== null){
            var sub_html = '提交消防工单（' + code + '）？ <br/>提交后，工单将不能进行更改及上传抽查图片！';
            var sub_listener = {
                option: "confirm",
                body: sub_html,
                sure_show: "确认提交",
                sure:function(){
                    PageRequest.sub_firesafety(
                        {id: id},
                        {
                            success:function(data){
                                if(data.code === 0){
                                    OpenModal.open_alert({
                                        option: 'info',
                                        body: data.code_desc,
                                        sure: function(){
                                            OpenModal.close_confirm();
                                        }
                                    });
                                    click_search();
                                    Tools.group("Submit Firesafaty Success.", data);
                                }else{
                                    OpenModal.open_alert({option:'warn', body: data.code_desc});
                                }
                            }
                        }
                    );
                }
            };
            OpenModal.open_confirm(sub_listener);
        }else{
            OpenModal.open_alert({option:'warn',body:'请先选择一条数据后操作！'});
        }
    }
    
    /** 提交方法 **/
    function click_del(){
        var id = TableTools.get_table_selected(table, 'id');
        var code = TableTools.get_table_selected(table, 'code');
        
        if(id !== null){
            var sub_html = '删除消防工单（' + code + '）？ <br/>删除后，工单将不能进行浏览，更改及上传抽查图片！';
            var sub_listener = {
                option: "delete",
                body: sub_html,
                sure_show: "确认删除",
                sure:function(){
                    PageRequest.del_firesafety(
                        {id: id},
                        {
                            success:function(data){
                                if(data.code === 0){
                                    OpenModal.open_alert({
                                        option: 'info',
                                        body: data.code_desc,
                                        sure: function(){
                                            OpenModal.close_confirm();
                                        }
                                    });
                                    click_search();
                                    Tools.group("Submit Firesafaty Success.", data);
                                }else{
                                    OpenModal.open_alert({option:'warn', body: data.code_desc});
                                }
                            }
                        }
                    );
                }
            };
            OpenModal.open_confirm(sub_listener);
        }else{
            OpenModal.open_alert({option:'warn',body:'请先选择一条数据后操作！'});
        }
    }
    
    
    /** 初始化监听事件 **/
    function add_listener_in_add(){
        FormTools.group_checked(model+"_form");
        init_lenovo_shop();
        cheked_group_change();
        // 是否合格组件监听
        some_dom_listener();
    }
    
    /** 初始化商铺联想查询 **/
    function init_lenovo_shop(){
        $("#"+model+"_shop_name").autocomplete({
            source: function(request, response) {
                var dim_data = { dim:request.term }
                PageRequest.get_shop_lenovo(dim_data, {
                    success:function(data){
                        response($.map(data.json, function(item){ return {label: item.name, value: item.id}}));
                    },
                    error:function(hxr, htmls){
                        OpenModal.open_alert({option:'warn',body:'网络错误，请稍候重试！'});
                        Tools.group("Loading Region Duty Person Error.", hxr, htmls);
                    }
                });
            },
            minLength: 1,
            select: function(event, ui) {
                $("#"+model+"_shop").val(ui.item.value);
                this.value = ui.item.label;
                return false;
            },
            focus: function(event, ui){
                $("#"+model+"_shop").val(ui.item.value);
                $("#"+model+"_shop_name").val(ui.item.label);
                return false;
            }
        });
        
        $("#"+model+"_shop_name").on("keydown",function(event){
            if(event.keyCode===8){
                $("#"+model+"_shop").val("");
                $("#"+model+"_shop_name").val("");
            }
        });
    }
    
    /** 组勾选事件 **/
    function cheked_group_change(){

        $("."+model+"_group").on("click", function(e){
            $(e.target).parent().siblings().find($("."+model+"_group_no")).each(function(index,ele){
                $(ele).attr("checked", false);
            });
            if ($(e.target).is(':checked')){
                $(e).attr("checked", false);
            }else {
                $(e).attr("checked", true);
            }

            if($("."+model+"_group").length == $("."+model+"_group:checked").length){
                $("#"+model+"_qualified").attr("disabled", false);
                $("#"+model+"_no_qualified").attr("disabled", false);
                $("#"+model+"_qualified").click();
                $("#"+model+"_qualified").attr("disabled", true);
                $("#"+model+"_no_qualified").attr("disabled", true);
            }else{
                if($("."+model+"_group:checked").length === 0 && $("."+model+"_group_no:checked").length === 0){
                    $("#"+model+"_qualified").attr("disabled", false);
                    $("#"+model+"_no_qualified").attr("disabled", false);
                    $("#"+model+"_no_qualified").click();
                    $("#"+model+"_qualified").attr("disabled", true);
                    $("#"+model+"_no_qualified").attr("disabled", true);
                }else if (!$("#"+model+"_no_qualified").is(':checked')){
                    $("#"+model+"_qualified").attr("disabled", false);
                    $("#"+model+"_no_qualified").attr("disabled", false);
                    $("#"+model+"_no_qualified").click();
                    $("#"+model+"_qualified").attr("disabled", true);
                    $("#"+model+"_no_qualified").attr("disabled", true);
                }
            }
        });

        $("."+model+"_group_no").on("click", function(e){
            $(e.target).parent().siblings().find($("."+model+"_group")).each(function(index,ele){
                $(ele).attr("checked", false);
            });
            if ($(e.target).is(':checked')){
                $(e).attr("checked", false);
            }else {
                $(e).attr("checked", true);
            }

            if($("."+model+"_group_no:checked").length === 0 && $("."+model+"_group:checked").length === 0){
                $("#"+model+"_qualified").attr("disabled", false);
                $("#"+model+"_no_qualified").attr("disabled", false);
                $("#"+model+"_no_qualified").click();
                $("#"+model+"_qualified").attr("disabled", true);
                $("#"+model+"_no_qualified").attr("disabled", true);
            }else{
                if (!$("#"+model+"_no_qualified").is(':checked')){
                    $("#"+model+"_qualified").attr("disabled", false);
                    $("#"+model+"_no_qualified").attr("disabled", false);
                    $("#"+model+"_no_qualified").click();
                    $("#"+model+"_qualified").attr("disabled", true);
                    $("#"+model+"_no_qualified").attr("disabled", true);
                }
            }
        });
    }
    
    /** some dom listener **/
    function some_dom_listener(){
        $("input[name='"+model+"_qualified']").on('click', function(){
            if($("#"+model+"_no_qualified").is(':checked')){
                $("."+model+"_recheck_date_type").removeClass('model_div_row_hidde');
            }else{
                $("."+model+"_recheck_date_type").addClass('model_div_row_hidde');
            }
        });

        $(".item_checkbox").on("click", function (e) {
            var check_box = $(e.target).is(':checked');
            $(e.target).parent().siblings().find($(".item_checkbox")).each(function(index,ele){
                $(ele).attr("checked", false);
            });
            if (check_box !== true){
                $(e).attr("checked", false);
            }else {
                $(e).attr("checked", true);
            }
        });
    }
    
    /** 序列化表单结果 **/
    function serializeform(){
        var form_data = {};
        form_data.id = $("#"+model+"_id").val();
        form_data.bill_type = $("#"+model+"_bill_type").val();
        form_data.item_set = $("#"+model+"_item_set").val();
        form_data.code = $("#"+model+"_code").val();
        form_data.shop = $("#"+model+"_shop").val();
        form_data.shop_has_procedure = $("#"+model+"_shop_has_procedure").is(':checked') ? true:false;
        form_data.shop_escort = $("#"+model+"_shop_escort").val();
        form_data.qualified = $("#"+model+"_qualified").is(':checked') ? true:false;
        form_data.recheck_date_type = $("#"+model+"_recheck_date_type").val();
        form_data.parent = $("#"+model+"_parent").val();
        
        var item_get = CharTools.str2array(form_data.item_set);
        var records = [];
        for(var i=0;i<item_get.length;i++){
            var one_item = item_get[i];
            var record = {}
            record.code = one_item.code;
            record.name = one_item.name;
            record.group_code = one_item.group_code;
            record.group_name = one_item.group_name;
            record.qualified = $("#"+one_item.code+"_qualified").is(':checked') ? true:false;
            record.type = 'MAIN';
            record.have = false;
            record.choice = null;
            record.figure = null;
            record.other = null;
            record.note = $("#"+one_item.code+"_note").val();
            records.push(record);
            for(var c=0;c<one_item.childs.length;c++){
                var one_child = one_item.childs[c];
                var child = {};
                child.code = one_child.code;
                child.name = one_child.name;
                child.group_code = one_child.group_code;
                child.group_name = one_child.group_name;
                child.qualified = false;
                child.type = 'ASSIST';
                child.have = $("#"+one_child.code+"_have").is(':checked') ? true:false;
                
                Tools.group("child", $("input[name='"+one_child.code+"_choice']:checked")[0]);
                
                child.choice = $("input[name='"+one_child.code+"_choice']:checked").length==1 ? $("input[name='"+one_child.code+"_choice']:checked").val() : null;
                
                child.figure = ValidData($("#"+one_child.code+"_figure").val()) ? $("#"+one_child.code+"_figure").val() : null;
                child.other = $("#"+one_child.code+"_other").val();
                child.note = $("#"+one_child.code+"_note").val();
                records.push(child);
            }
        }
        form_data.items = JSON.stringify(records);
        return form_data
    }
    
    /** 序列化图片上传表单结果 **/
    function serialize_upload_form(){
        var form_data = {};
        form_data.id = $("#"+model+"_id").val();
        
        var up_images = [];
        
        $("."+model+"_uplad_images").each(function(ind,ele){
            Tools.group("Image index", ind);
            var local_image = $(ele).val();
            if(ValidData(local_image)){
                up_images.push(local_image);
            }
        });
        form_data.images = JSON.stringify(up_images);
        return form_data
    }
    
    /** 验证图片总大小不能超过10M **/
    function validate_upload(re_data){
        var image_size = 0;
        var image_list = JSON.parse(re_data.images)
        for(var i=0;i<image_list.length;i++){
            image_size += image_list[i].length;
        }
        if(image_size > 1024*1024*10){
            return false
        }else{
            return true
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
    
    /** 获取未合格的参数进行处理 **/
    function get_not_qualified_set(item_set, item_data){
        var new_settings = [];
        var item_settings = CharTools.str2array(item_set);
        for(var i=0;i<item_settings.length;i++){
            for(var b=0;b<item_data.length;b++){
                if(item_settings[i].code==item_data[b].code && !item_data[b].qualified && item_data[b].type=='MAIN'){
                    new_settings.push(item_settings[i]);
                    break;
                }
            }
        }
        Tools.group("get_not_qualified_set", new_settings);
        return new_settings;
    }
});
    