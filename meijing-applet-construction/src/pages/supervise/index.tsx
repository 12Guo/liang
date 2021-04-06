import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import FilterTabs, { FilterTabsType } from '@common/components/FilterTabs'
import ListView from '@common/components/ListView'
import { observer, inject } from '@tarojs/mobx';
import { constructionSites } from '../../service/home'
import TodayItem from '@common/components/FbiItems/TodayItem'
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
export default class Device extends Component<DeviceProps, DeviceState> {

  config: Config = {
    navigationBarTitleText: '人员监管'
  }

  constructor(props) {
    super(props)
    const { startTime = moment().startOf('day').valueOf(), endTime = moment().endOf('day').valueOf() } = this.$router.params
    this.state = {
      list: [],
      paramQuery: {
        type: 'ALL',
        offset: 0,
        limit: 10,
        //@ts-ignore
        startTime: parseInt(startTime),
        //@ts-ignore
        endTime: parseInt(endTime)
      },
      tabId: 0,
      isInit: true,
      hasMore: true,
      isLoading: true,
    }
    const { nameType } = this.$router.params
    if (nameType === 'inspect') {
      Taro.setNavigationBarTitle({ title: `整改督查` });
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
    Taro.removeStorageSync('supervise-search-filter')
  }

  checkIsRefresh = () => {
    const superviseSearchFilter = Taro.getStorageSync('supervise-search-filter')
    const { paramQuery } = this.state
    if (get(paramQuery, 'types', '') != get(superviseSearchFilter, 'types', '')
      || get(paramQuery, 'status', '') != get(superviseSearchFilter, 'status', '')
      || get(paramQuery, 'startTime', 0) != get(superviseSearchFilter, 'startTime', 0)
      || get(paramQuery, 'endTime', 0) != get(superviseSearchFilter, 'endTime', 0)
      || get(paramQuery, 'departmentIds', '') != get(superviseSearchFilter, 'departmentIds', '')) {
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
    const superviseSearchFilter = Taro.getStorageSync('supervise-search-filter')
    constructionSites({ ...paramQuery, ...superviseSearchFilter }).then(res => {
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
    if (item.id != 0) {
      Taro.setStorageSync('supervise-search-filter', {})
    }
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
    const showList = list.map((item, index) => (
      <TodayItem key={item.id + index} data={item} />
    ));

    return (
      <View className='supervise-page'>
        <View className='topTabView'>
          <View className='tabs'>
            <FilterTabs isMore={false}
              data={[{ id: 0, name: '全部' }, { id: 1, name: '我的' }, { id: 2, name: '我的部门' }]}
              tabId={tabId}
              onMore={() => { }}
              rowNum={5}
              storageKey='supervise-search-filter'
              showFilter={tabId == 0}
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