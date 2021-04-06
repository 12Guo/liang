import Taro, { PureComponent } from '@tarojs/taro'
import { View, Text, Image, Block } from '@tarojs/components'
import DateSelect from '@common/components/DateSelect/index'

import './index.scss'
import isEmpty from 'lodash/isEmpty'
import get from 'lodash/get'

interface EarlyWarnProps {
    data: any;
    onMore: () => void;
    startTime: number;
    endTime: number;
    onChange: (options: any) => void;
}

interface EarlyWarnState {

}

export default class EarlyWarn extends PureComponent<EarlyWarnProps, EarlyWarnState> {
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

    getFactorValue = (code) => {
        const { data } = this.props
        const modalData = get(data, 'alarmGroupByFactorDtos', []).find(factor => factor.factor === code)
        return (100 * get(modalData, 'count', 0)).toFixed(1) + '%'
    }

    render() {
        const { data, startTime, endTime } = this.props
        const warnList = get(data, 'alarmGroupByNameDtos', []).map(item => item.name)
        return (
            <View className='early-warn'>
                <View className='title-container'>
                    <Text className='title'>预警类型统计</Text>
                    <DateSelect
                        startDate={startTime}
                        endDate={endTime}
                        onConfirm={this.onConfirm.bind(this)}
                    ></DateSelect>
                </View>
                <View className='body'>
                    <View className='list-item'>
                        <Text className='num'>{this.getFactorValue('a34004')}</Text>
                        <Text className='label'>PM2.5</Text>
                    </View>
                    <View className='list-item list-item__pm10'>
                        <Text className='num'>{this.getFactorValue('a34002')}</Text>
                        <Text className='label'>PM10</Text>
                    </View>
                    <View className='list-item list-item__tsp'>
                        <Text className='num'>{this.getFactorValue('a34001')}</Text>
                        <Text className='label'>TSP</Text>
                    </View>
                    <View className='list-item list-item__zaosheng'>
                        <Text className='num'>{this.getFactorValue('b03')}</Text>
                        <Text className='label'>噪声</Text>
                    </View>
                </View>
                <View className='bottom'>
                    <View className='txt'>
                        {!isEmpty(warnList) &&
                            <Block>
                                预警次数最多的工地分别是：<Text className='txt__blue'>{warnList.join('、')}</Text>
                            </Block>
                        }
                    </View>
                </View>
            </View>
        )
    }
}