import Taro, { PureComponent } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import get from 'lodash/get'
import { rootConstructionSourceBaseUrl } from '@common/utils/requests'

import './index.scss'
import isEmpty from 'lodash/isEmpty'

const IconCamera = `${rootConstructionSourceBaseUrl}/assets/pages/index/icon-camera.png`
const IconPerson = `${rootConstructionSourceBaseUrl}/assets/pages/index/icon-person.png`
const IconPenglin = `${rootConstructionSourceBaseUrl}/assets/pages/index/icon-penglin.png`
const IconJiance = `${rootConstructionSourceBaseUrl}/assets/pages/index/icon-jiance.png`
const IconRight = `${rootConstructionSourceBaseUrl}/assets/pages/index/icon-right.png`

export interface HeaderCardType {

}

interface HeaderCardProps {
    data: any;
    monitorData: any;
    onSentry: () => void;
    onSupervise: () => void;
    onMonitor: () => void;
    onSpray: () => void;
    deviceData: number | string;
}

interface HeaderCardState {

}

export default class HeaderCard extends PureComponent<HeaderCardProps, HeaderCardState> {
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    onSentryHandle = () => {
        const { onSentry } = this.props
        onSentry && onSentry()
    }

    onSuperviseHandle = () => {
        const { onSupervise } = this.props
        onSupervise && onSupervise()
    }

    onMonitorHandle = () => {
        const { onMonitor } = this.props
        onMonitor && onMonitor()
    }

    onSprayHandle = () => {
        const { onSpray } = this.props
        onSpray && onSpray()
    }

    render() {
        const { data = {}, deviceData = '--', monitorData } = this.props
        let disposalPencent = '0%'
        let warnPercent = '0%'
        if ((get(data, 'sentryReprot.reportNumFromSentry', 0) || 0) > 0) {
            disposalPencent = (100 * ((data.sentryReprot.disposalNumFromSentry || 0) / data.sentryReprot.reportNumFromSentry)).toFixed(2) + '%'
        }
        if ((get(monitorData, 'deviceData.total', 0) || 0) > 0) {
            warnPercent = (100 * ((monitorData.deviceData.disposedCount || 0) / monitorData.deviceData.total)).toFixed(2) + '%'
        }
        return (
            <View className='header-card'>
                <View className='list-item' onClick={this.onSentryHandle}>
                    <View className='list-item_top'>
                        <Image className='left' src={IconCamera} />
                        <Text className='txt'>视频哨兵</Text>
                        <Image className='right' src={IconRight} />
                    </View>
                    <View className='list-item_center'>
                        <View className='item'>
                            <Text className='item_value'>{deviceData}</Text>
                            <Text className='item_txt'>设备数</Text>
                        </View>
                        <View className='item'>
                            <Text className='item_value'>{get(data, 'sentryReprot.reportNumFromSentry', '--') || '--'}</Text>
                            <Text className='item_txt'>预警次数</Text>
                        </View>
                    </View>
                    <View className='list-item_bottom'>
                        <View className='line'>
                            <View className='line_inner' style={{ width: disposalPencent }}></View>
                        </View>
                        <View className='line_value'>
                            <Text className='label'>预警处置数</Text>
                            <Text className='value'>{get(data, 'sentryReprot.disposalNumFromSentry', 0) || 0}</Text>
                        </View>
                    </View>
                </View>

                <View className='list-item list-item--jiance' onClick={this.onMonitorHandle}>
                    <View className='list-item_top'>
                        <Image className='left left' src={IconJiance} />
                        <Text className='txt'>在线监测</Text>
                        <Image className='right' src={IconRight} />
                    </View>
                    <View className='list-item_center'>
                        <View className='item'>
                            <Text className='item_value'>{get(monitorData, 'total', 0) || 0}</Text>
                            <Text className='item_txt'>设备数</Text>
                        </View>
                        <View className='item'>
                            <Text className='item_value'>{get(monitorData, 'deviceData.total', 0)}</Text>
                            <Text className='item_txt'>预警次数</Text>
                        </View>
                    </View>
                    <View className='list-item_bottom'>
                        <View className='line line--right'>
                            <View className='line_inner' style={{ width: warnPercent }}></View>
                        </View>
                        <View className='line_value'>
                            <Text className='label'>预警处置数</Text>
                            <Text className='value'>{get(monitorData, 'deviceData.disposedCount', 0)}</Text>
                        </View>
                    </View>
                </View>

                <View className='list-item list-item--jianguan' onClick={this.onSuperviseHandle}>
                    <View className='list-item_top'>
                        <Image className='left left' src={IconPerson} />
                        <Text className='txt'>人员监管</Text>
                        <Image className='right' src={IconRight} />
                    </View>
                    <View className='list-item_center'>
                        <View className='item'>
                            <Text className='item_value'>{get(data, 'allUserReport.patrolNum', 0) || 0}</Text>
                            <Text className='item_txt'>巡查上报</Text>
                        </View>
                        <View className='item'>
                            <Text className='item_value'>{get(data, 'allUserReport.shouldDisposalNum', 0) || 0}</Text>
                            <Text className='item_txt'>事件上报</Text>
                        </View>
                    </View>
                </View>

                <View className='list-item list-item--penglin' onClick={this.onSprayHandle}>
                    <View className='list-item_top'>
                        <Image className='left left' src={IconPenglin} />
                        <Text className='txt'>智慧喷淋</Text>
                        <Image className='right' src={IconRight} />
                    </View>
                    <View className='list-item_center'>
                        <View className='item'>
                            <Text className='item_value'>0</Text>
                            <Text className='item_txt'>设备数</Text>
                        </View>
                        <View className='item'>
                            <Text className='item_value'>0</Text>
                            <Text className='item_txt'>喷淋次数</Text>
                        </View>
                    </View>
                </View>
            </View>
        )
    }
}