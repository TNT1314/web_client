$(function(){
    "use strict"

    // $('input').iCheck({
    //     checkboxClass: 'icheckbox_square-blue',
    //     radioClass: 'iradio_square-blue',
    //     increaseArea: '20%' // optional
    // });

    $("#login_buttom").on("click",function(){
        login_system();
        return false;
    });


    $("#close_login_message").on("click", function(e){
        close_message(e);
    });
    

    function show_message(mess){
        $("#login_message_content").removeClass('messge_hidde');
        $("#login_error_message").html(mess);
        setTimeout(close_message, 2000);
    }

    function close_message(){
        $("#login_message_content").addClass('messge_hidde');
    }

    function show_login_message(){
        $("#login_logining").removeClass('loging_logining_hidden');
    }

    function hide_login_message(){
        $("#login_logining").addClass('loging_logining_hidden');
    }
    
    function validate_input(){
        var checked = true;
        var user = $("#username").val();
        
        if (!ValidData(user)){
            show_message('用户名不能为空！');
            $("#username").focus();
            checked = false;
            return checked;
        }
        
        var pass = $("#password").val();
        if (!ValidData(pass)){
            show_message('密码不能为空！');
            $("#password").focus();
            checked = false;
            return checked;
        }
        
        return checked;
    }
    
    function login_system(){
        if(validate_input()){
            var form_data = $("#login_form").serialize();
            if(Settings.ajax_format=='jsonp'){ form_data += '&format=jsonp';}
            show_login_message();
            $.ajax({
                type: "POST",
                url: Settings.server + '/fmap/api/account/login',
                data: form_data,
                dataType: Settings.ajax_format,
                timeout: 30000,
                success: function (data) {
                    if(data.code===0 || data.code==-100){
                        $(location).attr('href', 'main.html');
                    }else{
                        show_message(data.code_desc);
                    }
                },
                error: function (xhr, type) {
                    show_message('网络错误，请稍候重试！');
                    Tools.group('网络错误，请稍候重试！', xhr, type);
                },
                complete: function(){
                    hide_login_message();
                }
            });
        }
    }
});