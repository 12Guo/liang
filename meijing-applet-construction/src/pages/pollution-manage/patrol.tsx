import Taro, { Component, Config } from '@tarojs/taro';
import { View, Text, Picker } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import isEmpty from 'lodash/isEmpty'
import ListView from '@common/components/ListView'
import EmptyHolder from '@common/components/EmptyHolder'
import PatrolItem from '@common/components/FbiItems/PatrolItem'
import FpiDropDown from '@common/components/FpiDropDown'
import { inspectsByPollutant } from '../../service/pollutionType';
import './patrol.scss'
import moment from 'moment';

const My_Time = [
    { label: '全部', value: 0 },
    { label: '最近三天', value: 1 },
    { label: '最近一周', value: 2 },
    { label: '最近一月', value: 3 }
]

const My_Type = [
    { label: '全部类型', value: 0 },
    { label: '巡查事件', value: 'INCIDENT' },
    { label: '巡查工作', value: 'PATROL' }
]

interface PatrolProps {
    userStore: any;
}

interface PatrolState {
    patrolList: any[]
    paramQuery: {
        pollutionSourceId: number | string,
        startTime?: number,
        endTime?: number,
        inspectType: string,
        offset: number,
        limit: number
    },
    /**
     * 是否初始化加载数据
     */
    isInit: boolean,
    /**
     * 是否存在更多
     */
    hasMore: boolean,
    /**
     * 是否loading中
     */
    isLoading: boolean,
    /**
     * 时间选择类别
     */
    currentType: number,
}

@inject('userStore')
@observer
class PatrolPage extends Component<PatrolProps, PatrolState> {
    config: Config = {
        navigationBarTitleText: '历史巡查记录'
    }

    static externalClasses = ['com-class']

    constructor(props) {
        super(props);
        const { id } = this.$router.params

        this.state = {
            patrolList: [],
            paramQuery: {
                pollutionSourceId: id,
                inspectType: '0',
                offset: 0,
                limit: 20
            },
            isInit: true,
            hasMore: true,
            isLoading: true,
            currentType: 1
        }
    }

    componentDidMount() {
        this.onTime(this.state.currentType)
    }

    // 获取巡查记录列表
    fetchList = (callback?:any) => {
        const { paramQuery, isInit, patrolList } = this.state;
        inspectsByPollutant(paramQuery).then(res=> {
            const { data: { entries = [] } } = res;
            let newPatrolList = entries;
            if (!isInit) {
                newPatrolList = patrolList.concat(newPatrolList);
            }
            this.setState({
                patrolList: newPatrolList,
                isLoading: false,
                isInit: false,
                hasMore: entries.length == paramQuery.limit,
                paramQuery: {
                    ...paramQuery,
                    offset: paramQuery.offset + paramQuery.limit
                }
            },()=>{
                if(callback){
                    callback();
                }
            });
        }).catch(res=> {
            if(callback){
                callback();
            }
         });
    }

    /**
     * 刷新操作
     */
    onRefresh = () => {
        const { paramQuery } = this.state;
        this.setState({
            paramQuery: {
                ...paramQuery,
                offset: 0
            },
            patrolList: []
        }, () => {
            this.fetchList();
        })
    }

    onAdd = () => {
        Taro.navigateTo({
            url: `/pages/mark/index`
        })
    }

    onTime = (val: any) => {
        const { paramQuery } = this.state;
        const now = new Date()
        const currentDay = now.setHours(0, 0, 0, 0);
        let startTime, endTime;
        switch (val) {
            case 0:
                break;
            case 1:
                startTime = moment(currentDay).subtract(3, 'day').valueOf()
                endTime = moment().valueOf()
                break;
            case 2:
                startTime = moment(currentDay).subtract(7, 'day').valueOf()
                endTime = moment().valueOf()
                break;
            case 3:
                startTime = moment(currentDay).subtract(1, 'month').valueOf()
                endTime = moment().valueOf()
                break;
        }
        this.setState({
            paramQuery: {
                ...paramQuery,
                startTime,
                endTime,
                offset: 0
            },
            currentType: val,
            patrolList: [],
            isLoading: true
        }, this.fetchList)
    }

    onType = (val: any) => {
        const { paramQuery } = this.state;
        this.setState({
            paramQuery: {
                ...paramQuery,
                inspectType: val,
                offset: 0
            },
            patrolList: [],
            isLoading: true
        }, this.fetchList)
    }

    onDetail = (item: any) => {
        Taro.navigateTo({
            url: `/pages/works/detail?inspectId=${item.inspectInfo.id}`
        })
    }

    render() {
        const { hasMore, patrolList, isLoading, currentType, paramQuery } = this.state;
        let isEmptyData = !patrolList || patrolList.length == 0;

        const showEmpty = (<View className='empty'><EmptyHolder text='暂无数据' /></View>)
        const showList = patrolList.map(item => (
            <PatrolItem key={item.inspectInfo.id} data={item} onDetail={this.onDetail.bind(this)} />
        ));

        return (
            <View className='patrol-page'>
                <View className='patrol-page__header'>
                    <FpiDropDown com-class='chooseTime' source={My_Time} value={currentType} onChange={this.onTime.bind(this)} />
                    <FpiDropDown com-class='chooseType' source={My_Type} value={paramQuery.inspectType} onChange={this.onType.bind(this)} />
                </View>
                <View className='space'></View>
                {/* 列表展示部分 */}
                <ListView
                    com-class='content-container'
                    hasMore={hasMore}
                    hasData={!isEmpty(patrolList)}
                    showLoading={isLoading}
                    onRefresh={this.onRefresh}
                    onEndReached={this.fetchList}
                >
                    {isEmptyData ? showEmpty : showList}
                </ListView>
            </View>
        );
    }
}

export default PatrolPage;