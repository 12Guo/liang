import Taro, { PureComponent } from '@tarojs/taro'
import { View, Text, Block } from '@tarojs/components'
import AnnularChart from '@common/components/FpiChart/AnnularChart'
import EmptyHolder from '@common/components/EmptyHolder'
import { formatSplitString } from '@common/utils/common'
import get from 'lodash/get'
import cn from 'classnames'

import './index.scss'

interface SiteProgressProps {
    data: any;
}

interface SiteProgressState {

}

export default class SiteProgress extends PureComponent<SiteProgressProps, SiteProgressState> {
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    // @ts-ignore
    refPieChart = (node) => this.pieChart = node

    chartRender = (datas) => {
        const total = get(datas, 'total') || 0
        const allItems = get(datas, 'items') || {}
        const option = {
            grid: { x: 0, y: 5, x2: 0, y2: 0 },
            backgroundColor: '#ffffff',
            color: ['#27C5FF', '#FFC502', '#FF8F5D', '#6E79FF', '#32CCB5', '#3E9FFF'],
            graphic: [{
                type: 'text',
                left: 'center',
                top: '38%',
                style: {
                    text: total,
                    textAlign: 'center',
                    fill: '#414F70',
                    fontSize: 24
                }
            }, {
                type: 'text',
                left: 'center',
                top: '52%',
                style: {
                    text: '工地总数',
                    textAlign: 'center',
                    fill: '#7A8499',
                    fontSize: 14
                }
            }],
            series: [{
                type: 'pie',
                radius: ['49%', '70%'],
                itemStyle: {
                    normal: {
                        label: {
                            show: true,
                            textStyle: { color: '#3c4858', fontSize: "18" },
                            formatter: function (val) {
                                return '{a|' + val.name + '}{b| ' + val.value + '个}'
                            },
                            rich: {
                                a: { fontSize: 12 },
                                b: { fontSize: 12 }
                            }
                        },
                        labelLine: {
                            show: true,
                            lineStyle: { color: '#45bcf2' }
                        }
                    },
                },
                data: Object.keys(allItems).map(key => ({ value: allItems[key].value, name: formatSplitString(allItems[key].name, 4) }))
            }],
        }
        // @ts-ignore
        this.pieChart.refresh(option);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.data != this.props.data) {
            setTimeout(() => {
                this.chartRender(get(nextProps, 'data', {}) || {})
            }, 300)
        }
    }

    render() {
        const { data = {} } = this.props
        const { total = 0, subTotal = 0 } = data
        return (
            <View className='question-type'>
                <Text className='title'>工地进度状态</Text>
                <View className={cn("pie-chart", { "pie-chart--hide": total === 0 })}>
                    <AnnularChart ref={this.refPieChart} />
                </View>
                {total === 0 ? <EmptyHolder text='暂无数据' /> :
                    (
                        <View className='content'>
                            地基处理、土方开挖和基础/地下施状态工的工地一共有 <Text className='strong'>{subTotal}</Text>个，占所有工地总数的<Text className='strong'>{(100 * subTotal / total).toFixed(2)}%</Text>
                        </View>
                    )}
            </View>
        )
    }
}