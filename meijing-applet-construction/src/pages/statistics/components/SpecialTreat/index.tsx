import Taro, { PureComponent } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { rootConstructionSourceBaseUrl } from '@common/utils/requests'
import get from 'lodash/get'

import './index.scss'

const shipinshaobin = `${rootConstructionSourceBaseUrl}/assets/pages/statistics/shipinshaobin.png`
const xuncharenyuan = `${rootConstructionSourceBaseUrl}/assets/pages/statistics/xuncharenyuan.png`

interface SpecialTreatProps {
    data: any;
    onSentry?: () => void;
    onSupervise?: () => void;
    deviceData: number | string;
}

interface SpecialTreatState {

}

export default class SpecialTreat extends PureComponent<SpecialTreatProps, SpecialTreatState> {
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

    render() {
        const { data, deviceData = '--' } = this.props
        let patrolFinishRate = '0%'
        if (get(data, 'patrolFinishRate', 0) > 0) {
            patrolFinishRate = (100 * parseFloat(get(data, 'patrolFinishRate', '0.0'))).toFixed(1) + '%'
        }
        return (
            <View className='special-treat'>
                <Text className='title'>治理措施统计</Text>
                <View className='list-item' onClick={this.onSentryHandle}>
                    <View className='item-1'>
                        <Image className='img' src={shipinshaobin} />
                        <Text className='txt'>视频哨兵</Text>
                    </View>
                    <View className='item-2'>
                        <Text className='num'>{deviceData}</Text>
                        <Text className='txt'>设备数</Text>
                    </View>
                    <View className='item-3'>
                        <Text className='num'>--</Text>
                        <Text className='txt'>平均在线时长</Text>
                    </View>
                    <View className='item-4'>
                        <Text className='num'>{get(data, 'sentryInspectNum', '--')}</Text>
                        <Text className='txt'>发现问题</Text>
                    </View>
                </View>

                <View className='list-item' onClick={this.onSuperviseHandle}>
                    <View className='item-1'>
                        <Image className='img' src={xuncharenyuan} />
                        <Text className='txt'>巡查人员</Text>
                    </View>
                    <View className='item-2'>
                        <Text className='num'>{get(data, 'inspectorNum', '--')}</Text>
                        <Text className='txt'>人员数</Text>
                    </View>
                    <View className='item-3'>
                        <Text className='num'>{patrolFinishRate}</Text>
                        <Text className='txt'>巡查完成率</Text>
                    </View>
                    <View className='item-4'>
                        <Text className='num'>{get(data, 'incidentNum', '--')}</Text>
                        <Text className='txt'>发现问题</Text>
                    </View>
                </View>
            </View>
        )
    }
}