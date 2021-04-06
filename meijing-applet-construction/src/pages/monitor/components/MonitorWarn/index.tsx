import Taro, { PureComponent } from '@tarojs/taro'
import { View, Text, Image, Block } from '@tarojs/components'
import DateSelect from '@common/components/DateSelect/index'
import YjItem from '@common/components/FbiItems/YjItem'
import EmptyHolder from '@common/components/EmptyHolder'

import './index.scss'
import isEmpty from 'lodash/isEmpty'
import get from 'lodash/get'

interface MonitorWarnProps {
    list: any[];
    data: any;
    onMore: () => void;
    startTime: number;
    endTime: number;
    onChange: (options: any) => void;
}

interface MonitorWarnState {

}

export default class MonitorWarn extends PureComponent<MonitorWarnProps, MonitorWarnState> {
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
        console.log(data, 2, list)
        return (
            <View className='monitor-warn'>
                <View className='title-container'>
                    <Text className='title'>在线监测预警</Text>
                    <DateSelect
                        startDate={startTime}
                        endDate={endTime}
                        onConfirm={this.onConfirm.bind(this)}
                    ></DateSelect>
                </View>
                <View className='body'>
                    <View className='list-item'>
                        <Text className='num'>{get(data, 'total', 0)}</Text>
                        <Text className='label'>异常预警</Text>
                    </View>
                    <View className='list-item list-item__pm10'>
                        <Text className='num num__orange'>{get(data, 'untreatedCount', 0)}</Text>
                        <Text className='label'>未处置数</Text>
                    </View>
                    <View className='list-item list-item__tsp'>
                        <Text className='num num__green'>{get(data, 'disposedCount', 0)}</Text>
                        <Text className='label'>已处置数</Text>
                    </View>
                </View>
                <View className='body-list'>
                    {
                        //@ts-ignore
                        list.map((item, index) => <YjItem key={item.pollutionSourceId} data={item} />)
                    }
                    {isEmpty(list) && <View className='empty'><EmptyHolder text='暂无数据' /></View>}
                </View>
                {!isEmpty(list) && <Text className='more' onClick={this.onMoreHandle}>更多 ></Text>}
            </View>
        )
    }
}