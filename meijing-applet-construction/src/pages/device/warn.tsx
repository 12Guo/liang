import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import SearchBox from '@common/components/SearchBox'
import ListView from '@common/components/ListView'
import { observer, inject } from '@tarojs/mobx';
import { pollutionSourcesListAlarms } from '../../service/alarm'
import YjItem from '@common/components/FbiItems/YjItem'
import EmptyHolder from '@common/components/EmptyHolder'
import isEmpty from 'lodash/isEmpty'
import get from 'lodash/get'
import cn from 'classnames'
import './warn.scss'
import moment from 'moment';

interface DeviceProps {
  userStore: any;
}

interface DeviceState {
  list: any[];
  paramQuery: {
    name: string,
    offset: number,
    limit: number,
    queryBeginTime: number,
    queryEndTime: number
  },
  isInit: boolean,
  isLoading: boolean,
  hasMore: boolean,
}

@inject('userStore')
@observer
export default class Device extends Component<DeviceProps, DeviceState> {

  config: Config = {
    navigationBarTitleText: '监测预警'
  }

  constructor(props) {
    super(props)
    const { queryBeginTime = moment().startOf('day').valueOf(), queryEndTime = moment().endOf('day').valueOf() } = this.$router.params
    this.state = {
      list: [],
      paramQuery: {
        name: '',
        offset: 0,
        limit: 20,
        //@ts-ignore
        queryBeginTime: parseInt(queryBeginTime),
        //@ts-ignore
        queryEndTime: parseInt(queryEndTime)
      },
      isInit: true,
      hasMore: true,
      isLoading: true,
    }
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
    pollutionSourcesListAlarms({ ...paramQuery }).then(res => {
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
        name: val,
        offset: 0
      },
      hasMore: true,
      isLoading: true
    }, this.fetchList)
  }

  onFilterHandle = () => {
    let { paramQuery: { queryBeginTime, queryEndTime } } = this.state
    //@ts-ignore
    const { queryBeginTime: oriStartTime = moment().startOf('day').valueOf(), queryEndTime: oriEndTime = moment().endOf('day').valueOf() } = this.$router.params
    Taro.navigateTo({
      url: `./filter?startTime=${queryBeginTime}&endTime=${queryEndTime}&oriStartTime=${oriStartTime}&oriEndTime=${oriEndTime}`
    })
  }

  render() {
    const { paramQuery: { name }, hasMore, list, isLoading } = this.state
    let isEmptyData = !list || list.length == 0;
    const showEmpty = (<View className='empty'><EmptyHolder text='暂无数据' /></View>)
    const showList = list.map(item => (
      <YjItem key={item.id} data={item} />
    ));

    return (
      <View className='device-page'>
        {/* 搜索栏 */}
        <View className='search-container'>
          <View className='search-box'>
            <SearchBox
              value={name}
              placeholder='搜索站点名称'
              onInput={this.onInputChange.bind(this)}
            />
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