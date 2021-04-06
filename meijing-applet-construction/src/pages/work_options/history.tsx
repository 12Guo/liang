import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import FilterTabs, { FilterTabsType } from '@common/components/FilterTabs'
import ListView from '@common/components/ListView'
import { observer, inject } from '@tarojs/mobx';
import { historyPatrolList } from '../../service/home'
import TodayItem from '@common/components/FbiItems/TodayItem'
import EmptyHolder from '@common/components/EmptyHolder'
import isEmpty from 'lodash/isEmpty'
import get from 'lodash/get'
import cn from 'classnames'
import './history.scss'
import moment from 'moment';

interface HistoryProps {
  userStore: any;
}

interface HistoryState {
  list: any[];
  paramQuery: {
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

const tabTypes: string[] = ['ALL', 'MY', 'DEPARTMENT'];

@inject('userStore')
@observer
export default class History extends Component<HistoryProps, HistoryState> {

  config: Config = {
    navigationBarTitleText: '历史记录'
  }

  constructor(props) {
    super(props)
    this.state = {
      list: [],
      paramQuery: {
        type: 'ALL',
        offset: 0,
        limit: 10,
        startTime: moment().startOf('day').valueOf(),
        endTime: moment().endOf('day').valueOf()
      },
      tabId: 0,
      isInit: true,
      hasMore: true,
      isLoading: true,
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
    Taro.removeStorageSync('history-search-filter')
  }

  checkIsRefresh = () => {
    const historySearchFilter = Taro.getStorageSync('history-search-filter')
    const { paramQuery } = this.state
    if (get(paramQuery, 'types', '') != get(historySearchFilter, 'types', '')
      || get(paramQuery, 'status', '') != get(historySearchFilter, 'status', '')
      || get(paramQuery, 'startTime', 0) != get(historySearchFilter, 'startTime', 0)
      || get(paramQuery, 'endTime', 0) != get(historySearchFilter, 'endTime', 0)
      || get(paramQuery, 'departmentIds', '') != get(historySearchFilter, 'departmentIds', '')) {
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
    const superviseSearchFilter = Taro.getStorageSync('history-search-filter')
    historyPatrolList({ ...paramQuery, ...superviseSearchFilter }).then(res => {
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

  onFilterHandle = () => {
    const { paramQuery: { startTime, endTime } } = this.state
    Taro.navigateTo({
      url: `./filter?startTime=${startTime}&endTime=${endTime}`
    })
  }

  tabChoose(item: FilterTabsType) {
    const { paramQuery } = this.state
    this.setState({
      tabId: Number(item.id),
      paramQuery: {
        ...paramQuery,
        offset: 0,
        type: tabTypes[Number(item.id)],
      },
      list: [],
      isInit: true,
      isLoading: true,
      hasMore: true
    }, this.fetchList);
  }

  render() {
    const { tabId, hasMore, list, isLoading } = this.state
    let isEmptyData = !list || list.length == 0;
    const showEmpty = (<View className='empty'><EmptyHolder text='暂无数据' /></View>)
    const showList = list.map(item => (
      <TodayItem key={item.id} data={item} />
    ));

    return (
      <View className='history-page'>
        <View className='topTabView'>
          <View className='tabs'>
            <FilterTabs isMore={false}
              data={[{ id: 0, name: '全部' }, { id: 1, name: '我的' }, { id: 2, name: '我的部门' }]}
              tabId={tabId}
              onMore={() => { }}
              rowNum={5}
              storageKey='history-search-filter'
              showFilter
              onFilter={this.onFilterHandle}
              onTab={this.tabChoose.bind(this)} />
          </View>
        </View>

        {/* 列表展示部分 */}
        <ListView
          com-class='body'
          hasMore={hasMore}
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