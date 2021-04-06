import Taro, { Component } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { rootConstructionSourceBaseUrl } from '../../../utils/requests'
import moment from 'moment'
import './index.scss'


const Icon = `${rootConstructionSourceBaseUrl}/assets/pages/index/icon-wuran.png`

interface SensitiveItemProps {
    data: any
}

interface SensitiveItemState {

}

export default class SensitiveItem extends Component<SensitiveItemProps, SensitiveItemState> {
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    onDetail = () => {
        const { data } = this.props
        Taro.navigateTo({
            url: `/pages/pollution-manage/detail?id=${data.pollutionSourceId}`
        })
    }

    parseDistance(distance: number) {
        return (distance / 1000).toFixed(2) + "km";
    }

    render() {
        const { data = {} } = this.props
        return (
            <View className='list-item' onClick={this.onDetail}>
                <View className='left'>
                    <Image className='img' src={Icon} />
                </View>
                <View className='center'>
                    <Text className='title'>{data.pollutionSourceName}</Text>
                    <Text className='type'>{data.progress || ''}</Text>
                    <Text className='distance'>距离最近站点 {this.parseDistance(data.distance || 0)}</Text>
                </View>
                <View className='right'>
                    <Text className='time'>最新预警 {data.latestTime ? moment(data.latestTime).fromNow() : '--'}</Text>
                </View>
            </View>
        )
    }
}