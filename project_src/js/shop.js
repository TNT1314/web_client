$(function () {
    "use strict"
    
    try{
        
        var model = 'shop';
        //初始化列表
        var option = get_table_option(model);
        var table = $("#"+model+"_table").DataTable(option);
        
        //添加菜单
        add_tools_control(model);
        
        //单选监听
        TableTools.selected_listener(table, model+"_table");
    }catch(e){
        Tools.group("Run Model Shop Error.", e);
    }
    
    /** -------------------------------------------------------------------------- **/
    //获取table配置
    function get_table_option(d_model){
        return $.extend(
        {
            dom: '<"#'+d_model+'_tool_bar">frtip',
            ajax:{
                url: TableTools.get_url('/fmap/api/shop/list/get'),
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
                { "data": "is_license" },
                { "data": "opera_status" },
                { "data": "check_status" },
                { "data": "head_name" },
                { "data": "head_phone" },
                { "data": "area" },
                { "data": "num_of_staff" },
                { "data": "address" },
                { "data": "create_time" },
                { "data": "change_time" }
            ]
        }, Settings.paging);
    }
    
    /** 添加功能菜单 **/
    function add_tools_control(d_model){
        // 添加工具栏
        var listener = {
            success:function(data){
                // 初始化菜单
                var html = template(d_model+'_table_tools',{model: d_model, power: data.json.power});
                $("#"+d_model+"_tool_bar").html(html);
                add_tools_listener(d_model);
            },
            error:function(xhr,status){ Tools.group('Request Modle Powers Error.', xhr, status);}
        }
        PageRequest.get_model_permision({'model':d_model}, listener);
    }
    
    // 工具监听
    function add_tools_listener(dmodel){
        $("#"+dmodel+"_inf").on("click", click_inf);
        $("#"+dmodel+"_add").on('click', click_add);
        $("#"+dmodel+"_edi").on('click', click_edi);
        $("#"+dmodel+"_aud").on('click', click_aud);
        $("#"+dmodel+"_del").on('click', click_del);
        $("#"+dmodel+"_search").on('click', click_search);
    }
    
    // 查询列表
    function click_search(){
        table.ajax.reload(function(){ Tools.info("Reqeust Finished.");},true);
    }
    
    //查看数据
    function click_inf(){
        var id = TableTools.get_table_selected(table, 'id');
        if(id !== null){
            var rq_data = {id:id};
            PageRequest.get_shop_by_id(
                rq_data,
                {
                    success:function(data){
                        var temp_data = data.json.shop;
                        temp_data.change = 'info';
                        temp_data.model = 'shop';
                        temp_data.server = Settings.server;
                        var html_str = template('temp_shop_change', temp_data);
                        var lisenler = {option: 'info', body: html_str, server: Settings.server, sure_show: "确认",
                            sure:function(){ OpenModal.close(); }
                        };
                        //展开
                        OpenModal.open(lisenler);
                        // 初始化显示隐藏
                        control_input();
                        try{
                            //初始化地图
                            init_map_editer('info');
                        }catch(e){
                            Tools.group("Map Plagius Init Error.", e);
                            OpenModal.open_alert({option:'warm', body: '加载地图插件失败，请重试！'});
                        }
                    }
                }
            );
        }else{
            var warm = {option: 'warn', body: '请先选择一条数据后操作！'}
            OpenModal.open_alert(warm);
        }
    }

    // 新增事件
    function click_add(){
        var option = 'add'
        var load_choice_listener = {
            success:function(data){
                /** 初始化模版 **/
                var industrys = data.json.industrys;
                var check_cycle = data.json.check_cycle;
                var point = data.json.point;
                var add_html = template('temp_shop_change',
                    {
                        change: option,
                        model: model,
                        server: Settings.server,
                        indu_choice: industrys,
                        cycle_choice: check_cycle
                    }
                );
                
                /** 模版监听函数 **/
                var add_lisenler = { 
                    option: option,
                    body: add_html,
                    sure_show: "确认添加",
                    sure:function(){
                        if (valid_form().form() && $("#shop_address").val()!==""){
                            $(":disabled").removeAttr("disabled");
                            var add_data = $("#shop_form").serializeObject();
                            PageRequest.change_shop(
                                add_data,
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
                                        Tools.group("Add Shop Success.", data);
                                    },
                                    error:function(code, message){
                                        OpenModal.open_alert({ option: 'warn', body: '错误信息：'+message+'('+code+')' });
                                    }
                                })
                        }else {
                            Tools.info("表单本地验证失败");
                            if ($("#shop_address").val() === ""){
                                if (! $("#shop_container").hasClass("tooltip")){
                                    $("#shop_container").attr({"data-original-title":"请在地图中选择位置信息"}).tooltip("show");
                                }
                            }else {
                                $("#shop_container").tooltip('destroy');
                            }
                        }
                    }
                }
                
                OpenModal.open(add_lisenler);
                // 初始化显示隐藏
                control_input();
                
                $("#shop_face_photo1").on("change", image2base64);
                $("#shop_face_photo2").on("change", image2base64);
                
                try{
                    // 初始化地图插件
                    init_map_editer(option, point);
                }catch(e){
                    Tools.group("Map Plagius Init Error.", e);
                    OpenModal.open_alert({option:'warm', body: '加载地图插件失败，请重试！'});
                }  
            },
            error:function(hxr,htmls){
                OpenModal.open_alert({option:'warn', body: '网络错误，请稍候重试！' });
                Tools.group("Loading Base Industry Choice Error.", hxr, htmls);
            }
        };
        PageRequest.get_shop_choice(load_choice_listener);
    }

    /** 修改事件 **/
    function click_edi(){
        // 声明操作类型
        var option = "edit";
        var id = TableTools.get_table_selected(table, 'id');
        if(id !== null){
            var load_industry_listener = {
                success:function(back_data){
                    var industrys = back_data.json.industrys;
                    var check_cycle = back_data.json.check_cycle;
                    PageRequest.get_shop_by_id(
                        { id:id },
                        {
                            success:function(data){
                                var edit_temp_data = data.json.shop;
                                edit_temp_data.change = option;
                                edit_temp_data.model = 'shop';
                                edit_temp_data.server = Settings.server;
                                edit_temp_data.indu_choice = industrys;
                                edit_temp_data.cycle_choice = check_cycle;
                                var edit_html = template('temp_shop_change', edit_temp_data);
                                var edit_lisenler = {
                                    option: option,
                                    body: edit_html,
                                    sure_show: "确认修改",
                                    sure:function(){
                                        if (valid_form().form() && $("#shop_address").val()!==""){
                                            $(":disabled").removeAttr("disabled");
                                            var req_data = $("#shop_form").serializeObject();
                                            PageRequest.change_shop(
                                                req_data,
                                                {
                                                    success:function(data){
                                                        var info = {
                                                            option: 'info',
                                                            body: data.code_desc,
                                                            sure: function(){
                                                                OpenModal.close();
                                                                click_search();
                                                            }
                                                        }
                                                        OpenModal.open_alert(info);
                                                        Tools.group("Update Shop Success.", data);
                                                    },
                                                    error:function(hxr,htmls){
                                                        OpenModal.open_alert({option: 'warn', body: '错误信息'});
                                                        Tools.group("Update Shop Error.", hxr, htmls);
                                                    }
                                                }
                                            )
                                        }else {
                                            if ($("#shop_address").val() === ""){
                                                if (! $("#shop_container").hasClass("tooltip")){
                                                    $("#shop_container").attr({"data-original-title":"请在地图中选择位置信息"}).tooltip("show");
                                                }
                                            }else {
                                                $("#shop_container").tooltip('destroy');
                                            }
                                        }
                                    }
                                };
                                OpenModal.open(edit_lisenler);
            
                                // 初始化显示隐藏
                                control_input();

                                $("#shop_face_photo1").on("change", image2base64);
                                $("#shop_face_photo2").on("change", image2base64);
                                
                                // 初始化地图插件
                                try{
                                    init_map_editer(option);
                                }catch(e){
                                    Tools.group("Map Plagius Init Error.", e);
                                    OpenModal.open_alert({option:'warm', body: '加载地图插件失败，请重试！'});
                                } 
                            }
                        }
                    );
                }
            };
            PageRequest.get_shop_choice(load_industry_listener);
        }else{
            OpenModal.open_alert({option: 'warn',body: '请先选择一条数据后操作！'});
        }
    }
    
    //验证表单
    function valid_form() {
        return $("#shop_form").validate({
            rules: {
                name:{isValidity:true},
                license_number:{isSocialRedit:true},
                license_name:{isValidity:true},
                legal_person_name:{isValidity:true},
                legal_person_phone:{isMobile:true},
                regis_address:{isValidity:true},
                area:{isPositive:true},
                num_of_staff:{isPositive:true},
                head_name:{isValidity:true},
                head_phone:{isMobile:true},
                contain_people:{isPositive:true},
                num_of_room:{isPositive:true},
                cons_area:{isPositive:true},
                num_of_workers:{isPositive:true},
                danger_pro_storage:{isPositive:true},
                check_cycle:{isValidity:true},
                detail_address:{isValidity:true},
                other:{isValidity:true}
            },
            messages: {
                name:{required:"请填写"},
                license_number:{required:"请填写"},
                license_name:{required:"请填写"},
                legal_person_name:{required:"请填写"},
                legal_person_phone:{required:"请填写"},
                regis_address:{required:"请填写"},
                area:{required:"请填写"},
                num_of_staff:{required:"请填写"},
                head_name:{required:"请填写"},
                head_phone:{required:"请填写"},
                contain_people:{required:"请填写"},
                num_of_room:{required:"请填写"},
                cons_area:{required:"请填写"},
                num_of_workers:{required:"请填写"},
                danger_pro_storage:{required:"请填写"},
                check_cycle:{required:"请选择"},
                detail_address:{required:"请填写"},
                other:{required:"请填写"}
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
    
    // 审批内容
    function click_aud(){
        var shop_id = TableTools.get_table_selected(table, 'id');
        var shop_code = TableTools.get_table_selected(table, 'code');
        var shop_name = TableTools.get_table_selected(table, 'name');
        if(shop_id !== null){
            var aud_body = '确认 ' + shop_name + '('+shop_code+') 的商户信息真实有效？';
            var aud_listener = {option: 'audit', body: aud_body, sure_show: "确认审核",
                sure:function(){ 
                    PageRequest.aud_shop(
                        {id: shop_id},
                        {
                            success:function(data){
                                var info = {option: 'info', body: '商铺信息审核成功！', sure: function(){ OpenModal.close_confirm();}};
                                OpenModal.open_alert(info);
                                click_search();
                                Tools.group("Audit Shop Success.", data);
                            },
                            error:function(hxr,htmls){
                                OpenModal.open_alert({option: 'warn', body: '网络错误，请稍候重试！'});
                                Tools.group("Audit Shop Error.", hxr, htmls);
                            }
                        }
                    );
                }
            };
            OpenModal.open_confirm(aud_listener);
        }else{
            OpenModal.open_alert({option: 'warn',body: '请先选择一条数据后操作！'});
        }
    }
    
    // 确认禁用
    function click_del(){
        var shop_id = TableTools.get_table_selected(table, 'id');
        var shop_code = TableTools.get_table_selected(table, 'code');
        var shop_name = TableTools.get_table_selected(table, 'name');
        if(shop_id !== null){
            var del_body = '确认删除 ' + shop_name + '('+shop_code+') 商户信息？';
            var del_listener = {
                option: 'delete',
                body: del_body,
                sure_show: "确认删除",
                sure:function(){ 
                    PageRequest.del_shop(
                        {id:shop_id},
                        {
                            success:function(data){
                                var info = {option: 'info', body: '商户信息删除成功！', sure: function(){ OpenModal.close_confirm();}};
                                OpenModal.open_alert(info);
                                click_search();
                                Tools.group("Delete Shop Success.", data);
                            },
                            error:function(hxr,htmls){
                                OpenModal.open_alert({option: 'warn', body: '网络错误，请稍候重试！'});
                                Tools.group("Delete Shop Error.", hxr, htmls);
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
    
    /** 初始化地图控件 **/
    function init_map_editer(option_type, point){
        $("#tool_max").on("click", map_div_max);
        $("#tool_min").on("click", map_div_min);
        
        var map_center = ValidData(point) ? point.split(",") : [116.397428, 39.90923];
            
        var MapObj, Marker, MGeocoder, Geolocation;
        
        //初始化地图对象，加载地图
        MapObj = new AMap.Map("shop_container", {
            resizeEnable: true,
            showIndoorMap: false,
            center: map_center,//地图中心点
            zooms: [14,19],
            zoom: 14 //地图显示的缩放级别
        });
        
        AMapUI.loadUI(['control/BasicControl'], function(BasicControl){
            var zoomCtrl = new BasicControl.Zoom({
                position: 'rm'
            });
            MapObj.addControl(zoomCtrl);
        });
        
        MapObj.plugin('AMap.Geolocation',function(){
            if(option_type==="add" || option_type=="edit"){
                Geolocation = new AMap.Geolocation({
                    enableHighAccuracy: true,//是否使用高精度定位，默认:true
                    timeout: 10000,          //超过10秒后停止定位，默认：无穷大
                    buttonOffset: new AMap.Pixel(10, 20),//定位按钮与设置的停靠位置的偏移量，默认：Pixel(10, 20)
                    zoomToAccuracy: true,      //定位成功后调整地图视野范围使定位位置及精度范围视野内可见，默认：false
                    buttonPosition:'LT'
                });
                MapObj.addControl(Geolocation);
            }
        });
        
        /** 开启逆地理服务 **/
        AMap.service(
            ["AMap.Geocoder"],
            function(){
                MGeocoder = new AMap.Geocoder({
                    city:"全国", //城市，默认：“全国”
                    radius: 1000 //范围，默认：500
            });
        });
        
        /** 加载存在点 **/
        var points = $("#shop_point").val();
        if(points){
            points = points.split(",");
            if(points.length==2){
                add_marker(new AMap.LngLat(points[0], points[1]));
                MapObj.setFitView();
            }
        }else{
            points = map_center;
            if(points.length==2){
                add_marker(new AMap.LngLat(points[0], points[1]));
                get_point_address(new AMap.LngLat(points[0], points[1]));
                MapObj.setFitView();
            }
        }
        
        /** 添加或修改加载工具 **/
        if(option_type==="add" || option_type=="edit"){
            AMap.event.addListener(MapObj, 'click', map_click);
            AMap.event.addListener(Geolocation, 'complete', fixd_success);
            AMap.event.addListener(Geolocation, 'error', fixd_error);
            // $("#shop_tool_clear").on('click', clear_marker);
            $("#icon_clear").on('click', clear_marker);
            $("#region_tool_clear").on('click', clear_marker);
        }

        
        map_load_regions();
        
        /** 展示当前人员所管辖的区域 **/
        function map_load_regions(){
            if(ValidData(Settings.account.region_area)){
                var region_arry = Settings.account.region_area;
                for(var i=0;i<region_arry.length;i++){
                    var region_points = CharTools.str2array(region_arry[i]);
                    var region_area =  [];
                    for(var j = 0; j < region_points.length; j++){
                        var point = region_points[j];
                        region_area.push(new AMap.LngLat(point[1], point[0]));
                    }
                    var region_marker = new AMap.Polygon({
                        path: region_area,
                        bubble: true,
                        strokeColor: "#1791FC",
                        strokeOpacity: 0.65,
                        strokeWeight: 2,
                        fillColor: "#1791FC",
                        fillOpacity: 0.35
                    });
                    region_marker.setMap(MapObj);
                }   
            }
        }
        
        /** 地图点击扎点 **/
        function map_click(e){
            if(Marker){ 
                MapObj.remove(Marker);
                Marker = null;
            }
            add_marker(e.lnglat);
            get_point_address(e.lnglat);
        }
        
        /** 定位成功 **/
        function fixd_success(data){
            add_marker(data.position);
            MapObj.setFitView();
            var _position = [data.position.getLng(),data.position.getLat()];
            get_point_address(_position);
        }
        
        /** 获取地址信息 **/
        function get_point_address(position){
            MGeocoder.getAddress(
                position,
                function(status, result){
                    if(status === 'complete' && result.info === 'OK') {
                        var _content = result.regeocode.formattedAddress;
                        $("#shop_address").val(_content);
                        $("#shop_container").tooltip('destroy');
                    }
                }
            );
        }
        
        /** 清除地址 **/
        function clear_point_address(){
            $("#shop_point").val("");
            $("#shop_address").val("");
        }
        
        /** 定位错误 **/
        function fixd_error(data){
            var warm = { option: 'warn', body: '定位失败，请检查设置后重试！'}
            OpenModal.open_alert(warm);
            Tools.info("Geolocation Error", data);
        }
        
        /** 添加喵点 **/
        function add_marker(lnglat){
            if(ValidData(Marker)){ 
                MapObj.remove(Marker); 
            }
             Marker = null; 
            if(!lnglat){ show_marker_info(); return;}
            
            if(option_type==="info"){
                Marker = new AMap.Marker({
                    position:lnglat,
                    draggable:false //点标记可拖拽
                });
                Marker.setMap(MapObj);
            }else{
                Marker = new AMap.Marker({
                    position:lnglat,
                    draggable:true, //点标记可拖拽
                    cursor:'move',  //鼠标悬停点标记时的鼠标样式
                    raiseOnDrag:true//鼠标拖拽点标记时开启点标记离开地图的效果
                });
                Marker.setMap(MapObj);
                show_marker_info();
                AMap.event.addListener(
                    Marker,
                    'dragend',
                    function(e){
                        Tools.info(e);
                        show_marker_info();
                    }
                );
            }
        }
        
        /** 清除喵点 **/
        function clear_marker(){
            add_marker(null);
            clear_point_address();
        }
        
        /** 获取喵点经纬度 **/
        function getmarkerinfo(){
            if(!Marker){ return "";}
            return Marker.getPosition().getLng() + "," + Marker.getPosition().getLat();
        }
        
        /** 经纬度回填 **/
        function show_marker_info(){
            $("#shop_point").val(getmarkerinfo());
        }

        /** 最大化 **/
        function map_div_max(){
            var css_option = {position:'fixed',top:'0',right:'0',width:'100%',height:'100%'}
            $("#shop_container").css(css_option);
            $("#tool_max").hide();
            $("#tool_min").show();
        }
        
        /** 最小化 **/
        function map_div_min(){
            var css_option = {position: 'relative',width: '100%',height: '100px'}
            $("#shop_container").css(css_option);
            $("#tool_max").show();
            $("#tool_min").hide();
        }
    }
    
    /** 处理显示隐藏 **/
    function control_input(){
        var checked = $("#shop_is_license").is(":checked");
        if(checked){
            $(".shop_is_license_div").show();
            $("#shop_license_number").attr("required","true");
            $("#shop_license_name").attr("required","true");
            $("#shop_legal_person_name").attr("required","true");
            $("#shop_legal_person_phone").attr("required","true");
            $("#shop_regis_address").attr("required","true");
        }
        $("#shop_is_license").on('click', checked_change);

        choice_show_option();
        $('#shop_industry').on("change", choice_show_option);
        
        function checked_change(e){
            var bol = $(e.target).is(":checked");
            if(bol){ 
                $(".shop_is_license_div").show();
                $("#shop_license_number").attr("required","true");
                $("#shop_license_name").attr("required","true");
                $("#shop_legal_person_name").attr("required","true");
                $("#shop_legal_person_phone").attr("required","true");
                $("#shop_regis_address").attr("required","true");
            }else{
                $(".shop_is_license_div").hide();
                $("#shop_license_number").removeAttr("required");
                $("#shop_license_name").removeAttr("required");
                $("#shop_legal_person_name").removeAttr("required");
                $("#shop_legal_person_phone").removeAttr("required");
                $("#shop_regis_address").removeAttr("required");
            }
        }
        
        function choice_show_option(){
            var option = $('#shop_industry>option:selected');
            var json_str = option.attr("data-columns");
            if(ValidData(json_str)){
                json_str = CharTools.str2array(json_str);
                var ele = $("#shop_"+json_str[0].code);
                $(".model_div_row_hidde").hide();
                $(".model_div_row_hidde :input").each(function () {
                    $(this).removeAttr("required");
                });
                ele.parent().parent().show();
                $(json_str).each(function(i,e){
                    $("#shop_"+e.code).attr("required","true");
                });
            }
        }
    }
    
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
    
});