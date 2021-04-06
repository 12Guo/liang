import Taro, { Component } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import moment from 'moment'
import cn from 'classnames'
import './index.scss'
import get from 'lodash/get'

export interface AlarmDataItem {
    id: string | number,
    title: string,
    time: string,
    img_url: string
}

interface AlarmItemProps {
    data: AlarmDataItem,
    isLast: boolean,
    onClick?: (item: any) => void
}

interface AlarmItemState {

}

export default class AlarmItem extends Component<AlarmItemProps, AlarmItemState> {
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    render() {
        const { data = {}, isLast = false } = this.props;
        return (
            <View className={cn('ys-list', { 'ys-list__last': isLast })}>
                <View className='des-mes'>
                    <View className='list-dot'>
                        <View className='dot'></View>
                    </View>
                    <View className='list-item'>
                        <Text className='time'>{moment(get(data, 'alarmDataTime', Date.now())).format('MM-DD HH:mm')}</Text>
                        <View className='content'>{get(data, 'content')}</View>
                    </View>
                </View>
            </View>
        )
    }
}