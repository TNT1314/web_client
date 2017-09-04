$(function () {
    "use strict"
    
    try{
        /** 区域管理 **/
        var model = 'region';
        
        //初始化列表
        var option = get_table_option(model);
        var table = $("#"+model+"_table").DataTable(option);
        
        /** 初始化工具栏菜单 **/
        add_tools_control(model);
        
        //列表单选监听
        TableTools.selected_listener(table, model+"_table");
    }catch(e){
        Tools.group('Run Model Region Error.', e);
    }
    
    /** -------------------------------------------------------------------------- **/
    /** 获取table设置参数 **/
    function get_table_option(d_model){
        return $.extend({
            dom: '<"#'+d_model+'_tool_bar">frtip',
            ajax:{
                url: TableTools.get_url('/fmap/api/region/list/get'),
                type: TableTools.ajax_type,
                dataType: TableTools.ajax_format,
                data:function(params){
                    params.code = $("#"+d_model+"_code").val();
                    params.name = $("#"+d_model+"_name").val();
                    params.hea_cc = $("#"+d_model+"_hea_cc").val();
                    params.adu_cc = $("#"+d_model+"_adu_cc").val();
                }
            },
            aoColumns: [
                { "data": "id" },
                { "data": "code" },
                { "data": "name" },
                { "data": "head_acc_name" },
                { "data": "create_user" },
                { "data": "create_time" },
                { "data": "change_user" },
                { "data": "change_time" }
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
        $("#"+d_model+"_edi").on('click', click_edi);
        $("#"+d_model+"_aud").on('click', click_aud);
        $("#"+d_model+"_del").on('click', click_del);
        $("#"+d_model+"_search").on('click', click_search);
    }
    
    function click_search(){
        table.ajax.reload(function(){ Tools.info("Reqeust Finished.");},true);
    }
    
    //查看
    function click_inf(){
        var option = "info";
        var region_id = TableTools.get_table_selected(table, 'id');
        if(region_id !== null){
            PageRequest.get_region_by_id(
                {id:region_id},
                {
                    success:function(data){
                        if(data.code===0){
                            var temp_data = data.json.region;
                            temp_data.change = option;

                            var html_str = template('temp_region_change', temp_data);

                            OpenModal.open({
                                option: 'info',
                                body: html_str,
                                sure_show: "确认",
                                sure:function(){
                                    OpenModal.close();
                                }
                            });
                            init_map_editer('info');
                        }else{
                            OpenModal.open_alert({option: 'warn', body: data.code_desc});
                        }
                        $("#add_account").hide();
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
        var load_area = { 
            success:function(data){
                var areas = data.json.areas;
                var region_html = template('temp_region_change', {change: option});
                var region_lisenler = {
                    option: option,
                    body: region_html,
                    sure_show: "确认添加",
                    sure:function(){
                        if (valid_form().form() && $("#region_points").val()!==""){
                            var region_name = $("#region_name").val();
                            var region_points = $("#region_points").val()
                            var region_head_acc = $("#head_acc_id").val()
                            var re_data = { name: region_name, points:region_points, head_acc:region_head_acc};
                            PageRequest.add_region( re_data,
                                {
                                    success:function(data){
                                        OpenModal.open_alert({
                                            option: 'info',
                                            body: data.code_desc,
                                            sure: function(){
                                                OpenModal.close();
                                                click_search();
                                            }
                                        });
                                    }
                                }
                            );
                        }else {
                            if ($("#region_points").val() === ""){
                                if (! $("#region_container").hasClass("tooltip")){
                                    $("#region_container").attr({"data-original-title":"请点击地图画出区域"}).tooltip("show");
                                }
                            }else {
                                $("#region_container").tooltip('destroy');
                            }
                        }

                    }
                }
                OpenModal.open(region_lisenler);

                $("#add_account").on("click",add_account);
                // 初始化联想查询
                init_lenovo_head_acc();

                // 初始化地图插件
                init_map_editer(option, areas);
            }
        }
        
        PageRequest.get_region_area_list({},load_area);
    }
    
    
    /** 修改事件 **/
    function click_edi(){
        
        var option = "edit";
        var region_id = TableTools.get_table_selected(table, 'id');
        if(region_id !== null){
            var load_area = { 
                success:function(data){
                    var regions_area = data.json.areas;
                    var region_load_request = {id:region_id};
                    var region_load_listener = {
                        success:function(data){
                            var temp_data = data.json.region;
                            temp_data.change = option;
                            var region_html = template('temp_region_change', temp_data);
                            var region_lisenler = {option: option, body: region_html, sure_show: "确认修改",
                                sure:function(){
                                    if (valid_form().form() && $("#region_points").val()!==""){
                                        var region_id =  $("#region_id").val();
                                        var region_name = $("#region_name").val();
                                        var region_points = $("#region_points").val()
                                        var region_head_acc = $("#head_acc_id").val()
                                        var re_data = {id:region_id, name: region_name, points:region_points, head_acc:region_head_acc};
                                        PageRequest.edi_region(
                                            re_data,
                                            {
                                                success:function(data){
                                                    OpenModal.open_alert({
                                                        option: 'info',
                                                        body: data.code_desc,
                                                        sure: function(){
                                                            OpenModal.close();
                                                            click_search();
                                                        }
                                                    });
                                                    Tools.group("Update Region Success.", data);
                                                }
                                            }
                                        );
                                    }else {
                                        Tools.info("表单本地验证失败");
                                        if ($("#region_points").val() === ""){
                                            if (! $("#region_container").hasClass("tooltip")){
                                                $("#region_container").attr({"data-original-title":"请点击地图画出区域"}).tooltip("show");
                                            }
                                        }else {
                                            $("#region_container").tooltip('destroy');
                                        }
                                    }
                                }
                            };
                            OpenModal.open(region_lisenler);

                            $("#add_account").on("click",add_account);
                            // 初始化联想查询
                            init_lenovo_head_acc();
                            // 初始化地图插件
                            init_map_editer(option, regions_area);
                        }
                    };
                    PageRequest.get_region_by_id(region_load_request, region_load_listener);    
                }
            };
            PageRequest.get_region_area_list({id:region_id},load_area);  
        }else{
            OpenModal.open_alert({option: 'warn', body: '请先选择一条数据后操作！'});
        }
    }

    //验证表单
    function valid_form() {
        return $("#region_form").validate({
            rules: {
                region_name:{isValidity:true},
                head_acc:{isValidity:true}
            },
            messages: {
                region_name:{required:"请填写"},
                head_acc:{required:"请选择"}
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
    
    /** 审批内容 **/
    function click_aud(){
        var option = 'audit';
        var region_id = TableTools.get_table_selected(table, 'id');
        var region_code = TableTools.get_table_selected(table, 'code');
        var region_name = TableTools.get_table_selected(table, 'name');
        if(region_id !== null){
            var audit_region_html = '确认  ' + region_name + '(' + region_code + ')  的区域信息真实有效？';
            var audit_region_listener = {option: option, body: audit_region_html, sure_show: "确认审核",
                sure:function(){ 
                    PageRequest.aud_region(
                        {id: region_id},
                        {
                            success:function(data){
                                var info = { option: 'info', body: '区域信息审核成功！', sure: function(){ OpenModal.close_confirm();}};
                                OpenModal.open_alert(info);
                                click_search();
                                Tools.group("Audit Region Success.", data);
                            }
                        }
                    );
                }
            };
            OpenModal.open_confirm(audit_region_listener);
        }else{
            OpenModal.open_alert({option: 'warn', body: '请先选择一条数据后操作！'});
        }
    }
    
    /** 确认禁用 **/
    function click_del(){
        var option = "delete";
        var region_id = TableTools.get_table_selected(table, 'id');
        var region_code = TableTools.get_table_selected(table, 'code');
        var region_name = TableTools.get_table_selected(table, 'name');
        if(region_id !== null){
            var del_html = '确认删除  ' + region_name + '('+ region_code +')  区域信息？';
            var del_listener = {
                option: option,
                body: del_html,
                sure_show: "确认删除",
                sure:function(){ 
                    PageRequest.del_region(
                        {id: region_id},
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
                                    Tools.group("Delete Region Success.", data);
                                }else{
                                    OpenModal.open_alert({option:'warn', body: data.code_desc});
                                }
                            }
                        }
                    );
                }
            };
            OpenModal.open_confirm(del_listener);
        }else{
            OpenModal.open_alert({option:'warn',body:'请先选择一条数据后操作！'});
        }
    }
    
    
    /** 获取选中纪录某个字段 **/
    function init_lenovo_head_acc(){
        $("#head_acc").autocomplete({
            source: function(request, response) {
                var dim_data = {dim:request.term}
                PageRequest.get_account_lenovo(dim_data, {
                    success:function(data){
                        response($.map(data.json, function(item){ return { label: item.name, value: item.id}}));
                    },
                    error:function(hxr, htmls){
                        OpenModal.open_alert({option:'warn',body:'网络错误，请稍候重试！'});
                        Tools.group("Loading Region Duty Person Error.", hxr, htmls);
                    }
                });
            },
            minLength: 1,
            select: function(event, ui) {
                $("#head_acc_id").val(ui.item.value);
                this.value = ui.item.label;
                return false;
            },
            focus: function(event, ui){
                $("#head_acc_id").val(ui.item.value);
                $("#head_acc").val(ui.item.label);
                return false;
            }
        });
        
        $("#head_acc").on("keydown",function(event){
            if(event.keyCode===8){
                $("#head_acc_id").val("");
                $("#head_acc").val("");
            }
        });
    }

    function add_account() {
        NavTable.open_menu_by_name_new("账户管理", {
            model: 'account',
            action: 'add'
        });
    }
    
    /** 初始化地图控件 **/
    function init_map_editer(option_type, areas){
        $("#tool_max").on("click", map_div_max);
        $("#tool_min").on("click", map_div_min);
        // $("#icon_switch").on("click", $("#tool_max").isHidden?map_div_min():map_div_max());

        var Areas = areas;
        var RegionMap, EditorTool, PolyGon, CenterPoint;
        
        if(ValidData(Settings.account)){
            CenterPoint = Settings.account.street_point.split(",");
        }else{
            CenterPoint = [116.397428, 39.90923]; 
        }
           
        //初始化地图对象，加载地图
        RegionMap = new AMap.Map("region_container", {
            resizeEnable: true,
            showIndoorMap: false,
            center: CenterPoint,//地图中心点
            zooms: [14,19],
            zoom: 14 //地图显示的缩放级别
        });
        
        
        AMapUI.loadUI(['control/BasicControl'], function(BasicControl){
            var zoomCtrl = new BasicControl.Zoom({
                position: 'rm',
                bottom:'50px'
            });
            RegionMap.addControl(zoomCtrl);
        });
        
        RegionMap.plugin('AMap.Geolocation',function(){
            var Geolocation = new AMap.Geolocation({
                enableHighAccuracy: true,//是否使用高精度定位，默认:true
                timeout: 10000,          //超过10秒后停止定位，默认：无穷大
                buttonOffset: new AMap.Pixel(10, 20),//定位按钮与设置的停靠位置的偏移量，默认：Pixel(10, 20)
                zoomToAccuracy: true,      //定位成功后调整地图视野范围使定位位置及精度范围视野内可见，默认：false
                buttonPosition:'LT'
            });
            RegionMap.addControl(Geolocation);
        });
        
        /** 存在就加载 **/
        var region_points = $("#region_points").val();
        var al_points = [];
        if(ValidData(region_points)){
            region_points = CharTools.str2array(region_points);
            for(var i = 0; i < region_points.length; i++){
                al_points.push(new AMap.LngLat(region_points[i][1], region_points[i][0]));
            }
        }
        init_polygon(al_points);
        
        /** 初始化区域列表 **/
        function init_other_points(){
            /** 记载已经存在的区域信息 **/
            var areas = Areas;
            if(ValidData(areas) && areas.length > 0){
                for(var i=0;i<areas.length;i++){
                    var area = areas[i];
                    var area_points = CharTools.str2array(area.points);
                    var area_points_arr = []
                    for(var j = 0; j < area_points.length; j++){
                        area_points_arr.push(new AMap.LngLat(area_points[j][1], area_points[j][0]));
                    }
                    var area_region = new AMap.Polygon({
                        path: area_points_arr,  //设置多边形边界路径
                        strokeColor: "#F30505", //线颜色
                        strokeOpacity: 0.9,     //线透明度
                        strokeWeight: 2,        //线宽
                        fillColor: "#F30505",   //填充色
                        fillOpacity: 0.5,       //填充透明度
                        bubble: true            //事件冒泡
                    });
                    area_region.setMap(RegionMap);
                }
            }  
        }
        
    
        function init_polygon(points){
            RegionMap.clearMap();         
            PolyGon = null;
            points = ValidData(points) ? points:[];
            
            init_other_points();
            
            if(!points || points.length < 3){
                add_polygon();
                return;
            }
            
            PolyGon = new AMap.Polygon({
                path: points,//设置多边形边界路径
                strokeColor:"#1791FC", //线颜色
                strokeOpacity:0.2, //线透明度
                strokeWeight:2,    //线宽
                fillColor: "#1791FC", //填充色
                fillOpacity: 0.35//填充透明度
            });
            PolyGon.setMap(RegionMap);
            
            var map_fit_center = PolyGon.getBounds().getCenter();
            
            RegionMap.setCenter(map_fit_center);
            
            if(option_type === "add" || option_type === "edit"){
                RegionMap.plugin(["AMap.PolyEditor"], function() {
                    EditorTool = new AMap.PolyEditor(RegionMap, PolyGon);
                    EditorTool.open();
                    AMap.event.addListener(EditorTool, 'addnode', show_polygon);
                    AMap.event.addListener(EditorTool, 'adjust', show_polygon);
                    AMap.event.addListener(EditorTool, 'removenode', show_polygon);
                    show_polygon();
                });
            }
        }

        function add_polygon(){
            show_polygon();
            
            //设置多边形的属性
            var polygon_option = {
                strokeColor:"#1791FC",
                strokeOpacity:1,
                strokeWeight:2
            };
            //在地图中添加MouseTool插件
            RegionMap.plugin(["AMap.MouseTool"],function(){
                var MouseTool = new AMap.MouseTool(RegionMap);
                MouseTool.polygon(polygon_option);
                if(option_type === "add" || option_type === "edit"){
                    AMap.event.addListener(
                        MouseTool,
                        "draw",
                        function(e){
                            var ps = e.obj.getPath();
                            var points = [];
                            for(var i = 0; i < ps.length; i++){
                                points.push(new AMap.LngLat(ps[i].lng, ps[i].lat));
                            }
                            init_polygon(points);
                            MouseTool.close(true);
                    });
                }
            });
        }
        
        function get_polygon(){
            if(!PolyGon){
                return "";
            }
            var outpath = PolyGon.getPath();
            var outstr = "[";
            for(var i = 0; i < outpath.length; i++){
                outstr += "[" + outpath[i].lat + "," + outpath[i].lng + "]";
                if(i != outpath.length - 1){ outstr += ",";}
            }
            outstr+="]";
            return outstr;
        }
        
        function show_polygon(){
            $("#region_points").val(get_polygon());
            $("#region_container").tooltip('destroy');
        }
        
        function map_div_max(){
            var css_option = {
                position: 'fixed',
                top: '0',
                right: '0',
                width: '100%',
                height: '100%'
            }
            $("#region_container").css(css_option);
            $("#tool_max").hide();
            $("#tool_min").show();
        }
        
        function map_div_min(){
            var css_option = {
                position: 'relative',
                width: '100%',
                height: '300px'
            }
            $("#region_container").css(css_option);
            $("#tool_max").show();
            $("#tool_min").hide();
        }
        
        if(option_type === 'info' ){
            $("#region_tool_clear").remove();
            $("#icon_clear").remove();
        }else{
            $("#region_tool_clear").on("click", function(){
                init_polygon(null);
            });
            $("#icon_clear").on("click", function(){
                init_polygon(null);
            });
        }
    }
});