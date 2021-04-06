import Taro, { PureComponent } from '@tarojs/taro'
import { View, Text, Image, Block } from '@tarojs/components'
import DateSelect from '@common/components/DateSelect/index'
import TodayItem from '@common/components/FbiItems/TodayItem'
import EmptyHolder from '@common/components/EmptyHolder'

import './index.scss'
import isEmpty from 'lodash/isEmpty'

interface SentryWarnProps {
    list: any[];
    data: any;
    onMore: () => void;
    startTime: number;
    endTime: number;
    onChange: (options: any) => void;
}

interface SentryWarnState {

}

export default class SentryWarn extends PureComponent<SentryWarnProps, SentryWarnState> {
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    componentDidMount() {

    }

    onMoreHandle = () => {
        const { onMore } = this.props
        onMore && onMore()
    }

    onConfirm = (startTime, endTime) => {
        const { onChange } = this.props
        onChange && onChange({ startTime, endTime })
    }

    render() {
        const { list = [], data, startTime, endTime } = this.props
        return (
            <View className='sentry-warn'>
                <View className='title-container'>
                    <Text className='title'>视频哨兵预警</Text>
                    <DateSelect
                        startDate={startTime}
                        endDate={endTime}
                        onConfirm={this.onConfirm.bind(this)}
                    ></DateSelect>
                </View>
                {
                    isEmpty(list) ?
                        (
                            <View className='empty'><EmptyHolder text='暂无数据' /></View>
                        ) :
                        (
                            <Block>
                                <View className='header'>
                                    <View className='header-item'>
                                        <Text className='num'>{data.reportNumFromSentry || 0}</Text>
                                        <Text className='txt'>异常预警</Text>
                                    </View>
                                    <View className='header-item'>
                                        <Text className='num num--orange'>{(data.reportNumFromSentry || 0) - (data.disposalNumFromSentry || 0)}</Text>
                                        <Text className='txt'>未处置数</Text>
                                    </View>
                                    <View className='header-item'>
                                        <Text className='num num--green'>{data.disposalNumFromSentry || 0}</Text>
                                        <Text className='txt'>已处置数</Text>
                                    </View>
                                </View>
                                <View className='body-list'>
                                    {
                                        list.map((item, index) => <TodayItem key={index + item.id} data={item} />)
                                    }
                                </View>
                                <Text className='more' onClick={this.onMoreHandle}>更多 ></Text>
                            </Block>
                        )
                }

            </View>
        )
    }
}