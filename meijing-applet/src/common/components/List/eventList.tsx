import Taro, { Component } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { rootConstructionSourceBaseUrl } from '../../utils/requests'
import moment from 'moment'
import './eventList.scss'
import isEmpty from 'lodash/isEmpty'


const IconCamera = `${rootConstructionSourceBaseUrl}/assets/pages/index/icon-camera.png`
const urgent = `${rootConstructionSourceBaseUrl}/assets/pages/work/urgent.png`

interface TodayItemProps {
    data: Array<InfoType>
}

interface InfoType {
    // 类型小图标
    imgFlag: any;
    title: string;
    // 是否添加紧急的标记
    isUrgent?: boolean;
    content: string;
    // 部门标签名称
    tag: string;
    // 巡查员或者负责人
    name: string;
    img: any;
    time: string
}

interface TodayItemState {

}

export default class EventList extends Component<TodayItemProps, TodayItemState> {
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    render() {
        return (
            this.props.data.map((item, index) => {
                return (<View className='list-item' key={index}>
                    <View className='left'>
                        <Image className='img' src={item.imgFlag} />
                    </View>
                    <View className='center'>
                        <View className='center-top'>
                            <Text className='title'>{item.title}</Text>
                            {
                                item.isUrgent && <Image className="urgent" src={urgent}></Image>
                            }
                        </View>
                        <Text className='center-center'>{item.content}</Text>
                        <View className='center-bottom'>
                            <Text className='tag'>{item.tag}</Text>
                            <Text className='tag'>{item.name}</Text>
                        </View>
                    </View>
                    <View className='right'>
                        <Image className='img' src={item.img} />
                        <Text className='time'>{item.time}</Text>
                    </View>
                </View>)
            })

        )
    }
}