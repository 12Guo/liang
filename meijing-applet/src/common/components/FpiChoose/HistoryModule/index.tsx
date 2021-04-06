import Taro, { Component } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { rootSourceBaseUrl } from '../../../utils/requests'
import cloneDeep from 'lodash/cloneDeep'
import cn from 'classnames'

import './index.scss'


//图标引用
const dropImage = `${rootSourceBaseUrl}/assets/common/icon-drop.png`;

interface HistoryModuleProps {
    historyList: any,
    onMore?: (isMore: boolean) => void,
    onCheck?: (item: any) => void,
}

interface HistoryModuleState {
    showMore: boolean,
}

export default class HistoryModule extends Component<HistoryModuleProps, HistoryModuleState> {
    constructor(props) {
        super(props)
        this.state = {
            showMore: false,
        }
    }

    onMoreHandle = () => {
        const { showMore } = this.state
        const { onMore } = this.props
        this.setState({ showMore: !showMore })
        onMore && onMore(!showMore)
    }

    onCheckHandle = (item) => {
        const { onCheck, historyList } = this.props
        const currentItem = historyList.find(dTime => dTime.userId === item.userId)
        currentItem.checked = !item.checked
        onCheck && onCheck(currentItem)
    }

    render() {
        const { showMore } = this.state
        const { historyList=[] } = this.props
        return (
            <View className='history'>
                <View className='history__header'>
                    <Text className='txt'>历史选择记录</Text>
                    <Image className={cn('img', { 'img__up': showMore })} onClick={this.onMoreHandle} src={dropImage} />
                </View>
                <View className='history__body'>
                    {
                        historyList.slice(0, showMore ? historyList.length : 5).map(item => (
                            <View key={item.userId} className={cn('list-item', { 'list-item__active': item.checked })} onClick={this.onCheckHandle.bind(this, item)}>
                                <Text className='txt'>{item.name}</Text>
                            </View>
                        ))
                    }
                </View>
            </View>
        )
    }
}