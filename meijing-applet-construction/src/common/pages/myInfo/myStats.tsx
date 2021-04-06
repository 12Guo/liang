import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import DateSelect from '@common/components/DateSelect/index'
import { myInspectList } from '../../service/inspect'
import moment from 'moment';

import './myList.scss'
import get from 'lodash/get';

interface WorksProps {
    userStore: any;
}

interface WorksState {
    queryParams: {
        startTime: number | string;
        endTime: number | string;
        type: string;
    },
    data: any;
}

@inject('userStore')
@observer
export default class Index extends Component<WorksProps, WorksState> {

    config: Config = {
        navigationBarTitleText: '统计导出',
        navigationBarBackgroundColor: '#FFFFFF',
        navigationBarTextStyle: 'black',
        backgroundColor: '#FFFFFF',
        backgroundTextStyle: 'dark',
    }

    constructor(props) {
        super(props)
        const { startTime = moment().startOf('day').valueOf(), endTime = moment().endOf('day').valueOf() } = this.$router.params

        this.state = {
            queryParams: {
                startTime,
                endTime,
                type: 'statistics/my'
            },
            data: []
        }
    }

    componentDidMount() {
        this.fetchList()
    }

    fetchList = () => {
        const { queryParams } = this.state;
        myInspectList(queryParams).then(res => {
            this.setState({
                data: get(res, 'data', [])
            })
        }).catch(res => {
            console.log(res)
        });
    }

    onConfirm = (startTime, endTime) => {
        const { queryParams } = this.state
        this.setState({
            queryParams: {
                ...queryParams,
                startTime,
                endTime
            }
        }, this.fetchList)
    }

    onItemTap = (key: string, title: string) => {
        const { queryParams: { startTime, endTime } } = this.state
        Taro.navigateTo({
            url: `/common/pages/myInfo/myList?tabKey=${key}&tabName=${title}&startTime=${startTime}&endTime=${endTime}`
        })
    }

    render() {
        const { queryParams: { startTime, endTime }, data = [] } = this.state;
        return (
            <View className='my-list'>
                <View className='my-list-top'>
                    <DateSelect
                        startDate={startTime}
                        endDate={endTime}
                        onConfirm={this.onConfirm.bind(this)}
                    ></DateSelect>
                </View>
                <View className='stats-list'>
                    <View className='list-item' onClick={this.onItemTap.bind(this, 'PATROL', '我的巡查')}>
                        <Text className='label'>巡查数</Text>
                        <Text className='num'>{get(data, '[2].number') || 0}</Text>
                        <View className='img'></View>
                    </View>
                    <View className='list-item' onClick={this.onItemTap.bind(this, 'INCIDENT', '我的上报')}>
                        <Text className='label'>上报事件数</Text>
                        <Text className='num'>{get(data, '[0].number') || 0}</Text>
                        <View className='img'></View>
                    </View>
                    <View className='list-item' onClick={this.onItemTap.bind(this, 'INCIDENT_FINISHED', '我的处置')}>
                        <Text className='label'>处置事件数</Text>
                        <Text className='num'>{get(data, '[1].number') || 0}</Text>
                        <View className='img'></View>
                    </View>
                </View>
            </View>
        )
    }
}
