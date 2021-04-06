import Taro, { PureComponent } from '@tarojs/taro'
import { View, Text, Block } from '@tarojs/components'
import TodayItem from '@common/components/FbiItems/TodayItem'
import EmptyHolder from '@common/components/EmptyHolder'

import './index.scss'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'


interface TodayLiveProps {
    data: any;
    onMore: () => void;
}

interface TodayLiveState {

}

export default class TodayLive extends PureComponent<TodayLiveProps, TodayLiveState> {
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    onMoreHandle = () => {
        const { onMore } = this.props
        onMore && onMore()
    }

    render() {
        const { data } = this.props
        const list = get(data, 'entries', []) || []
        return (
            <View className='today-live'>
                <Text className='title'>今日工地实况</Text>
                {isEmpty(list) ?
                    (
                        <View className='white'>
                            <EmptyHolder text='暂无实时预警' />
                        </View>
                    ) :
                    (
                        <Block>
                            <View className='today-list'>
                                {
                                    list.map((item, index) => <TodayItem key={index + item.id} data={item} />)
                                }
                            </View>
                            <Text className='more' onClick={this.onMoreHandle}>更多 ></Text>
                        </Block>
                    )}
            </View>
        )
    }
}