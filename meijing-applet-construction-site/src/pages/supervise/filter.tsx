import Taro, { Component, Config } from '@tarojs/taro'
import { View, ScrollView, Text } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import { departmentList } from '../../service/department'
import { list } from '../../service/pollutionType'
import { getChildren } from '../../service/division'
import { getLocation } from '../../service/userDivision'
import DateSelect from '@common/components/DateSelect/index'
import cn from 'classnames'
import './filter.scss'
import isEmpty from 'lodash/isEmpty';

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
        const workSearchFilter = Taro.getStorageSync('supervise-search-filter')
        this.state = {
            configList: [
                {
                    name: 'isSupervise', title: '事件类型', items: [
                        { label: '全部类型', value: 'all' },
                        { label: '巡查事件', value: 'false' },
                        { label: '督察事件', value: 'true' },
                    ]
                },
            ],
            configChecked: workSearchFilter || {},
            startTime: parseInt(startTime),
            endTime: parseInt(endTime)
        }
    }


    // 选择
    onCheck = (name: string, item: any) => {
        this.setState({
            configChecked: {
                [name]: item.value
            }
        })
    }

    componentWillMount() {

    }

    saveBack = () => {
        const { configChecked, startTime, endTime } = this.state
        Taro.setStorageSync('supervise-search-filter', { ...configChecked, startTime, endTime })
        Taro.navigateBack()
    }

    onOk = async () => {
        const { configChecked } = this.state

        this.setState({
            configChecked
        }, this.saveBack)
    }

    onReset = () => {
        Taro.setStorageSync('supervise-search-filter', {})
        const { startTime, endTime } = this.$router.params
        this.setState({
            configChecked: { isSupervise: '', status: '', departmentIds: '' },
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
                        {
                            configList.map(config => (
                                <View key={config.name} className='module-item'>
                                    <Text className='title'>{config.title}</Text>
                                    <View className='list'>
                                        {
                                            config.items.map(item => (
                                                <Text key={item.value}
                                                    className={cn('list-item', { active: configChecked[config.name] && configChecked[config.name].split(',').includes(item.value) })}
                                                    onClick={this.onCheck.bind(this, config.name, item)}>{item.label}</Text>
                                            ))
                                        }
                                    </View>
                                </View>
                            ))
                        }
                    </View>
                </ScrollView>
                <View className='filter__footer'>
                    <Text className='btn' onClick={this.onReset}>重置</Text>
                    <Text className='btn confirm' onClick={this.onOk}>确认</Text>
                </View>
            </View>
        )
    }
}