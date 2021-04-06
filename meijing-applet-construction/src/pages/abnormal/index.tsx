import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import SearchBox from '@common/components/SearchBox'
import ListView from '@common/components/ListView'
import { observer, inject } from '@tarojs/mobx';
import { listByTimeRange } from '../../service/home'
import TodayItem from '@common/components/FbiItems/TodayItem'
import EmptyHolder from '@common/components/EmptyHolder'
import isEmpty from 'lodash/isEmpty'
import get from 'lodash/get'
import cn from 'classnames'
import './index.scss'

interface AbnormalProps {
  userStore: any;
}

interface AbnormalState {
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
export default class Abnormal extends Component<AbnormalProps, AbnormalState> {

  config: Config = {
    navigationBarTitleText: '工地实况'
  }

  constructor(props) {
    super(props)
    const { startTime = '1591372800000', endTime = '1594051200000' } = this.$router.params
    this.state = {
      list: [],
      paramQuery: {
        constructionSiteName: '',
        offset: 0,
        limit: 20,
        startTime: parseInt(startTime),
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
    Taro.removeStorageSync('abnormal-search-filter')
  }

  checkIsRefresh = () => {
    const abnormalSearchFilter = Taro.getStorageSync('abnormal-search-filter')
    const { paramQuery } = this.state
    if (get(paramQuery, 'types', '') != get(abnormalSearchFilter, 'types', '')
      || get(paramQuery, 'status', '') != get(abnormalSearchFilter, 'status', '')
      || get(paramQuery, 'startTime', 0) != get(abnormalSearchFilter, 'startTime', 0)
      || get(paramQuery, 'endTime', 0) != get(abnormalSearchFilter, 'endTime', 0)
      || get(paramQuery, 'departmentIds', '') != get(abnormalSearchFilter, 'departmentIds', '')) {
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
    const { paramQuery, isInit, list } = this.state;
    const abnormalSearchFilter = Taro.getStorageSync('abnormal-search-filter')
    console.log(abnormalSearchFilter,1)
    listByTimeRange({ ...paramQuery, ...abnormalSearchFilter }).then(res => {
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
          ...abnormalSearchFilter,
          offset: paramQuery.offset + paramQuery.limit,
          startTime: abnormalSearchFilter.startTime || paramQuery.startTime,
          endTime: abnormalSearchFilter.endTime || paramQuery.endTime
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
    const { paramQuery: { startTime, endTime } } = this.state
    console.log(this.state, 11)
    Taro.navigateTo({
      url: `./filter?startTime=${startTime}&endTime=${endTime}`
    })
  }

  render() {
    const { paramQuery: { constructionSiteName }, hasMore, list, isLoading } = this.state
    let isEmptyData = !list || list.length == 0;
    const showEmpty = (<View className='empty'><EmptyHolder text='暂无数据' /></View>)
    const showList = list.map(item => (
      <TodayItem key={item.id} data={item} />
    ));

    return (
      <View className='abnormal-page'>
        {/* 搜索栏 */}
        <View className='search-container'>
          <View className='search-box'>
            <SearchBox
              value={constructionSiteName}
              placeholder='搜索工地名称'
              onInput={this.onInputChange.bind(this)}
            />
          </View>
          <View className={cn('filter-box', { 'active': !isEmpty(Taro.getStorageSync('abnormal-search-filter')) })} onClick={this.onFilterHandle}>
            <Text className='txt'>筛选</Text>
            <View className='icon'></View>
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