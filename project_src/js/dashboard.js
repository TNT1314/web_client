$(function () {
    "use strict"


    var linebar;
    try{
        var load_listener = {
            success:function(data){
                var result = data.json;
                draw_chunck(result.chunk);

                linebar =  result.area;
                linebar.account = Settings.account;

                var select_option = template('temp_summary_of_work_orders_select',linebar);
                $("#summary_of_work_orders_select_option").append(select_option);

                draw_new_bar();

                $("#summary_of_work_orders_select").on("change", draw_new_bar);
            }
        }
        PageRequest.get_dashbord_data(load_listener);
    }catch(e){
        Tools.group("loading error", e);
    }
    
    function draw_chunck(data){
        data.account = Settings.account;
        var select_option = template('temp_dashboard_select_option', data);
        $("#dashboard_select_option").append(select_option);

        data.ind_id = "total";
        var chunck = template('temp_dashboard_chunk', data);
        $("#dashboard_chunk").append(chunck);
        $('#dashboard_select_industry').on("change", dashboard_choice_show);

        function dashboard_choice_show() {
            $("#dashboard_chunk").empty();
            var option = $('#dashboard_select_industry>option:selected');
            var industry_id = option.attr("id");
            data.ind_id = industry_id;
            var chunck = template('temp_dashboard_chunk', data);
            $("#dashboard_chunk").append(chunck);
        }
    }

    function draw_new_bar(){
        var data = linebar;
        var value = $('#summary_of_work_orders_select>option:selected').attr("value");

        data.acc_id = value;
        var barData = change_data(data);

        $("#chart").empty().append('<canvas id="barChart" style="height:300px"></canvas>');

        var barChartCanvas = $("#barChart").get(0).getContext("2d");
        // This will get the first returned node in the jQuery collection.
        var barChart = new Chart(barChartCanvas);

        var template_arr = [];
        template_arr.push("<ul class=\"<%=name.toLowerCase()%>-legend\">");
        template_arr.push("  <% for (var i=0; i<datasets.length; i++){%>");
        template_arr.push("    <li>");
        template_arr.push("      <span style=\"background-color:<%=datasets[i].fillColor%>\"></span>");
        template_arr.push("        <%if(datasets[i].label){%><%=datasets[i].label%><%}%>");
        template_arr.push("  <%}%>");
        template_arr.push("    </li>");
        template_arr.push("</ul>");

        var barOption = $.extend({
            legendTemplate: template_arr.join("")
        },Settings.barChartOptions);

        barOption.datasetFill = false;
        barChart.Bar(barData, barOption);
    }

    
    function change_data(data){
        var chardata = {};
        
        var labels = [];
        var all_count = [];
        var unqualid_count = [];
        var qualid_count = [];

        var order_stas = data.summary_of_work_orders_list;
        for(var i=0;i<order_stas.length;i++){
            if(data.account.manager || data.account.rank_type == 2){
                if(data.acc_id == order_stas[i].acc_id){
                    for(var j=0;j<order_stas[i].order_statistics.length;j++){
                        labels.push(order_stas[i].order_statistics[j].static_date);
                        all_count.push(order_stas[i].order_statistics[j].all_bill_count);
                        unqualid_count.push(order_stas[i].order_statistics[j].unq_bill_count);
                        qualid_count.push(order_stas[i].order_statistics[j].qua_bill_count);
                    }
                    break;
                }
            }else{
                if(data.account.id == order_stas[i].acc_id){
                    for(var k=0;k<order_stas[i].order_statistics.length;k++){
                        labels.push(order_stas[i].order_statistics[k].static_date);
                        all_count.push(order_stas[i].order_statistics[k].all_bill_count);
                        unqualid_count.push(order_stas[i].order_statistics[k].unq_bill_count);
                        qualid_count.push(order_stas[i].order_statistics[k].qua_bill_count);
                    }
                    break;
                }
            }
        }

        chardata.labels = labels;
        chardata.datasets = [
            {
              label: "总单量",
              fillColor: "rgba(255, 153, 51, 0.9)",
              strokeColor: "rgba(14, 14, 14, 0.2)",
              pointColor: "rgba(255, 153, 51, 0.8)",
              pointStrokeColor: "rgba(255, 153, 51, 0.8)",
              pointHighlightFill: "#FFFFFF",
              pointHighlightStroke: "rgba(255, 153, 51, 0.9)",
              data: all_count
            },
            {
              label: "不合格",
              fillColor: "rgba(255, 51, 0, 0.8)",
              strokeColor: "rgba(14, 14, 14, 0.2)",
              pointColor: "rgba(255, 51, 0, 0.8)",
              pointStrokeColor: "rgba(255, 51, 0, 1)",
              pointHighlightFill: "#FFFFFF",
              pointHighlightStroke: "rgba(255, 51, 0, 0.8)",
              data: unqualid_count
            },
            {
              label: "合格",
              fillColor: "rgba(51, 102, 255, 0.7)",
              strokeColor: "rgba(14, 14, 14, 0.2)",
              pointColor: "rgba(51, 102, 255, 0.7)",
              pointStrokeColor: "rgba(51, 102, 255, 1)",
              pointHighlightFill: "#FFFFFF",
              pointHighlightStroke: "rgba(51, 102, 255, 0.7)",
              data: qualid_count
            }
        ];
        return chardata
    }
});