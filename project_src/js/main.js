$(function(){
    "use strict"

    try{
        
        /** 初始化个人菜单 **/
        program_init_menu();
        
        /** 初始化个人信息 **/
        program_init_profile();

        /** 初始化联想 **/
        autoCompleteInput($("#menu-search"));
        
        /** 初始化Websokect **/
        init_soket();
        
    }catch(e){
        Tools.group("Inint Main Error.", e);
    }
    
    /** websoket **/ 
    function init_soket(){
        try{
            Settings.Socket = new WebSocket(Settings.ws_server);
            Settings.Socket.onmessage = function(e) {
                Tools.group("Websoket Data:", e);
                var msg_objs = CharTools.str2array(e.data);

                if($(".push_msg_li").length >0 ){
                    $('.ws_massage_push').off('click', msg_event);
                    $(".push_msg_li").each(function(indx,element){
                        var element_id = $(element).attr('id');
                        for(var i=0;i<msg_objs.length;i++){
                            var mes_id = msg_objs[i].id;
                            if("li_message_"+mes_id === element_id){
                                delete msg_objs[i];
                                break;
                            } 
                        }
                    });
                    var some_html = template('temp_ws_msg_pushed', {msg_objs:msg_objs});
                    $("#ws_msg_pushed").prepend(some_html);
                    msg_blink();

                    $(".notice").css("visibility", "visible");
                    $('.ws_massage_push').on('click', msg_event);
                }else{
                    var msg_html = template('temp_ws_msg_pushed', {msg_objs:msg_objs});
                    $("#ws_msg_pushed").html(msg_html);
                    msg_blink();
                    $('.ws_massage_push').on('click', msg_event);
                }  
            };

            Settings.Socket.onopen = function open() {
                Tools.info('WebSockets connection created.');
            };
            if (Settings.Socket.readyState == WebSocket.OPEN) Settings.Socket.onopen();
        }catch(e){
            Tools.group("WebSoket Error.", e);
        }
    }

    /** 初始化菜单 **/
    function program_init_menu(){
        var listener = {
            success:function(data){
                data.json.server = Settings.server;
                NavTable.set_cached_menus(data.json.menus);
                var html_str = template('temp_menu', data.json);
                $(".sidebar-menu").append(html_str);
                $('.click_menu').on('click', menu_event);

                NavTable.open_menu_by_name("仪表盘");
                // NavTable.open_menu_by_name("文件下载");
                // NavTable.open_menu_by_name("地图总览");
                // NavTable.open_menu_by_name_new("消防工单",{model:'firesafety',action:'add',data:{id:2}});

                Tools.info("Init Menus Success.");
            },
            error:function(xhr, type){
                Tools.group("Init Menus Error.",xhr,type);
            }
        }
        PageRequest.get_menus(listener);
    }
    
    /** 初始化个人信息 **/
    function program_init_profile(){
        var listener = {
            success: function(data){
                if(data.code === 0){
                    var data_format = data.json;
                    data_format.server = Settings.server
                    data_format.avatar = data_format.avatar;
                    Settings.account = data_format;

                    var left_html = template("temp_left_profile", data_format);
                    $("#left_profile").html(left_html);
                    
                    var right_html = template("temp_right_profile", data_format);
                    $("#right_profile").html(right_html);
                    
                    /** 初始化退出登录 **/
                    $(".main_login_out").on("click", login_out);
                    
                    /** 初始化个人设置 **/
                    $(".main_person_profile").on("click", function(){
                       NavTable.open_menu_by_name("个人信息");
                    });
                    // 系统消息
                    $(".main_push_message_profile").on("click", function(){
                        NavTable.open_menu_by_name("消息管理");
                    });
                }else{
                    Tools.group("Init Profile Error.", data);
                }
            },
            error: function(xhr, response){
                Tools.group("Init Profile Error.", xhr, response);
            }
        }
        PageRequest.get_account_info(listener);
    }
    
    /**
    *** 联想输入
    **/
    function autoCompleteInput(obj){
        obj.autocomplete({
            minLength: 1,//最小联想长度，当输入内容长度达到这个长度时才进行联想
            width: '100%',  
            source: function(request, response){
                var results = NavTable.search_cached_menu(request.term);
                response($.map(results, function(item){ return { label: item.name, value: item.id}}));
            },
            select: function(event, ui) {
                obj.val(ui.item.label);
                if($("#menu_"+ui.item.value).parent().parent().hasClass("treeview-menu") && !$("#menu_"+ui.item.value).parent().parent().parent().hasClass("active")){
                    $("#menu_"+ui.item.value).parent().parent().parent().children().first().click();
                }
                $("#menu_"+ui.item.value).click();
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
    
    /** 点击菜单方法 **/
    function menu_event(e){
        if($(e.target).attr('data-click') == 'on'){
            NavTable.addTab(e.target);
        }
    }
    
    /** 登出 **/
    function login_out(){
        var litsener = {
            success:function(data){
                if(data.code === 0){
                    $(location).attr('href', 'index.html');
                }else{
                    OpenModal.open_alert({option: 'error', body: data.code_desc});
                }
            },
            error:function(xhr, reponse){
                OpenModal.open_alert({option: 'error', body: "网络错误，请重试！"});
                Tools.group("Login Out Error.", xhr, reponse);
            }
        };
        PageRequest.login_out(litsener);
    }

    /** 点击消息方法 **/
    function msg_event(e){
        var msg_id = $(e.target).attr('data-id');
        var json_array = {option: 'readmessage', message_id:msg_id};

        var notice_data = JSON.parse($(e.target).attr('data'));
        notice_data.change = "info";
        Tools.group("Show Massage", notice_data);
        var notice_html = template("temp_main_notice_show", notice_data);
     
        var listener = {
            option: "info",
            body: notice_html,
            sure_show: "已阅",
            sure:function(){
                Settings.Socket.send(CharTools.json2str(json_array));
                $("#li_message_"+msg_id).remove();
                OpenModal.close();
            }
        };
        OpenModal.open(listener);
    }
    
    /** div闪烁 **/
    function msg_blink() {
        // $(".dropdown-toggle").css("background-color","red");

        var timer = null;   //定义时间器
        var i = 0;
        clearInterval(timer); //先清空时间器
        $("#push_msg_blink").on("click",function(){ //当鼠标移入div时 清空时间器
            $("#push_msg_blink_i").css("color", "white");
            $("#push_msg_blink_i").css("visibility", "visible");
            clearInterval(timer);
            $(".notice").css("visibility", "hidden");
        });
        timer = setInterval(function () {
            var vasible = i++ % 2 ? "hidden" : "visible";
            // $("#push_msg_blink_i").css("visibility", vasible);
            $(".notice").css("visibility", vasible);
            // $("#push_msg_blink_i").css("color", "red");
        }, 500 );
    }
});