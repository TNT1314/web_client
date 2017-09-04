$(function () {
    "use strict";

    try {
        var load_listener = {
            success: function (data) {
                var data_format = data.json;
                data_format.server = Settings.server;
                data_format.avatar = data_format.avatar;

                var person_html = template("temp_person_change", data_format);
                $("#person").find($(".box-body")).html(person_html);

                var warper_height = $(".content-wrapper").height();
                var body_height = warper_height - 43;

                $("#person").css("height", body_height);
                $("#person").css("margin-bottom", 0);

                $("#peoson_submit").on("click", click_submit);
                $("#peoson_edit").on("click", click_edit);
            }
        };

        PageRequest.get_account_info(load_listener);
    } catch (e) {
        Tools.group("Run Model Person Error.", e);
    }


    function click_submit() {
        if (valid_form().form() && $("#password").val() == $("#password_sure").val()) {
            var req_data = {
                mobile1: $("#mobile1").val(),
                mobile2: $("#mobile2").val(),
                email: $("#email").val(),
                avatar: $("#avatar_hidden").val(),
                password: $("#password").val()
            };
            PageRequest.account_info_modify(
                req_data,
                {
                    success: function (data) {
                        var info = {
                            option: 'info',
                            body: '个人信息修改成功！',
                            sure: function () {
                                OpenModal.close_confirm();
                                $(".model_div_row_hidde").hide();
                                $(".model_div_row_edit").show();
                                $("#email").attr("disabled", true);
                                $("#mobile1").attr("disabled", true);
                                $("#mobile2").attr("disabled", true);

                                var code = data.json.code;
                                if (code === -200) {
                                    login_out();
                                }
                            }
                        };
                        OpenModal.open_alert(info);
                        $("#avatar_id").off('click');

                    }
                }
            );
        } else {
            if (valid_form().form()) {
                if ($("#password").val() != $("#password_sure").val()) {
                    if (!$("#password").hasClass("tooltip")) {
                        $("#password").attr({"data-original-title": "两次输入新密码不相同！"}).tooltip("show");
                    }
                }
            }
        }
    }

    /** 登出 **/
    function login_out() {
        var litsener = {
            success: function (data) {
                if (data.code === 0) {
                    $(location).attr('href', 'index.html');
                } else {
                    OpenModal.open_alert({option: 'error', body: data.code_desc});
                }
            },
            error: function (xhr, reponse) {
                OpenModal.open_alert({option: 'error', body: "网络错误，请重试！"});
                Tools.group("Login Out Error.", xhr, reponse);
            }
        };
        PageRequest.login_out(litsener);
    }

    function click_edit() {
        var person_html = template('change_person_message');

        var edit_person_listener = {
            body: person_html,
            option: 'edit',
            sure_show: "确认",
            sure: function () {
                if (valid_password_form().form()) {
                    //请求密码是否正确
                    var password = $("#per_password").val();
                    PageRequest.account_info_verify(
                        {password: password},
                        {
                            success: function (data) {
                                OpenModal.close_confirm();
                                var info = {
                                    option: 'info',
                                    body: '密码验证成功，请修改信息！',
                                    sure: function () {
                                        $(".model_div_row_hidde").show();
                                        $(".model_div_row_edit").hide();
                                        $("#email").attr("disabled", false);
                                        $("#mobile1").attr("disabled", false);
                                        $("#mobile2").attr("disabled", false);
                                        $("#password").attr("value", password);
                                        $("#password_sure").attr("value", password);
                                    }
                                };
                                OpenModal.open_alert(info);

                                $("#avatar").on("change", image2base64);

                                $("#avatar_id").on("click", function () {
                                    $("#avatar").click();
                                });
                                Tools.group("Update Account Success.", data);
                            }
                        }
                    );
                } else {
                    if (valid_password_form().form()) {
                        if ($("#per_password").val() != $("#per_password_sure").val()) {
                            if (!$("#per_password").hasClass("tooltip")) {
                                $("#per_password").attr({"data-original-title": "两次输入密码不相同！"}).tooltip("show");
                            }
                        }
                    }
                }
            }
        };
        OpenModal.open_confirm(edit_person_listener);
        /**
         * 密码输入项不能 输入空格
         */
        $("#per_password").keypress(function () {
            if (event.keyCode === 32) {
                event.returnValue = false;
            }
        });
        $("#per_password_sure").keypress(function () {
            if (event.keyCode === 32) {
                event.returnValue = false;
            }
        });
        $("#password").keypress(function () {
            if (event.keyCode === 32) {
                event.returnValue = false;
            }
        });
        $("#password_sure").keypress(function () {
            if (event.keyCode === 32) {
                event.returnValue = false;
            }
        });
    }

    //验证修改个人信息提交表单
    function valid_form() {
        return $("#person_form").validate({
            rules: {
                email: {isEmail: true},
                mobile1: {isMobile: true},
                mobile2: {isMobile: true},
                password: {isPWD: true},
                password_sure: {isPWD: true}
            },
            messages: {
                email: {required: "请填写"},
                mobile1: {required: "请填写"},
                mobile2: {required: "请填写"},
                password: {required: "请填写"},
                password_sure: {required: "请填写"}
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
                    $(element).attr({"title": $(error).text()}).tooltip("show");
                }
            }
        });
    }

    //验证修改前密码表单
    function valid_password_form() {
        return $("#change_person_message_form").validate({
            rules: {
                per_password: {isPWD: true}
            },
            messages: {
                per_password: {required: "请填写"}
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
                    $(element).attr({"title": $(error).text()}).tooltip("show");
                }
            }
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
