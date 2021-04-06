import Taro, { Component, Config } from '@tarojs/taro';
import { View, Text, ScrollView, } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import ListView from '@common/components/ListView'
import { anomalyList } from '../../service/home'
import FilterTabs, { FilterTabsType } from '@common/components/FilterTabs'
import QuestionItem from '@common/components/FbiItems/QuestionItem'
import EmptyHolder from '@common/components/EmptyHolder'
import isEmpty from 'lodash/isEmpty'
import get from 'lodash/get'

import './question.scss'
import moment from 'moment';


const tabTypes: string[] = ['', 'SENTRY'];

interface QuestionProps {
    userStore: any;
}

interface QuestionState {
    list: any[];
    name: string;
    paramQuery: {
        constructionSiteId: string;
        type: string,
        offset: number,
        limit: number,
        startTime: number,
        endTime: number,
        departmentIds?: string,
        status?: boolean,
        types?: string,
    },
    tabId: number,
    isInit: boolean,
    isLoading: boolean,
    hasMore: boolean,
}


@inject('userStore')
@observer
class QuestionPage extends Component<QuestionProps, QuestionState> {
    config: Config = {
        navigationBarTitleText: '异常问题记录'
    }

    static externalClasses = ['com-class']

    constructor(props) {
        super(props);
        const { id, name, startTime = moment().startOf('day').valueOf(), endTime = moment().endOf('day').valueOf(), tabId = '0' } = this.$router.params;
        this.state = {
            list: [],
            paramQuery: {
                constructionSiteId: id,
                type: tabTypes[Number(tabId)],
                offset: 0,
                limit: 10,
                //@ts-ignore
                startTime: parseInt(startTime),
                //@ts-ignore
                endTime: parseInt(endTime)
            },
            tabId: parseInt(tabId),
            isInit: true,
            hasMore: true,
            isLoading: true,
            name
        }
    }

    componentDidMount() {
        this.fetchList()
    }

    componentDidShow() {
        if (this.checkIsRefresh()) {
            this.onRefresh()
        }
    }

    componentWillUnmount() {
        Taro.removeStorageSync('anomaly-search-filter')
    }

    checkIsRefresh = () => {
        const anomalySearchFilter = Taro.getStorageSync('anomaly-search-filter')
        const { paramQuery } = this.state
        if (get(paramQuery, 'status', '') != get(anomalySearchFilter, 'status', '')
            || get(paramQuery, 'startTime', 0) != get(anomalySearchFilter, 'startTime', 0)
            || get(paramQuery, 'endTime', 0) != get(anomalySearchFilter, 'endTime', 0)) {
            return true
        }
        return false
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
        const { paramQuery, isInit, list } = this.state;
        const superviseSearchFilter = Taro.getStorageSync('anomaly-search-filter')
        anomalyList({ ...paramQuery, ...superviseSearchFilter }).then(res => {
            const { data: { entries = [] } } = res;
            let newList = entries;
            if (!isInit) {
                newList = list.concat(newList);
            }
            this.setState({
                list: newList,
                isLoading: false,
                isInit: false,
                hasMore: entries.length == paramQuery.limit,
                paramQuery: {
                    ...paramQuery,
                    ...superviseSearchFilter,
                    offset: paramQuery.offset + paramQuery.limit,
                    startTime: superviseSearchFilter.startTime || paramQuery.startTime,
                    endTime: superviseSearchFilter.endTime || paramQuery.endTime
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

    tabChoose(item: FilterTabsType) {
        const { paramQuery } = this.state
        this.setState({
            tabId: Number(item.id),
            paramQuery: {
                ...paramQuery,
                offset: 0,
                type: tabTypes[Number(item.id)]
            },
            list: [],
            isInit: true,
            isLoading: true,
            hasMore: true
        }, this.fetchList);
    }

    onFilterHandle = () => {
        const { paramQuery: { startTime, endTime } } = this.state
        Taro.navigateTo({
            url: `./filter?startTime=${startTime}&endTime=${endTime}`
        })
    }

    render() {
        const { tabId, hasMore, list, isLoading } = this.state
        let isEmptyData = !list || list.length == 0;
        const showEmpty = (<View className='empty'><EmptyHolder text='暂无数据' /></View>)
        const showList = list.map((item, index) => (
            <QuestionItem key={item.id} data={item} isLast={index === list.length - 1} />
        ));
        return (
            <View className='question-page'>
                <View className='question-page_header'>
                    <Text className='title'>{name}</Text>
                </View>
                <View className='question-page_body'>
                    <FilterTabs
                        com-class='filter-tabs'
                        isMore={false}
                        data={[{ id: 0, name: '人员监管' }, { id: 1, name: '视频预警' }]}
                        tabId={tabId}
                        rowNum={3}
                        showFilter
                        onFilter={this.onFilterHandle}
                        storageKey='anomaly-search-filter'
                        onTab={this.tabChoose.bind(this)} />

                    <ListView
                        com-class='content'
                        hasMore={hasMore}
                        hasData={!isEmpty(list)}
                        showLoading={isLoading}
                        onRefresh={this.onRefresh}
                        onEndReached={this.fetchList}
                    >
                        {isEmptyData ? showEmpty : showList}
                    </ListView>
                </View>
            </View>
        );
    }
}

export default QuestionPage;