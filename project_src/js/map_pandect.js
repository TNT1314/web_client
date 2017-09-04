$(function(){
    "use strict"
    
    try{
        /** 地图图层 **/
        var PandectMap, State_Layer, infoWindow, CenterPoint = null;
        var PandectMapFeatures = ['bg', 'road', 'building'];
        
        /** 初始化显示级别 **/
        var Shops_Zoom = [16, 18];
        var Regins_Zoom = [14, 16];
       
        /** 地图标注 **/
        var Shops_Marker = new vis.DataSet({});
        var Regions_Marker  = new vis.DataSet({});
        var Regions_Marker_Lable  = new vis.DataSet({});
        
        /** 动态高度 **/
        var height = $('.content-wrapper').height();
        var tab_height = $("#main-nav-tab").height();
        $('#map_pandect').height(height-tab_height-20);
        
        
        if(ValidData(Settings.account)){
            CenterPoint = Settings.account.street_point.split(",");
        }else{
            CenterPoint = [116.397428, 39.90923]; 
        }
        
        //初始化地图对象，加载地图
        PandectMap = new AMap.Map("map_pandect", {
            resizeEnable: true,
            showIndoorMap: false,
            features: PandectMapFeatures,
            center: CenterPoint,
            zooms: [14,19],
            zoom: 14  //地图显示的缩放级别
        });

        AMapUI.loadUI(['control/BasicControl'], function(BasicControl){
            var zoomCtrl = new BasicControl.Zoom({
                position: 'rb'
            });
            PandectMap.addControl(zoomCtrl);
        });
        
        //加载卫星图层
        State_Layer = new AMap.TileLayer.Satellite({ zIndex: 10});
        State_Layer.setMap(PandectMap);
        State_Layer.hide();
        
        //监听缩放级别
        PandectMap.on('zoomend', change_map_zoom);
        
        //添加监听
        add_tools_listener();

        //初始化商户行业列表
        var shop_check_flag = "0";
        var shop_industry_flag = "0";
        get_base_chioce();

        //刷新数据
        refresh_all();
            
        Tools.group("Run App Map_Pandect Success.");
    }catch(e){
        Tools.group("Run App Map_Pandect Error.", e);
    }
    
    /** 添加工具监听 **/
    function add_tools_listener(){
        $("#tool_max").on("click", map_div_max);
        $("#tool_min").on("click", map_div_min);
        $("#tool_moon").on("click", change2moon);
        $("#tool_plane").on("click", change2panel);
        $("#tool_refesh").on("click", refresh_all);
        $("#tool_markers").on("click", control_map_div);
        $("#tool_markers_no").on("click", control_map_div_no);
        $("#shop_select_condition").on("click",display_select_condition);

        $("#tool_cut").on("click", print_cut);

        autoCompleteInput($("#tool_search"));
    }

    /** 显示商铺筛选条件 **/
    function display_select_condition() {
        var width = $("#shop_select_condition_div").width();
        if (width > 60){
            $("#shop_select_condition_div").css({'width': 45});
            $("#shop_industry").hide();
            $("#shop_check_status").hide();
        }else {
            $("#shop_select_condition_div").css({'width': 375});
            $("#shop_industry").show();
            $("#shop_check_status").show();
        }
    }
    
    /** 地图打印方法 **/
    function print_cut(){
        screen_shake();
        var cut_html = template('temp_cut_div', {});
        $("#map_pandect").append(cut_html);
        $("#tool_cut").addClass('div_button_hidden');
        $("#tool_cut_chancel").removeClass('div_button_hidden');
        $("#tool_cut_chancel").on("click", print_cut_chancel);
        
        set_width(true);
        
        $("#cut_div").mousedown(function(e){
            $(this).css("cursor","move");//改变鼠标指针的形状 
            var offset = $(this).offset();//DIV在页面的位置 
            var x = e.pageX - offset.left;//获得鼠标指针离DIV元素左边界的距离 
            var y = e.pageY - offset.top;//获得鼠标指针离DIV元素上边界的距离 
            $(document).bind("mousemove",function(ev){ 
                $("#cut_div").stop();//加上这个之后
                
                var div_new_x = ev.pageX - x;
                var div_new_y = ev.pageY - y;
                
                // 获取背景偏移量
                var back_offset = $("#cut_back_div").offset();
                var back_width = $("#cut_back_div").width();
                var back_height = $("#cut_back_div").height()
                
                // 获取div的高度，宽度
                var div_width = $("#cut_div").width();
                var div_height = $("#cut_div").height();
                
                if(div_new_x <= back_offset.left){
                    div_new_x = back_offset;
                }else if(div_new_x >= back_offset.left+back_width-div_width){
                    div_new_x = back_offset.left+back_width-div_width;
                }
                if(div_new_y <= back_offset.top){
                    div_new_y = back_offset.top;
                }else if(div_new_y >= back_offset.top+back_height-div_height-4){
                    div_new_y = back_offset.top+back_height-div_height-4;
                }
                
                $("#cut_div").animate({left:div_new_x+"px",top:div_new_y+"px"},10); 
                set_width(false);
            }); 
        }); 
        
        $("#right_down").mousedown(function(e){
            try{
                e.stopPropagation();
            }catch(o){
                e.returnValue = false;
            }
            
            var x = e.pageX;
            var y = e.pageY;
            
            var div_offset = $("#cut_div").offset();
            var cut_div_width = $("#cut_div").width();
            var cut_div_height = $("#cut_div").height();
            
            $(document).bind("mousemove",function(ev){ 
                try{
                    ev.stopPropagation();
                }catch(o){
                    ev.returnValue = false;
                }
                
                $("#cut_div").stop();//加上这个之后
                
                var back_offset = $("#cut_back_div").offset();
                var back_width = $("#cut_back_div").width();
                var back_height = $("#cut_back_div").height();
                
                var div_new_y = ev.pageY - y;  
                var div_new_x = ev.pageX - x;
                
                div_new_x += cut_div_width;
                div_new_y += cut_div_height;
                
                if(div_new_y >= back_offset.top + back_height - div_offset.top){
                    div_new_y = Math.min(div_new_y, back_offset.top + back_height - div_offset.top-4);
                    div_new_x = CharTools.parse_int(div_new_y*420/297); 
                }else if(div_new_x >= back_offset.left + back_width - div_offset.left){
                    div_new_x += Math.min(div_new_x, back_offset.left + back_width - div_offset.left);
                    div_new_y = CharTools.parse_int(div_new_x*297/420); 
                }else{
                    div_new_y = Math.min(div_new_y, back_offset.top + back_height - div_offset.top);
                    div_new_x = CharTools.parse_int(div_new_y*420/297); 
                }
                
                $("#cut_div").animate({"top": div_offset.top,"left": div_offset.left, "width": div_new_x, "height": div_new_y}, 10);
                set_width(false);
            }); 
        });

        $(document).mouseup(function() { 
            set_width(false);
            $("#cut_div").css("cursor", "pointer"); 
            $(this).unbind("mousemove"); 
        });

        $("#cut_div").on("dblclick", print_map);
    }
    
    /** 打印框长宽调整 **/
    function set_width(init){
        
        if($("#cut_div").length<=0){return false;}
        
        var width = $("#map_pandect").width();
        var height = $("#map_pandect").height();

        var cut_div_width = width/2;
        var cut_div_height = cut_div_width*297/420;
        if(ValidData(init) && init===true){
            $("#cut_div").css({"width": cut_div_width,"height": cut_div_height});
        }else{
            cut_div_width = $("#cut_div").width();
            cut_div_height = $("#cut_div").height();
        }

        var pandan_offx = $("#map_pandect").offset().left;
        var pandan_offy = $("#map_pandect").offset().top;

        var cut_div_offx = $("#cut_div").offset().left;
        var cut_div_offy = $("#cut_div").offset().top;

        $("#cut_left").css({"width": cut_div_offx-pandan_offx});
        $("#cut_top").css({"left": cut_div_offx-pandan_offx, 'width': cut_div_width-1, 'height':cut_div_offy-pandan_offy});
        $("#cut_right").css({"left": cut_div_offx-pandan_offx+cut_div_width-1, 'width': width-cut_div_width-cut_div_offx+pandan_offx});
        $("#cut_bottom").css({"left": cut_div_offx-pandan_offx, 'width': cut_div_width-1, 'height': height-cut_div_height-(cut_div_offy-pandan_offy)+1}); 
    }
    
    /** 屏幕抖动 **/
    function screen_shake(){
        var p_center = PandectMap.getCenter();
        var o_x = p_center.getLng();
        var o_y = p_center.getLat();
        
        var new_p = new AMap.LngLat(o_x+0.001, o_y+0.001);
        PandectMap.setCenter(new_p);
        window.setTimeout(function () {
            PandectMap.setCenter(p_center);
        }, 1);
    }
    
    /** 打印取消 **/
    function print_cut_chancel(){
        $("#cut_back_div").remove();
        $("#cut_div").remove();
        $("#cut_left").remove();
        $("#cut_top").remove();
        $("#cut_right").remove();
        $("#cut_bottom").remove();
        $("#tool_cut").removeClass('div_button_hidden');
        $("#tool_cut_chancel").addClass('div_button_hidden');
    }
    
    /** 地图打印方法 **/
    function print_map(){
        html2canvas(
            $(".amap-maps"), 
            {   
                useCORS: true,
                proxy: 'http://webst01.is.autonavi.com',
                logging: false,
                allowTaint: true, //允许跨域
                taintTest: true,
                svgRendering: true,
                onrendered: function(canvas_layers) {
                    var layers = canvas_layers.toDataURL("image/png");
                    var bottom_image = new Image();
                    bottom_image.onload = function(){
                                 
                        var offset = $("#cut_div").offset();
                        var back_offset = $("#cut_back_div").offset();

                        var width = $("#cut_div").width();
                        var height = $("#cut_div").height();

                        var of_x = offset.left - back_offset.left -4;
                        var of_y = offset.top - back_offset.top;
                        var new_canvas = document.createElement('canvas');
                        new_canvas.width = width;
                        new_canvas.height = height;
                        new_canvas.getContext('2d').drawImage(bottom_image, of_x, of_y, width, height, 0, 0, width, height);

                        var request_image = new_canvas.toDataURL("image/png");
                        print_cut_chancel();
                        exportCanvasAsPNG(request_image);   
                    }
                    
                    bottom_image.src = layers;
                    
//                    var print_data = {map_image: request_image};
//                    var print_listener = {
//                      success:function(data) {
//                          window.open(Settings.server+data.url);
//                      } 
//                    };
//                    PageRequest.map_print_image(print_listener, print_data, '生成打印结果中，请稍等......');
                }    
            }
        );
    }
    
    /** 下载图片方法 **/
    function exportCanvasAsPNG(filedata) {
        var MIME_TYPE = "image/png";
        var dlLink = document.createElement('a');
        dlLink.download = "地图截图.png";
        dlLink.href = filedata;
        dlLink.dataset.downloadurl = [MIME_TYPE, dlLink.download, dlLink.href].join(':');
        document.body.appendChild(dlLink);
        dlLink.click();
        document.body.removeChild(dlLink);
    }
    
    /**  显示标注 **/
    function control_map_div() {
        $("#tool_markers").hide();
        $("#tool_markers_no").show();
        PandectMapFeatures.push('point');
        PandectMap.setFeatures(PandectMapFeatures);
    }
    /**  取消标注 **/
    function control_map_div_no() {
        $("#tool_markers").show();
        $("#tool_markers_no").hide();
        PandectMapFeatures.pop();
        PandectMap.setFeatures(PandectMapFeatures);
    }
    /** 缩放地图事件 **/
    function change_map_zoom(){
        var map_zoom = PandectMap.getZoom();
        if(Regins_Zoom[0] <= map_zoom && map_zoom <= Regins_Zoom[1]){
            control_region_show(true);
        }else{
            control_region_show(false);
        }
        
        if(Shops_Zoom[0] <= map_zoom && map_zoom <= Shops_Zoom[1]){
            control_shop_show(true);
        }else{
            control_shop_show(false);
            close_shop_window();
        }
    }
    
    /** 加载所有数据 **/
    function refresh_all(){
        PandectMap.clearMap();
        Regions_Marker.clear();
        Regions_Marker_Lable.clear();
        apply_regions();
        Shops_Marker.clear();
        apply_shops();

        $("#shop_check_status option:first").prop("selected", 'selected');
        $("#shop_industry option:first").prop("selected", 'selected');
        shop_check_flag = "0";
        shop_industry_flag = "0";
        $('#tool_search').val('');
    }
    
    /** 显示region **/
    function apply_regions(){
        var color_arry = ['#FFCC00','#FF9900','#FF6600','#FF3300','#FF3399','#CC33CC','#CC0099','#006600','#003399','#330099','#660066','#330066','#CC0066','#996600'];
        var load_listener = {
            success:function(data){
                for(var i=0;i<data.json.regions.length;i++){
                    var region = data.json.regions[i];
                    map_draw_region(region, color_arry[(i > 13 ? i-13:i)]);
                    map_draw_region_lable(region);
                }
                change_map_zoom();
            }
        }
        PageRequest.map_get_regions(load_listener);
    }
    
    /** 添加区域 **/
    function map_draw_region(region, c){
        var points = CharTools.str2array(region.points);
        var polygonArr =  [];
        for(var i = 0; i < points.length; i++){
            var point = points[i];
            polygonArr.push(new AMap.LngLat(point[1], point[0]));
        }
        
        var polygon_marker = new AMap.Polygon({ 
            path: polygonArr,
            strokeColor: c,
            strokeOpacity: 0.65,
            strokeWeight: 2,
            fillColor: c,
            fillOpacity: 0.35
        }); 
        
        polygon_marker.setMap(PandectMap);
        polygon_marker.on("dblclick", function(e){
            PandectMap.setCenter(e.lnglat);
            PandectMap.setZoom(16);
        });
        
        region.marker = polygon_marker;
        Regions_Marker.add(region);
    }
    
    /** 添加新的lable **/
    function map_draw_region_lable(region){
        
        var region_lable_storage = {id: region.id};
        
        var region_marker = region.marker;
        var region_marker_bond = region_marker.getBounds();
        var region_marker_center = region_marker_bond.getCenter();
        
        var map_zoom = PandectMap.getZoom();
        
        var lable_html = [];
        var lable_font_size = 9 * (1+map_zoom%14);
        var lable_off_x = -35 * (1 + map_zoom%14*0.7);
        var lable_off_y = -35 * (1 + map_zoom%14*0.4);
        if(lable_font_size >= 15) {
            lable_font_size = 15;
        }
        
        lable_html.push('<div class="map_marker_lable" style="font-size:');
        lable_html.push(lable_font_size);
        lable_html.push('px;font-weight:500;">');
        // lable_html.push("<span class='region_name' style='font-size:');+lable_font_size+5+'px'>"+region.name+"</span>");
        lable_html.push('<span class="region_name" style="font-size:');
        lable_html.push(lable_font_size+5);
        lable_html.push('px;font-weight:500;">');
        lable_html.push(region.name+"</span>");
        lable_html.push("<br/><span class='light_color'>已合格：</span>");
        lable_html.push("<span class='qualified_color'>"+region.statstic.qualified+"</span>");
        lable_html.push("<br/><span class='light_color'>不合格：</span>");
        lable_html.push("<span class='no_qualified_color'>"+region.statstic.no_qualified+"</span>");
        lable_html.push("<br/><span class='light_color'>未检查：</span>");
        lable_html.push("<span class='no_check_color'>"+region.statstic.no_checked+"</span>");
        lable_html.push('</div>');
    
        var region_lable_marker = new AMap.Marker({ //添加自定义点标记
            zIndex: 100,
            position: region_marker_center,            //基点位置
            offset: new AMap.Pixel(lable_off_x, lable_off_y),   //相对于基点的偏移位置
            content: lable_html.join("")          //自定义点标记覆盖物内容
        });
        region_lable_marker.setMap(PandectMap);
        region_lable_marker.on("dblclick", function(e){
            PandectMap.setCenter(e.lnglat);
            PandectMap.setZoom(16);
        });
        region_lable_storage.marker = region_lable_marker;
        Regions_Marker_Lable.add(region_lable_storage);
    } 
    
    /** 变更缩放级别时的方法 **/
    function map_region_lable_change_by_zoom(region, show){
        var region_id = region.id;
        var marker_lable = Regions_Marker_Lable.get(region_id);
        if(ValidData(marker_lable)){
            PandectMap.remove(marker_lable.marker);
            Regions_Marker_Lable.remove(region_id);
            if(show){ map_draw_region_lable(region);}
        }else{
             if(show){ map_draw_region_lable(region);}
        }
    } 
    
    /** 控制区域显示 **/
    function control_region_show(bol){
        var region_ids = Regions_Marker.getIds();
        for(var i=0;i<region_ids.length;i++){
            var regions = Regions_Marker.get(region_ids[i]);
            /** 区域lable控制 **/
            map_region_lable_change_by_zoom(regions, bol);
            var marker = regions.marker;
            
            if(bol){
                if(marker){marker.show();}
            }else{
                if(marker){marker.hide();}
            }
        }
    }
    
    /** 应用shop **/
    function apply_shops(){
        var load_listener = {
            success:function(data){
                for(var i=0;i<data.json.shops.length;i++){
                    var shop = data.json.shops[i];
                    map_draw_shop(shop);
                }
                change_map_zoom();
            }
        }
        PageRequest.map_get_shops(load_listener);
    }
    
    /** 添加shop标注**/
    function map_draw_shop(shop){
        var color_arry = ['#FF9933','#3366FF','#FF3300','#999'];
        var color_index;
        if (shop.check_code == 1){
            color_index = 0;
        }
        else if(shop.check_code == 2 || shop.check_code == 4){
            color_index = 1;
        }
        else if(shop.check_code == 3 || shop.check_code == 5){
            color_index = 2;
        }else{
            color_index = 3;
        }
        if(ValidData(shop.point)){
            var shop_point = shop.point.split(',');
            var shop_marker;
            if(shop.icon){
                shop_marker = new AMap.Marker({
                    zIndex: 200,
                    topWhenClick: true,
                    offset: new AMap.Pixel(0, 3 ),
                    content:'<i style="background-color: white;border-radius: 50%; box-shadow:1px 2px 1px rgba(0,0,0,0.15);color:'+color_arry[color_index]+'" class="iconfont '+shop.icon+'"></i>',
                    position: new AMap.LngLat(shop_point[0],shop_point[1]),
                    title: shop.name,
                    extData: shop,
                    clickable:true
                });
            }else{
                shop_marker = new AMap.Marker({
                offset: new AMap.Pixel(0, 3),
                icon: new AMap.Icon({
                        size: new AMap.Size(16,16),
                        image: "images/logo.png",
                        imageOffset: new AMap.Pixel(0,0),
                        imageSize: new AMap.Size(16, 16)
                }),
                position: new AMap.LngLat(shop_point[0],shop_point[1]),
                title: shop.name,
                extData: shop,
                clickable:true
            });
            }

            shop_marker.setMap(PandectMap);

            shop_marker.on('click', function(e) {
                openInfo(e.target);
            });

            shop.marker = shop_marker;
            Shops_Marker.add(shop);
        }        
    }
       
    /** 添加shop自定义信息窗体 **/
    function openInfo(marker){
        if (infoWindow) { infoWindow.close();}
        
        var shop = marker.getExtData();
        
        Tools.group("我擦", shop);

        PandectMap.setCenter(marker.getPosition());
        
        shop.server = Settings.server;
        
        var info_html = template('temp_shop_info', shop);

        infoWindow = new AMap.InfoWindow({
            isCustom: true,
            closeWhenClickMap: false,
            content: createInfoWindow(shop, info_html),
            offset: new AMap.Pixel(8, -4)
        });
        
        infoWindow.on('close',function(){remove_shop_details();});
        
        infoWindow.open(PandectMap, marker.getPosition());
        
        $('.search_marker_details').on('click', show_shop_details);
    }
    
    /** 创建展示信息DIV **/
    function createInfoWindow(shop, content) {
        var open_win = document.createElement("div");
        open_win.className = "info";
        open_win.id = "map_marker_info";

        // 定义顶部标题
        var head = document.createElement("div");
        head.className = "info-top";

        var head_title = document.createElement("div");
        var title = [];
        title.push('<div>');
        title.push(shop.name);
        title.push('(');
        title.push(shop.code);
        title.push(")</div><span class='line'></span><span class='address'>地址:");
        title.push(shop.address);
        title.push('</span>');
        head_title.innerHTML = title.join('');
        head.appendChild(head_title);

        var head_close = document.createElement("img");
        head_close.src = "images/close2.gif";
        head_close.onclick = close_shop_window;
        head.appendChild(head_close);

        open_win.appendChild(head);

        // 定义中部内容
        var middle = document.createElement("div");
        middle.className = "info-middle";
        middle.style.backgroundColor = 'white';
        middle.innerHTML = content;

        // 定义a标签，
        var a_tag = document.createElement("button");
        a_tag.className="detail_button"
        a_tag.setAttribute('data_id', shop.id);
        a_tag.innerHTML = '查看详情'
        a_tag.onclick = show_shop_details;
        middle.appendChild(a_tag);
        open_win.appendChild(middle);
        
        // 定义底部内容
        var bottom = document.createElement("div");
        bottom.className = "info-bottom";
        bottom.style.position = 'relative';
        bottom.style.top = '0px';
        bottom.style.margin = '0 auto';
        
        var sharp = document.createElement("img");
        sharp.className="bootom_image";
        sharp.src = "images/shape.png";
        bottom.appendChild(sharp);
        open_win.appendChild(bottom);
        return open_win;
    }
    
    /** 关闭信息窗口 **/
    function close_shop_window(){
        PandectMap.clearInfoWindow();
        $('#tool_search').val('');
    }
    
    /** 控制shop显示 **/
    function control_shop_show(bol){
        var shop_ids = Shops_Marker.getIds();
        for(var i=0;i<shop_ids.length;i++){
            var shop = Shops_Marker.get(shop_ids[i]);
            var marker = shop.marker;
            if(bol){
                if(marker){marker.show();}
            }else{
                if(marker){marker.hide();}
            }
        }
    }
    
    /** 切换到卫星地图 **/
    function change2moon(){
        $("#tool_plane").show();
        $("#tool_moon").hide();
        State_Layer.show();
    }
    
    /** 切换到二维地图 **/
    function change2panel(){
        $("#tool_plane").hide();
        $("#tool_moon").show();
        State_Layer.hide();
    }
    
    /** 切换到最大 **/
    function map_div_max(){
        var css_option = {
            position: 'fixed',
            top: '0',
            right: '0',
            width: '100%',
            height: '100%'
        }
        $("#map_pandect").css(css_option);
        $("#map_pandect").css('z-index', 999999);
        $("#tool_max").hide();
        $("#tool_min").show();
        set_width(false);
    }
    
    /** 切换到最小 **/
    function map_div_min(){
        var css_option = {
            position: 'relative',
            width: '100%',
            height: (height-tab_height-10)+'px'
        }
        $("#map_pandect").css(css_option);
        $("#map_pandect").css('z-index', 100);
        $("#tool_max").show();
        $("#tool_min").hide();
        set_width(false);
    }
    
    /**
    *** 联想输入
    **/
    function autoCompleteInput(obj){
        obj.autocomplete({
            minLength: 1,//最小联想长度，当输入内容长度达到这个长度时才进行联想
            width: '100%',  
            source: function(request, response){
                var results = search_vis(request.term);
                response($.map(results, function(item){ return { label: item.name, value: item.id}}));
            },
            select: function(event, ui) {
                obj.val(ui.item.label);
                var shop_id = ui.item.value;
                var shop_obj = Shops_Marker.get(shop_id);
                var shop_marker = shop_obj.marker;
                PandectMap.setZoomAndCenter(16, shop_marker.getPosition());
                openInfo(shop_marker);
                return false;
            },
            focus: function(event, ui){
                obj.val(ui.item.label);
                return false;
            }
        }); 
        
        obj.on("keydown",function(event){
            if(event.keyCode===8){
                obj.val("");
            }
        });
    }
    
    /** vis 搜索数据 **/
    function search_vis(dim){
        var result = Shops_Marker.get({
            fields: ['id', 'code', 'name'],
            filter: function (item) {
                if(CharTools.isString(dim)){
                    var dim_upper = dim.toUpperCase();
                    var dim_lower = dim.toLowerCase();
                    var bol = item.code.indexOf(dim_upper) >=0 || item.code.indexOf(dim_lower) >=0 || item.code.indexOf(dim) >=0 || item.name.indexOf(dim) >=0;
                    if (shop_check_flag !== "0" || shop_industry_flag !== "0"){
                        if (shop_check_flag == "0"){
                            return ((item.industry_code == shop_industry_flag) && bol);
                        }else if (shop_industry_flag == "0"){
                            return ((item.check_code == shop_check_flag) && bol);
                        }else {
                            return ((item.industry_code == shop_industry_flag && item.check_code == shop_check_flag) && bol);
                        }
                    }else {
                        return (bol);
                    }
                }else{
                    var bool = item.code.indexOf(dim) >=0 || item.name.indexOf(dim) >=0;
                    if (shop_check_flag !== "0" || shop_industry_flag !== "0"){
                        if (shop_check_flag == "0"){
                            return ((item.industry_code == shop_industry_flag) && bool);
                        }else if (shop_industry_flag == "0"){
                            return ((item.check_code == shop_check_flag) && bool);
                        }else {
                            return ((item.industry_code == shop_industry_flag && item.check_code == shop_check_flag) && bool);
                        }
                    }else {
                        return (bool);
                    }
                }
            }
        });
        return result;
    }

    /** 获取商铺检测状态列表、行业列表 **/
    function get_base_chioce() {
        var req_listener = {
            success:function (data) {
                var check_status = data.json.check_status;
                for (var i=0;i<check_status.length;i++){
                    var item_check = check_status[i];
                    $('#shop_check_status').append('<option value='+item_check.code+'>'+item_check.name+'</option>');
                }
                var industrys = data.json.industrys;
                for (var j=0;j<industrys.length;j++){
                    var item_indu = industrys[j];
                    $('#shop_industry').append('<option value='+item_indu.id+'>'+item_indu.name+'('+item_indu.code+')</option>');
                }
                $("#shop_check_status").change(function () {
                    shop_check_flag = $('#shop_check_status option:selected') .val();
                    close_shop_window();
                    refresh_shop_marker();
                });
                $("#shop_industry").change(function () {
                    shop_industry_flag = $('#shop_industry option:selected') .val();
                    close_shop_window();
                    refresh_shop_marker();
                });
            }
        };
        PageRequest.get_map_base_chioce(req_listener);
    }
    
    /** 根据删选条件刷新地图marker **/
    function refresh_shop_marker() {
        var clear_result = Shops_Marker.get();
        for (var i=0;i<clear_result.length;i++){
            var clear_shop = clear_result[i];
            clear_shop.marker.setMap(null);
        }
        var result = Shops_Marker.get({
            filter: function (item) {
                if (shop_check_flag !== "0" || shop_industry_flag !== "0"){
                    if (shop_check_flag == "0"){
                        return (item.industry_code == shop_industry_flag);
                    }else if (shop_industry_flag == "0"){
                        return (item.check_code == shop_check_flag);
                    }else {
                        return (item.industry_code == shop_industry_flag && item.check_code == shop_check_flag);
                    }
                }else {
                    return (true);
                }
            }
        });
        for (var j=0;j<result.length;j++){
            var shop = result[j];
            shop.marker.setMap(PandectMap);
        }
    }
    
    /** 点击详情显示详细信息 **/
    function show_shop_details(e){
        var id = $(e.target).attr("data_id");
        if(ValidData(id)){
            var req_listener = {
                success:function(data){
                    var shop = data.json;
                    shop.server = Settings.server
                    if($('.map_tools_left').length>0){$('.map_tools_left').remove();}
                    var shop_detail_html = template('temp_shop_details_info', shop);
                    $('#map_pandect').append(shop_detail_html);
                    // $('.amap-maps').append(shop_detail_html);
                    $(".map_info_details_close").on("click", close_shop_details);
                    $('.map_image').on("click", show_big_image);
                    $('#bill_more').on("click", goto_firesafety);
                    $('#bill_detail').on("click", goto_firesafety_inf);
                    $("#bill_images_list").carousel('pause');
                }
            }
            PageRequest.map_get_shop({id: id}, req_listener);
        }else{
            OpenModal.open_alert({option: 'error', body: "数据错误，没有获取到该商品的标识信息！"});
        }  
    }
    /** 跳转消防工单页面 **/
    function goto_firesafety() {
        NavTable.open_menu_by_name_new("消防工单",{model:'firesafety'});
    }
    function goto_firesafety_inf() {
        var value = $("#bill_detail").attr("data-value");
        NavTable.open_menu_by_name_new("消防工单",{model:'firesafety',action:'inf',data:{id:value}});
    }
    /** 点击关闭关闭该页面 **/
    function close_shop_details(event){
        if($(event.currentTarget).hasClass("map_info_details_close")){
            try{ event.stopPropagation();}catch(o){Tools.group("stopPropagation Error:", o);}
        }
        $('.map_tools_left').remove();
    }
    
    /** 展示大图 **/
    function show_big_image(event) {
        if($(event.currentTarget).hasClass("map_image")){
            var image = [];
            $('.map_image').each(function (index,ele) {
                var src = $(ele).attr('src');
                image.push(src);
            });
            var show_big_image_html = template('temp_show_big_image', {images:image});
            $("#map_pandect").append(show_big_image_html);
            var width = $("#map_pandect").width();
            var height = $("#map_pandect").height();
            $("#big_image_back_div").css({'width': width, 'height': height});
            // $(".map_info_details_close").on("click", close_show_big_image);
            $("#close_img").on("click", close_show_big_image);
            $("#map_pandect").resize(function(){
                var width = $("#map_pandect").width();
                var height = $("#map_pandect").height();
                $("#big_image_back_div").css({'width': width, 'height': height});
            });
        }
    }
    /** 点击关闭放大照片 **/
    function close_show_big_image(event){
        if($(event).hasClass("map_info_details_close")){
            try{ event.stopPropagation();}catch(o){Tools.group("stopPropagation Error:", o);}
        }
        $('#big_image_back_div').remove();
    }
    $(function(){
        $(window).keydown(function (event) {
            if (event.keyCode == 27) {
                close_show_big_image();
            }
        });
    });
    /** remove show_shop_details **/
    function remove_shop_details(){
        $('.map_tools_left').remove();
    }
});