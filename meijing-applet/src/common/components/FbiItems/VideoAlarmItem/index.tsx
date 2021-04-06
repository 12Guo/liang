import Taro, { Component } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { SimpleRichView } from '@common/components/rich-text'
import cn from 'classnames'
import moment from 'moment'
import './index.scss'

interface VideoAlarmItemProps {
    data: any;
    isLast: boolean;
}

interface VideoAlarmItemState {

}


export default class VideoAlarmItem extends Component<VideoAlarmItemProps, VideoAlarmItemState> {
    constructor(props) {
        super(props)
        this.state = {
            
        }
    }

    showBigImage(urls: string[]) {
        Taro.previewImage({
            urls: urls
        })
    }

    // 跳转到事件详情
    handleClick = (item: any) => {
        Taro.navigateTo({
            url: `/pages/works/detail?inspectId=${item.inspectId}`
        })
    }

    render() {
        const { data = {}, isLast } = this.props
        return (
            <View className={cn('list-item', { 'list-item--last': isLast })} onClick={() => {this.handleClick(data)}}>
                <View className={cn('icon_out', { 'icon_out--undisposed': !data.status })}>
                    <View className='icon_in'></View>
                </View>
                <View className='data-content'>
                    <Text className='time'>{moment(data.createTime).format('YYYY/MM/DD HH:mm')}</Text>
                    {/* <Text className='txt'>{data.content || ''}</Text> */}
                    <SimpleRichView class-name='' content={data.content} />
                    <View className='images'>
                        {
                            (data.pictureLinks || []).map((item, index) => <Image key={index} className='img' src={item} />)
                        }
                    </View>
                </View>
            </View>
        )
    }
}