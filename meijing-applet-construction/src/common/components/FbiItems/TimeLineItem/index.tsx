import Taro, { Component } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import moment from 'moment'
import './index.scss'

export interface TimeLineDataItem {
    id: string | number,
    title: string,
    time: string,
    img_url: string
}

interface TimeLineItemProps {
    data: TimeLineDataItem,
    onClick: (item:any)=>void
}

interface TimeLineItemState {

}

export default class TimeLineItem extends Component<TimeLineItemProps, TimeLineItemState> {
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    render() {
        const { data={}, onClick } = this.props;
        return (
            <View className='ys-list'>
                <View className='des-time'>
                    <Text className='time'>{moment(data.time || 0).format('MM/DD HH:mm')}</Text>
                </View>
                <View className='des-mes'>
                    <View className='list-dot'>
                        <View className='dot'></View>
                    </View>
                    <View className='list-item'>
                        <Text className='title'>{data.title}</Text>
                        <Image className='img' mode="aspectFill" src={data.img_url} onClick={onClick} />
                    </View>
                </View>
            </View>
        )
    }
}