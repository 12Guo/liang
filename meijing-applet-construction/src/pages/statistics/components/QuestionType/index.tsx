import Taro, { PureComponent } from '@tarojs/taro'
import { View, Text, Block } from '@tarojs/components'
import AnnularChart from '@common/components/FpiChart/AnnularChart'
import EmptyHolder from '@common/components/EmptyHolder'
import get from 'lodash/get'
import cn from 'classnames'
import { formatSplitString } from '@common/utils/common'

import './index.scss'

interface QuestionTypeProps {
    data: any;
}

interface QuestionTypeState {

}

interface statisticItem {
    incidentNumber: number;
    labelId: number;
    labelName: string;
}

export default class QuestionType extends PureComponent<QuestionTypeProps, QuestionTypeState> {
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    // @ts-ignore
    refPieChart = (node) => this.pieChart = node

    chartRender = (arrData: statisticItem[], total: any) => {
        const allQuestion = total
        if (allQuestion === 0) {
            return;
        }
        const option = {
            grid: { x: 0, y: 5, x2: 0, y2: 0 },
            backgroundColor: '#ffffff',
            color: ['#27C5FF', '#FFC502', '#FF8F5D', '#6E79FF', '#32CCB5', '#3E9FFF'],
            graphic: [{
                type: 'text',
                left: 'center',
                top: '38%',
                style: {
                    text: allQuestion,
                    textAlign: 'center',
                    fill: '#414F70',
                    fontSize: 24
                }
            }, {
                type: 'text',
                left: 'center',
                top: '52%',
                style: {
                    text: '问题总数',
                    textAlign: 'center',
                    fill: '#7A8499',
                    fontSize: 14
                }
            }],
            series: [{
                type: 'pie',
                radius: ['49%', '70%'],
                startAngle: 180,
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
                data: arrData.slice(0, 14).map(item => ({ value: item.incidentNumber, name: formatSplitString(item.labelName, 4) }))
            }],
        }
        // @ts-ignore
        this.pieChart.refresh(option);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.data != this.props.data) {
            setTimeout(() => {
                this.chartRender(get(nextProps, 'data.statisticItems', []) || [], get(nextProps, 'data.total', 0) || 0)
            }, 300)
        }
    }

    render() {
        const { data = {} } = this.props
        const { statisticItems = [], labelRank = [] } = data
        const allQuestion = get(data, 'total', 0) || 0
        return (
            <View className='question-type'>
                <Text className='title'>问题类型统计</Text>
                <View className={cn("pie-chart", { "pie-chart--hide": allQuestion === 0 })}>
                    <AnnularChart ref={this.refPieChart} />
                </View>
                {allQuestion === 0 ? <View className='empty'><EmptyHolder text='暂无数据' /></View> :
                    (
                        <View className='content'>
                            发现问题<Text className='strong'>{allQuestion || '--'}</Text>个，其中发现问题最多的问题类型分别是：
                            <Text className='strong'>{labelRank.map(item => item.labelName).join('、') || '--'}</Text>
                        </View>
                    )}
            </View>
        )
    }
}