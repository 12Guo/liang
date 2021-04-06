import Taro, { Component } from '@tarojs/taro'
import { View, Text, Image, Block } from '@tarojs/components'
import { rootConstructionSourceBaseUrl } from '../../../utils/requests'
import './index.scss'
import get from 'lodash/get'

const online = `${rootConstructionSourceBaseUrl}/assets/pages/monitor/online.png`
const offline = `${rootConstructionSourceBaseUrl}/assets/pages/monitor/offline.png`

interface MonitorItemProps {
    data: any
}

interface MonitorItemState {

}

export default class MonitorItem extends Component<MonitorItemProps, MonitorItemState> {
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    onDeviceClick = () => {
        const { data = {} } = this.props
        Taro.navigateTo({
            url: `/pages/device/detail?data=${JSON.stringify(data)}`
        })
    }

    render() {
        const { data = {} } = this.props
        return (
            <View className='monitor-item' onClick={this.onDeviceClick}>
                <View className='left'>
                    <Text className='txt'>{get(data, 'pollutionSourceName')}</Text>
                </View>
                <View className='right'>
                    {get(data, 'siteInfos', []).map(item => (
                        <Image className='img' src={item.online ? online : offline} />
                    ))}
                </View>
            </View>
        )
    }
}