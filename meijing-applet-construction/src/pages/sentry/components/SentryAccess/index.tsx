import Taro, { PureComponent } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import AnnularChart from '@common/components/FpiChart/AnnularChart'
import { rootConstructionSourceBaseUrl } from '@common/utils/requests'
import get from 'lodash/get'

import './index.scss'

interface SentryAccessProps {
    data: any;
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

    componentDidMount() {
        // setTimeout(this.chartRender, 2000)
    }

    componentDidUpdate() {
        this.chartRender()
    }

    chartRender = () => {
        const { data = {} } = this.props
        const allDevice = data.constructionSiteCount || 0
        const onLineDevice = data.constructionSiteVideoCount || 0
        const option = {
            grid: { x: 0, y: 5, x2: 0, y2: 0 },
            backgroundColor: '#ffffff',
            color: ['#26BCFF', '#F5F6F7'],
            graphic: [{
                type: 'text',
                left: 'center',
                top: '38%',
                style: {
                    text: ((data.accessRate || 0.00) * 100).toFixed() + '%',
                    textAlign: 'center',
                    fill: '#0D86FF',
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
                    { value: onLineDevice, name: '视频在线' },
                    { value: onLineDevice ? (allDevice - onLineDevice) : 100, name: '视频不在线' }
                ]
            }],
        }
        // @ts-ignore
        this.pieChart.refresh(option);
    }

    render() {
        const { data = {} } = this.props
        const videoCount = data.videoCount || 0
        const videoOnLineCount = data.videoOnLineCount || 0
        const sentryVideoCount = data.sentryVideoCount || 0
        return (
            <View className='sentry-access'>
                <Text className='title'>视频哨兵接入</Text>
                <View className='body'>
                    <View className='body-item'>
                        <View className="pie-chart">
                            <AnnularChart ref={this.refPieChart} />
                        </View>
                        <View className='pie-nums'>
                            <View className='num-item'>
                                <Text className='txt'>工地总数</Text>
                                <Text className='num'>{get(data, 'constructionSiteCount') || 0}</Text>
                            </View>
                            <View className='num-item'>
                                <Text className='txt'>接入视频工地</Text>
                                <Text className='num num--blue'>{get(data, 'constructionSiteVideoCount') || 0}</Text>
                            </View>
                        </View>
                    </View>
                    <View className='body-item body-item--right'>
                        <View className='colum-item'>
                            <View className='inner inner-1' style={{ height: videoCount ? '100%' : '0%' }}></View>
                        </View>
                        <View className='colum-item'>
                            <View className='inner inner-2' style={{ height: videoCount ? (100 * (videoOnLineCount / videoCount) + '%') : '0%' }}></View>
                        </View>
                        <View className='colum-item'>
                            <View className='inner inner-3' style={{ height: videoCount ? (100 * (sentryVideoCount / videoCount) + '%') : '0%' }}></View>
                        </View>
                        <View className='colum-nums'>
                            <View className='colum-nums-item'>
                                <Text className='txt'>视频总数</Text>
                                <Text className='num'>{videoCount}</Text>
                            </View>
                            <View className='colum-nums-item'>
                                <Text className='txt'>视频在线</Text>
                                <Text className='num num--green'>{videoOnLineCount}</Text>
                            </View>
                            <View className='colum-nums-item'>
                                <Text className='txt'>接入哨兵</Text>
                                <Text className='num num--orange'>{sentryVideoCount}</Text>
                            </View>
                        </View>
                    </View>
                </View>
                <View className='footer'>
                    工地总数 <Text className='strong'>{get(data, 'constructionSiteCount') || 0}</Text> 个，接入视频工地 <Text className='strong'>{get(data, 'constructionSiteVideoCount') || 0}</Text> 个；接入的视频总数 <Text className='strong'>{videoCount}</Text> 个，视频接入哨兵数 <Text className='strong'>{get(data, 'sentryVideoCount') || 0}</Text> 个。
                </View>
            </View>
        )
    }
}