import Taro, { PureComponent } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import AnnularChart from '@common/components/FpiChart/AnnularChart'
import { rootConstructionSourceBaseUrl } from '@common/utils/requests'
import get from 'lodash/get'

import './index.scss'

interface SentryAccessProps {
    monitorData: any;
    constructionData: any;
}

interface SentryAccessState {

}

export default class SentryAccess extends PureComponent<SentryAccessProps, SentryAccessState> {
    constructor(props) {
        super(props)
        this.state = {

        }
    }
    // @ts-ignore
    refPieChart = (node) => this.pieChart = node
    // @ts-ignore
    refMonitorChart = (node) => this.monitorChart = node

    componentDidMount() {
        setTimeout(this.chartRender, 500)
        setTimeout(this.chartMonitorRender, 500)
    }

    chartRender = () => {
        const { constructionData = {} } = this.props
        const allDevice = constructionData.total || 0
        const onLineDevice = constructionData.hasSiteCount || 0
        const option = {
            grid: { x: 0, y: 5, x2: 0, y2: 0 },
            backgroundColor: '#ffffff',
            color: ['#F55E00', '#F5F6F7'],
            graphic: [{
                type: 'text',
                left: 'center',
                top: '38%',
                style: {
                    text: ((constructionData.accessRate || 0) * 100).toFixed(1) + '%',
                    textAlign: 'center',
                    fill: '#F66800',
                    fontSize: 18
                }
            }, {
                type: 'text',
                left: 'center',
                top: '52%',
                style: {
                    text: '接入率',
                    textAlign: 'center',
                    fill: '#7A8499',
                    fontSize: 12
                }
            }],
            series: [{
                type: 'pie',
                radius: ['49%', '70%'],
                itemStyle: {
                    normal: {
                        label: {
                            show: false
                        }
                    },
                },
                data: [
                    { value: onLineDevice, name: '在线' },
                    { value: onLineDevice ? (allDevice - onLineDevice) : 100, name: '不在线' }
                ]
            }],
        }
        // @ts-ignore
        this.pieChart.refresh(option);
    }

    chartMonitorRender = () => {
        const { monitorData = {} } = this.props
        const allDevice = monitorData.total || 0
        const onLineDevice = monitorData.onlineCount || 0
        const option = {
            grid: { x: 0, y: 5, x2: 0, y2: 0 },
            backgroundColor: '#ffffff',
            color: ['#1CBC07', '#F5F6F7'],
            graphic: [{
                type: 'text',
                left: 'center',
                top: '38%',
                style: {
                    text: ((monitorData.onlineRate || 0) * 100).toFixed(1) + '%',
                    textAlign: 'center',
                    fill: '#1CBC07',
                    fontSize: 18
                }
            }, {
                type: 'text',
                left: 'center',
                top: '52%',
                style: {
                    text: '在线率',
                    textAlign: 'center',
                    fill: '#7A8499',
                    fontSize: 12
                }
            }],
            series: [{
                type: 'pie',
                radius: ['49%', '70%'],
                itemStyle: {
                    normal: {
                        label: {
                            show: false
                        }
                    },
                },
                data: [
                    { value: onLineDevice, name: '在线' },
                    { value: onLineDevice ? (allDevice - onLineDevice) : 100, name: '不在线' }
                ]
            }],
        }
        // @ts-ignore
        this.monitorChart.refresh(option);
    }

    render() {
        const { monitorData = {}, constructionData = {} } = this.props
        console.log(monitorData,1,monitorData.accessRate,constructionData)
        return (
            <View className='sentry-access'>
                <Text className='title'>在线监测接入</Text>
                <View className='body'>
                    <View className='body-item'>
                        <View className="pie-chart">
                            <AnnularChart ref={this.refPieChart} />
                        </View>
                        <View className='pie-nums'>
                            <View className='num-item'>
                                <Text className='txt'>工地总数</Text>
                                <Text className='num'>{get(constructionData, 'total') || 0}</Text>
                            </View>
                            <View className='num-item'>
                                <Text className='txt'>接入监测</Text>
                                <Text className='num num--orange'>{get(constructionData, 'hasSiteCount') || 0}</Text>
                            </View>
                        </View>
                    </View>
                    <View className='body-item'>
                        <View className="pie-chart">
                            <AnnularChart ref={this.refMonitorChart} />
                        </View>
                        <View className='pie-nums'>
                            <View className='num-item'>
                                <Text className='txt'>监测在线</Text>
                                <Text className='num num--green'>{get(monitorData, 'onlineCount') || 0}</Text>
                            </View>
                            <View className='num-item'>
                                <Text className='txt'>监测断线</Text>
                                <Text className='num'>{get(monitorData, 'offlineCount') || 0}</Text>
                            </View>
                        </View>
                    </View>
                </View>
                <View className='footer'>
                    工地总数 <Text className='strong'>{get(constructionData, 'total') || 0}</Text>  个，接入监测的工地 <Text className='strong'>{get(constructionData, 'hasSiteCount') || 0}</Text>  个；接入的监测设备总数 <Text className='strong'>{get(monitorData, 'total') || 0}</Text> 个，监测设备平均在线率 <Text className='strong'>{((monitorData.onlineRate || 0) * 100).toFixed(1) + '%'}</Text>
                </View>
            </View>
        )
    }
}