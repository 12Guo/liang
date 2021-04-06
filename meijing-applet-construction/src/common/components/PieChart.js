import Taro, { Component } from "@tarojs/taro";
import * as echarts from "./ec-canvas/echarts";

function setChartData(chart, data) {
    let option = {
        grid: { x: 0, y: 5, x2: 0, y2: 0 },
        backgroundColor: '#ffffff',
        color: ['#52bbff', '#4ef2f2', '#f4536a', '#e6923e', '#357aae', '#45bcf2'],
        series: [{
            type: 'pie',
            radius: ['49%', '65%'],
            itemStyle: {
                normal: {
                    label: {
                        show: true,
                        textStyle: { color: '#3c4858', fontSize: "18" },
                        formatter: function (val) {
                            return '{a|' + val.name + '}{b| ' + val.value + '%}'
                        },
                        rich: {
                            a: { fontSize: 15 },
                            b: { fontSize: 15 }
                        }
                    },
                    labelLine: {
                        show: true,
                        lineStyle: { color: '#45bcf2' }
                    }
                },
            },
            data: [
                { value: 20, name: '数学' },
                { value: 20, name: '英语' },
                { value: 15, name: '语文' },
                { value: 15, name: '物理' },
                { value: 15, name: '化学' },
                { value: 30, name: '生物' }
            ]
        }],
    }
    chart.setOption(option);
}

export default class PieChart extends Component {
    config = {
        usingComponents: {
            "ec-canvas": "./ec-canvas/ec-canvas"
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

    refresh(data) {
        this.Chart.init((canvas, width, height) => {
            const chart = echarts.init(canvas, null, {
                width: width,
                height: height
            });
            setChartData(chart, data);
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