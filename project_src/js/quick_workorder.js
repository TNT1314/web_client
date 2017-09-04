$(function () {
    "use strict"

    try {
        /**
         * 未检查单据
         * @type {string}
         */
        var model_1 = 'no_inspect_order';
        // 获取table初始化参数
        var options_1 = get_table_option(model_1);
        // 初始化列表
        var table_1 = $('#' + model_1 + '_table').DataTable(options_1);
        // 添加列表单选监听
        TableTools.selected_listener(table_1, model_1 + '_table');
        table_1.on('click', 'a', function () {
            var data = table_1.row($(this).parents('tr')).data();
            goto_firesafety(data.id, data.name);
        });

        /**
         * 7天内需检查单据
         * @type {string}
         */
        var model_2 = 'require_inspect_order';
        // 获取table初始化参数
        var options_2 = get_table_option(model_2);
        // 初始化列表
        var table_2 = $('#' + model_2 + '_table').DataTable(options_2);
        // 添加列表单选监听
        TableTools.selected_listener(table_2, model_2 + '_table');

        table_2.on('click', 'a', function () {
            var data = table_2.row($(this).parents('tr')).data();
            if (data.check_status === '待复检') {
                goto_firesafety_recheck(data.last_check_bill);
            } else {
                goto_firesafety(data.id, data.name);
            }
        });
        /**
         * 待复检单据
         * @type {string}
         */
        var model_3 = 'wait_inspect_order';
        // 获取table初始化参数
        var options_3 = get_table_option(model_3);
        // 初始化列表
        var table_3 = $('#' + model_3 + '_table').DataTable(options_3);
        // 添加列表单选监听
        TableTools.selected_listener(table_3, model_3 + '_table');

        table_3.on('click', 'a', function () {
            var data = table_3.row($(this).parents('tr')).data();
            goto_firesafety_recheck(data.last_check_bill);
        });

        /**
         * 待复检单据
         * @type {string}
         */
        var model_4 = 'timeout_order';
        // 获取table初始化参数
        var options_4 = get_table_option(model_4);
        // 初始化列表
        var table_4 = $('#' + model_4 + '_table').DataTable(options_4);
        // 添加列表单选监听
        TableTools.selected_listener(table_4, model_4 + '_table');
        table_4.on('click', 'a', function () {
            var data = table_4.row($(this).parents('tr')).data();
            if (data.check_status === '待复检') {
                goto_firesafety_recheck(data.last_check_bill);
            } else {
                goto_firesafety(data.id, data.name);
            }
        });

    } catch (e) {
        Tools.group('Run Model Account Error.', e);
    }

    /** ----------------------------------- 内部方法 ----------------------------------------**/
    // 获取列表配置
    function get_table_option(d_model) {
        var myurl;
        switch (d_model) {
            case ('no_inspect_order'):
                myurl = '/fmap/api/shop/uncheck/list/get';
                break;
            case ('require_inspect_order'):
                myurl = '/fmap/api/shop/seven/list/get';
                break;
            case ('wait_inspect_order'):
                myurl = '/fmap/api/shop/unrecheck/list/get';
                break;
            case ('timeout_order'):
                myurl = '/fmap/api/shop/timeout/list/get';
                break;
        }

        var new_option = {};
        $.extend(new_option, Settings.paging, {
            dom: '<"#' + d_model + '_tool_bar">frtip',
            pageLength: 5,
            ajax: {
                url: TableTools.get_url(myurl),
                type: TableTools.ajax_type,
                dataType: TableTools.ajax_format,
                data: function (params) {
                    params.code = $("#" + d_model + "_code").val();
                    params.shop_name = $("#" + d_model + "_shop_name").val();
                }
            },
            aoColumns: [
                {"data": "id"},
                {"data": "code"},
                {"data": "name"},
                {"data": "opera_status"},
                {"data": "check_status"},
                {"data": "address"},
                {"data": "regis_address"},
                {
                    "targets": -1,
                    "data": null,
                    "defaultContent": "<a>创建工单>></a> "
                }
            ],
            destroy: true
        });
        return new_option;
    }

    /** 跳转消防工单页面 **/

    //创建消防工单
    function goto_firesafety(shop_id, name) {
        var value_id = shop_id;
        var value_name = name;
        NavTable.open_menu_by_name_new("消防工单", {
            model: 'firesafety',
            action: 'add',
            data: {id: value_id, name: value_name}
        });
    }

    //创建复检单
    function goto_firesafety_recheck(bill_id) {
        var value_id = bill_id;
        NavTable.open_menu_by_name_new("消防工单", {model: 'firesafety', action: 'recheck', data: {id: value_id}});
    }
});