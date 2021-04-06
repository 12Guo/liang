import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import SearchBox from '@common/components/SearchBox'
import FilterTabs, { FilterTabsType } from '@common/components/FilterTabs'
import { observer, inject } from '@tarojs/mobx';
import { listSiteStatus } from '../../service/home'
import EmptyHolder from '@common/components/EmptyHolder'
import MonitorItem from '@common/components/FbiItems/MonitorItem'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import './status.scss'

interface StatusProps {
  userStore: any;
}

interface StatusState {
  queryContent: string;
  videoStatusList: any;
  tabId: string | number;
}

@inject('userStore')
@observer
export default class Status extends Component<StatusProps, StatusState> {

  config: Config = {
    navigationBarTitleText: '在线监测设备状态'
  }

  constructor(props) {
    super(props)
    this.state = {
      queryContent: '',
      videoStatusList: [],
      tabId: 'ALL'
    }
  }

  componentWillMount() {

  }

  componentDidMount() {
    listSiteStatus().then((videoStatusListRes) => {
      this.setState({
        videoStatusList: get(videoStatusListRes, 'data', []),
      })
    })
  }

  componentWillUnmount() { }

  componentDidShow() { }

  componentDidHide() { }

  // 关键字输入
  onInputChange = (val) => {
    this.setState({
      queryContent: val
    })
  }

  onFilterHandle = () => {
    Taro.navigateTo({
      url: './filter'
    })
  }

  tabChoose(item: FilterTabsType) {
    this.setState({
      tabId: item.id
    });
  }

  render() {
    const { queryContent, tabId, videoStatusList } = this.state
    let list = videoStatusList.filter(item => item.types.includes(tabId))
    if (queryContent) {
      //@ts-ignore
      list = list.filter(device => device.pollutionSourceName.includes(queryContent))
    }
    return (
      <View className='status-page'>
        {/* 搜索栏 */}
        <SearchBox
          value={queryContent}
          placeholder='搜索工地名称'
          onInput={this.onInputChange.bind(this)}
        />

        <View className='tabs'>
          <FilterTabs
            com-class='filter-tabs'
            isMore={false}
            data={[{ id: 'ALL', name: '全部' }, { id: 'ONLINE', name: '在线' }, { id: 'OFFLINE', name: '离线' }]}
            tabId={tabId}
            rowNum={5}
            onTab={this.tabChoose.bind(this)} />
        </View>

        <View className='body'>
          {
            //@ts-ignore
            list.map((item, index) => <MonitorItem key={item.pollutionSourceId} data={item} />)
          }
          {isEmpty(list) && <View className='empty'><EmptyHolder text='暂无数据' /></View>}
        </View>
      </View>
    )
  }
}