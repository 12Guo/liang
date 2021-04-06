import Taro, { Component, Config } from '@tarojs/taro'
import { View, ScrollView, Text } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import { getLocation } from '../../service/userDivision'
import DateSelect from '@common/components/DateSelect/index'
import cn from 'classnames'
import './filter.scss'
import isEmpty from 'lodash/isEmpty';
import moment from 'moment';

interface FilterProps {
    userStore: any;
}

interface FilterState {
    configList: any[],
    configChecked: any,
    startTime: number,
    endTime: number,
}

@inject('userStore')
@observer
export default class Filter extends Component<FilterProps, FilterState> {

    config: Config = {
        navigationBarTitleText: '筛选'
    }

    constructor(props) {
        super(props)
        const { startTime, endTime } = this.$router.params
        const workSearchFilter = Taro.getStorageSync('anomaly-search-filter')
        this.state = {
            configList: [
                { label: '未处置', value: 'UNDO' },
                { label: '已处置', value: 'DONE' }
            ],
            configChecked: workSearchFilter || {},
            startTime: parseInt(startTime),
            endTime: parseInt(endTime)
        }
    }

    // 选择
    onCheck = (name: string) => {
        this.setState({
            configChecked: {
                ...this.state.configChecked,
                status: name
            }
        })
    }

    componentWillMount() {

    }

    saveBack = () => {
        const { configChecked, startTime, endTime } = this.state
        Taro.setStorageSync('anomaly-search-filter', { ...configChecked, startTime, endTime })
        Taro.navigateBack()
    }

    onReset = () => {
        Taro.setStorageSync('anomaly-search-filter', {})
        const { startTime, endTime } = this.$router.params
        this.setState({
            configChecked: { status: "" },
            startTime: parseInt(startTime),
            endTime: parseInt(endTime)
        })
    }

    onConfirm = (startTime, endTime) => {
        this.setState({
            startTime,
            endTime
        })
    }

    render() {
        const { configList, configChecked, startTime, endTime } = this.state;
        return (
            <View className='filter'>
                <ScrollView
                    className='filter__body'
                    scrollY
                >
                    <View className='container'>
                        <View className='module-item module-item--line'>
                            <Text className='title'>时间周期选择</Text>
                            <DateSelect
                                startDate={startTime}
                                endDate={endTime}
                                onConfirm={this.onConfirm.bind(this)}
                            ></DateSelect>
                        </View>
                        <View className='module-item'>
                            <Text className='title'>事件状态</Text>
                            <View className='list'>
                                {
                                    configList.map(item => (
                                        <Text key={item.value}
                                            className={cn('list-item', { active: configChecked.status && configChecked.status.includes(item.value) })}
                                            onClick={this.onCheck.bind(this, item.value)}>{item.label}</Text>
                                    ))
                                }
                            </View>
                        </View>
                    </View>
                </ScrollView>
                <View className='filter__footer'>
                    <Text className='btn' onClick={this.onReset}>重置</Text>
                    <Text className='btn confirm' onClick={this.saveBack}>确认</Text>
                </View>
            </View>
        )
    }
}