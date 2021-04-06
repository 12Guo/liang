import Taro, { Component } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import moment from 'moment'
import cn from 'classnames'
import './index.scss'
import get from 'lodash/get'

export interface SprayItem {
    id: string | number,
    title: string,
    time: string,
    img_url: string
}

interface SprayItemProps {
    data: SprayItem,
    isLast: boolean,
}

interface SprayItemState {

}

const EnumReason = {
    APP: 'app',
    ALARM: '报警',
    AUTO: '自动'
}

export default class AlarmItem extends Component<SprayItemProps, SprayItemState> {
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    render() {
        const { data = {}, isLast = false } = this.props;
        const openTime = moment(data.openTime)
        const closeTime = moment(data.closeTime)
        const isNull = !(data.closeTime)
        return (
            <View className={cn('ys-list', { 'ys-list__last': isLast })}>
                <View className='des-mes'>
                    <View className='list-dot'>
                        <View className='dot'></View>
                    </View>
                    <View className='list-item'>
                        <Text className='time'>{moment(data.createTime).format('YYYY-MM-DD HH:mm:ss')}</Text>
                        <View className='content'>
                            <View className='txt'>时间：{openTime.format('MM-DD HH:mm')} ~ {isNull ? '--' : closeTime.format('MM-DD HH:mm')}</View>
                            <View className='txt'>时长：{isNull ? '--' : closeTime.diff(openTime, 'minute') || 1}min</View>
                            <View className='txt'>开启原因：{data.openReason ? EnumReason[data.openReason] : '--'}</View>
                        </View>
                    </View>
                </View>
            </View>
        )
    }
}