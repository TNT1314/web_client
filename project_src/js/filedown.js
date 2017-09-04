$(function () {
    "use strict"
    
    var model = 'filedown';
    try{
        show_file_down_body();
    }catch(e){
        Tools.group('Run Model '+model+' Error.', e);
    }
    
    function show_file_down_body(){
        var account = Settings.account;
        Tools.group("account", account);
        var html_str = template('filedown_template', {account: account});
        $("#filedown_body").append(html_str);
        
        if(account.manager || account.rank_type===2){
            $(".filedown_button").on("click", get_tar_result);
            lenovo_account();
        }else{
            $(".filedown_button").on("click", get_worker_tar_result);
        }
        set_year_option();
        
        
        
    }
    
    
    function set_year_option(){
        var nowdate = new Date();  
        var now_year = nowdate.getFullYear();
        $(".year").each(function(idx,ele){
            $(ele).append("<option value='"+(now_year-2)+"'>"+(now_year-2)+"</option>");
            $(ele).append("<option value='"+(now_year-1)+"'>"+(now_year-1)+"</option>");
            $(ele).append("<option value='"+now_year+"'>"+now_year+"</option>");
        });
        
        $(".month").each(function(idx,ele){
            $(ele).append("<option value='01'>01</option>");
            $(ele).append("<option value='02'>02</option>");
            $(ele).append("<option value='03'>03</option>");
            $(ele).append("<option value='04'>04</option>");
            $(ele).append("<option value='05'>05</option>");
            $(ele).append("<option value='06'>06</option>");
            $(ele).append("<option value='07'>07</option>");
            $(ele).append("<option value='08'>08</option>");
            $(ele).append("<option value='09'>09</option>");
            $(ele).append("<option value='10'>10</option>");
            $(ele).append("<option value='11'>11</option>");
            $(ele).append("<option value='12'>12</option>");
        });
    }
    
    
    /** 获取选中纪录某个字段 **/
    function lenovo_account(){
        $("#account_name").autocomplete({
            source: function(request, response) {
                var dim_data = {dim:request.term}
                PageRequest.get_account_lenovo(dim_data, {
                    success:function(data){
                        response($.map(data.json, function(item){ return { label: item.username, value: item.id}}));
                    }
                });
            },
            minLength: 1,
            select: function(event, ui) {
                $("#account").val(ui.item.value);
                this.value = ui.item.label;
                return false;
            },
            focus: function(event, ui){
                $("#account").val(ui.item.value);
                $("#account_name").val(ui.item.label);
                return false;
            }
        });
        
        $("#account_name").on("keydown",function(event){
            if(event.keyCode===8){
                $("#account").val("");
                $("#account_name").val("");
            }
        });
    }
    
    
    /** 获取结果 **/
    function get_tar_result(e){
        var formid = $(e.target).attr("name");
        $("#"+formid+"_file_down").empty();
        var data = $("#"+formid).serializeArray();
        if(ValidData(data) && valid_form(formid).form()){
            PageRequest.get_targzfile_reult(data,
                {
                    success: function (data) {
                        var result = data.json;
                        var down_url = Settings.server + result.url;
                        var down_con = [];
                        down_con.push("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");
                        down_con.push("<a href="+down_url+" target='_blank'>下载</a>");
                        down_con.push("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");
                        down_con.push(result.desc);
                        $("#"+formid+"_file_down").empty().append(down_con.join(""));
                    }
                }
            );
        }
    }
    
    /** 获取结果 **/
    function get_worker_tar_result(e){
        var formid = $(e.target).attr("name");
        $("#"+formid+"_file_down").empty();
        var data = $("#"+formid).serializeArray();
        if(ValidData(data) && valid_form(formid).form()){
            PageRequest.get_worker_targzfile_reult(data,
                {
                    success: function (data) {
                        var result = data.json;
                        var down_url = Settings.server + result.url;
                        var down_con = [];
                        down_con.push("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");
                        down_con.push("<a href="+down_url+" target='_blank'>下载</a>");
                        down_con.push("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");
                        down_con.push(result.desc);
                        $("#"+formid+"_file_down").empty().append(down_con.join(""));
                    }
                }
            );
        }
    }
    
    //验证表单
    function valid_form(formid) {
        if(formid==="year"){
            return $("#"+formid).validate({
                rules: {
                    year:{isValidity:true}
                },
                messages: {
                    year:{required:"请选择年限"}
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
        }else if(formid==="year_month"){
           return $("#"+formid).validate({
                rules: {
                    year:{isValidity:true},
                    month:{isValidity:true}
                },
                messages: {
                    year:{required:"请选择年份"},
                    month:{required:"请选择月份"}
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
        }else if(formid==="year_month_account"){
           return $("#"+formid).validate({
                rules: {
                    year:{isValidity:true},
                    month:{isValidity:true},
                    account_name:{isValidity:true}
                },
                messages: {
                    year:{required:"请选择年份"},
                    month:{required:"请选择月份"},
                    account_name:{required:"请选择人员"}
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
    }
});