$(function () {
        "use strict";
        var wait = 180;

        $("#forget_pwd_message").on("click", function (e) {
            close_message(e);
        });


        function show_message(mess) {
            $("#forget_pwd_content").removeClass('messge_hidde');
            $("#login_error_message").html(mess);
            setTimeout(close_message, 2000);
        }

        function close_message() {
            $("#forget_pwd_content").addClass('messge_hidde');
        }

        function show_login_message() {
            $("#login_logining").removeClass('loging_logining_hidden');
        }

        function hide_login_message() {
            $("#login_logining").addClass('loging_logining_hidden');
        }

        /**
         *  保存 点击事件
         */
        $("#change_pwd").on("click", function () {
            if (validate_save()) {
                change_pwd();
            }

        });

        /**
         * 获取验证码 点击事件
         */
        $("#identify_button").on("click", function () {
            if (validate_send_code()) {
                send_code();
            } else {
                show_message("用户名不能为空");
            }

        });

        /**
         * 密码输入项不能 输入空格
         */
        $("#password").keypress(function () {
            if (event.keyCode === 32) {
                event.returnValue = false;
            }
        });
        $("#verify_password").keypress(function () {
            if (event.keyCode === 32) {
                event.returnValue = false;
            }
        });

        /**
         * 验证码倒计时
         * @param o
         */
        function time() {
            if (wait === 0) {
                $('#identify_button').removeAttr("disabled", true);
                $('#identify_button').html("获取验证码");
                wait = 180;
            } else {
                $('#identify_button').attr("disabled", true);
                $('#identify_button').html("重新发送(" + wait + ")");
                wait--;
                setTimeout(function () {
                        time();
                    },
                    1000);
            }
        }

        /**
         * 获取验证码
         */

        function send_code() {
            var req_data = {};
            req_data.username = $("#username").val()
            req_data.format = Settings.ajax_format == 'jsonp' ? 'jsonp' : 'json';

            Tools.group('username', req_data.username);
            show_login_message();
            $.ajax({
                type: "POST",
                url: Settings.server + '/fmap/api/account/reset/vcode/get',
                data: req_data,
                dataType: Settings.ajax_format,
                timeout: 30000,
                success: function (data) {
                    Tools.group('after_net_request', data);
                    if (data.code === 0 || data.code == -100) {
                        Tools.group('after_net_request', data);
                        var obj = {};
                        obj = data.json;
                        wait = obj.expire;
                        time();
                        Tools.group('after_net_request', obj.expire);
                    } else {
                        show_message(data.code_desc);
                    }
                },
                error: function (xhr, type) {
                    show_message('网络错误，请稍候重试！');
                    Tools.group('网络错误，请稍候重试！', xhr, type);
                },
                complete: function () {
                    hide_login_message();
                }
            });
        }

        /**
         * 修改密码 的保存
         */
        function change_pwd() {

            var req_data = {};
            Tools.group('forget_pwd_html', req_data);
            req_data.username = $("#username").val();
            req_data.vcode = $("#identify_code").val();
            req_data.password = $("#password").val();

            req_data.format = Settings.ajax_format === 'jsonp' ? 'jsonp' : 'json';
            show_login_message();
            $.ajax({
                type: "POST",
                url: Settings.server + '/fmap/api/account/reset',
                data: req_data,
                dataType: Settings.ajax_format,
                timeout: 30000,
                success: function (data) {
                    if (data.code === 0 || data.code == -100) {
                        Tools.group('after_net_request', data);

                        $(location).attr('href', 'index.html');
                    } else {
                        show_message(data.code_desc);
                    }
                },
                error: function (xhr, type) {
                    show_message('网络错误，请稍候重试！');
                    Tools.group('网络错误，请稍候重试！', xhr, type);
                },
                complete: function () {
                    hide_login_message();
                }
            });
        }

        /**
         *获取验证码 验证是否可提交
         */
        function validate_send_code() {
            var checked = true;
            var username = $("#username").val();

            if (!ValidData(username)) {
                // show_message('用户名不能为空！');
                $("#username").focus();
                checked = false;
                return checked;
            }
            return checked;
        }

        /**
         * 保存密码 验证是否可提交
         * @returns {boolean}
         */
        function validate_save() {
            var checked = true;
            var username = $("#username").val();
            var identify_code = $("#identify_code").val();
            var password = $("#password").val();
            var verify_password = $("#verify_password").val();

            if (!ValidData(username)) {
                show_message('用户名不能为空！');
                $("#username").focus();
                checked = false;
                return checked;
            }

            if (!ValidData(identify_code)) {
                show_message('验证码不能为空！');
                $("#identify_code").focus();
                checked = false;
                return checked;
            }

            if (!ValidData(password)) {
                show_message('密码不能为空！');
                $("#password").focus();
                checked = false;
                return checked;
            }

            if (!ValidData(verify_password)) {
                show_message('验证密码不能为空！');
                $("#verify_password").focus();
                checked = false;
                return checked;
            }

            if (password !== verify_password) {
                show_message('两次密码输入不一致！');
                $("#verify_password").focus();
                checked = false;
                return checked;
            }

            return checked;
        }

    }
);