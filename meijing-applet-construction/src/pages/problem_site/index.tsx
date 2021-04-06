import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import SearchBox from '@common/components/SearchBox'
import ListView from '@common/components/ListView'
import { observer, inject } from '@tarojs/mobx';
import { siteProblem } from '../../service/statistics'
import ConstructionProblem from '@common/components/List/constructionProblem'
import EmptyHolder from '@common/components/EmptyHolder'
import isEmpty from 'lodash/isEmpty'
import get from 'lodash/get'
import cn from 'classnames'
import './index.scss'
import moment from 'moment';

interface DeviceProps {
    userStore: any;
}

interface DeviceState {
    list: any[];
    paramQuery: {
        constructionSiteName: string,
        offset: number,
        limit: number,
        startTime: number,
        endTime: number,
        type?: string,
        status?: string,
        departmentIds?: string
    },
    isInit: boolean,
    isLoading: boolean,
    hasMore: boolean,
}

@inject('userStore')
@observer
export default class Device extends Component<DeviceProps, DeviceState> {

    config: Config = {
        navigationBarTitleText: '问题工地'
    }

    constructor(props) {
        super(props)
        const { startTime = moment().startOf('day').valueOf(), endTime = moment().endOf('day').valueOf() } = this.$router.params
        this.state = {
            list: [],
            paramQuery: {
                constructionSiteName: '',
                offset: 0,
                limit: 20,
                //@ts-ignore
                startTime: parseInt(startTime),
                //@ts-ignore
                endTime: parseInt(endTime)
            },
            isInit: true,
            hasMore: true,
            isLoading: true,
        }
    }

    componentDidShow() {
        if (this.checkIsRefresh()) {
            this.onRefresh()
        }
    }

    componentWillUnmount() {
        Taro.removeStorageSync('problem-search-filter')
    }

    checkIsRefresh = () => {
        const devicelSearchFilter = Taro.getStorageSync('problem-search-filter')
        const { paramQuery } = this.state
        if (get(paramQuery, 'order', '') != get(devicelSearchFilter, 'order', '')
            || get(paramQuery, 'startTime', 0) != get(devicelSearchFilter, 'startTime', 0)
            || get(paramQuery, 'endTime', 0) != get(devicelSearchFilter, 'endTime', 0)
            || get(paramQuery, 'departmentIds', '') != get(devicelSearchFilter, 'departmentIds', '')) {
            return true
        }
        return false
    }

    componentDidMount() {
        this.fetchList()
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
            list: []
        }, () => {
            this.fetchList();
        })
    }

    // 获取列表
    fetchList = (callback?: any) => {
        const { paramQuery } = this.state;
        const deviceSearchFilter = Taro.getStorageSync('problem-search-filter')
        siteProblem({ ...paramQuery, ...deviceSearchFilter }).then(res => {
            const { data = [] } = res;
            let newList = data;
            this.setState({
                list: newList,
                isLoading: false,
                isInit: false,
                hasMore: data.length == paramQuery.limit,
                paramQuery: {
                    ...paramQuery,
                    ...deviceSearchFilter,
                    offset: paramQuery.offset + paramQuery.limit
                }
            }, () => {
                if (callback) {
                    callback();
                }
            });
        }).catch(res => {
            if (callback) {
                callback();
            }
        });
    }

    // 关键字输入
    onInputChange = (val) => {
        const { paramQuery } = this.state
        this.setState({
            list: [],
            paramQuery: {
                ...paramQuery,
                constructionSiteName: val,
                offset: 0
            },
            hasMore: true,
            isLoading: true
        }, this.fetchList)
    }

    onFilterHandle = () => {
        let { paramQuery: { startTime, endTime } } = this.state
        //@ts-ignore
        const { startTime: oriStartTime = moment().startOf('day').valueOf(), endTime: oriEndTime = moment().endOf('day').valueOf() } = this.$router.params
        Taro.navigateTo({
            url: `./filter?startTime=${startTime}&endTime=${endTime}&oriStartTime=${oriStartTime}&oriEndTime=${oriEndTime}`
        })
    }

    onDetail = (item) => {
        const { paramQuery: { startTime, endTime } } = this.state
        Taro.navigateTo({
            url: `/pages/pollution-manage/question?id=${item.pollutionSourceId}&name=${item.name}&startTime=${startTime}&endTime=${endTime}&tabId=1`
        })
    }

    render() {
        const { paramQuery: { constructionSiteName }, hasMore, list, isLoading } = this.state
        let isEmptyData = !list || list.length == 0;
        const showEmpty = (<View className='empty'><EmptyHolder text='暂无数据' /></View>)
        const showList = <ConstructionProblem data={list} onClick={this.onDetail.bind(this)} />;

        return (
            <View className='problem-page'>
                {/* 搜索栏 */}
                <View className='search-container'>
                    <View className='search-box'>
                        <SearchBox
                            value={constructionSiteName}
                            placeholder='搜索工地名称'
                            onInput={this.onInputChange.bind(this)}
                        />
                    </View>
                    <View className={cn('filter-box', { 'active': !isEmpty(Taro.getStorageSync('problem-search-filter')) })} onClick={this.onFilterHandle}>
                        <Text className='txt'>筛选</Text>
                        <View className='icon'></View>
                    </View>
                </View>

                {/* 列表展示部分 */}
                <ListView
                    com-class='body'
                    hasMore={false}
                    hasData={!isEmpty(list)}
                    showLoading={isLoading}
                    onRefresh={this.onRefresh}
                    onEndReached={this.fetchList}
                >
                    {isEmptyData ? showEmpty : showList}
                </ListView>
            </View>
        )
    }
}
