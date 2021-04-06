import Taro, { Component } from "@tarojs/taro";
import * as echarts from "../ec-canvas/echarts";

function setChartData(option,chart, data) {
    // let option = {
    //     grid: { x: 0, y: 5, x2: 0, y2: 0 },
    //     backgroundColor: '#ffffff',
    //     color: ['#27C5FF', '#FFC502', '#FF8F5D', '#6E79FF', '#32CCB5', '#3E9FFF'],
    //     graphic: [{
    //         type: 'text',
    //         left: 'center',
    //         top: '38%',
    //         style: {
    //             text: '128',
    //             textAlign: 'center',
    //             fill: '#414F70',
    //             fontSize: 24
    //         }
    //     },{
    //         type: 'text',
    //         left: 'center',
    //         top: '52%',
    //         style: {
    //             text: '问题总数',
    //             textAlign: 'center',
    //             fill: '#7A8499',
    //             fontSize: 14
    //         }
    //     }],
    //     series: [{
    //         type: 'pie',
    //         radius: ['49%', '70%'],
    //         itemStyle: {
    //             normal: {
    //                 label: {
    //                     show: true,
    //                     textStyle: { color: '#3c4858', fontSize: "18" },
    //                     formatter: function (val) {
    //                         return '{a|' + val.name + '}{b| ' + val.value + '个}'
    //                     },
    //                     rich: {
    //                         a: { fontSize: 12 },
    //                         b: { fontSize: 12 }
    //                     }
    //                 },
    //                 labelLine: {
    //                     show: true,
    //                     lineStyle: { color: '#45bcf2' }
    //                 }
    //             },
    //         },
    //         data: [
    //             { value: 24, name: '未湿法作业' },
    //             { value: 28, name: '道路未硬化' },
    //             { value: 9, name: '土方作业' },
    //             { value: 5, name: '建筑垃圾' },
    //             { value: 16, name: '垃圾焚烧' },
    //             { value: 43, name: '裸土未覆盖' }
    //         ]
    //     }],
    // }
    chart.setOption(option);
}

export default class PieChart extends Component {
    config = {
        usingComponents: {
            "ec-canvas": "../ec-canvas/ec-canvas"
        }
    };

    constructor(props) {
        super(props);
    }

    state = {
        ec: {
            lazyLoad: true
        }
    };

    refresh(option,data) {
        this.Chart.init((canvas, width, height) => {
            const chart = echarts.init(canvas, null, {
                width: width,
                height: height
            });
            setChartData(option,chart, data);
            return chart;
        });
    }

    refChart = node => (this.Chart = node);

    render() {
        return (
            <ec-canvas
                ref={this.refChart}
                canvas-id="mychart-area"
                ec={this.state.ec}
            />
        );
    }
}