import Taro, { Component, Config, uma } from '@tarojs/taro'
import { View } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import MonitorAccess from './components/MonitorAccess'
import EarlyWarn from './components/EarlyWarn'
import MonitorWarn from './components/MonitorWarn'
import DeviceStatus from './components/DeviceStatus'
import { monitorSiteStatus, constructionCount, listSiteStatus, alarmsStatistics } from '../../service/home'
import { sortAlarms, pollutionSourcesListAlarms } from '../../service/alarm'
import moment from 'moment'
import './index.scss'
import get from 'lodash/get';

interface SentryProps {
  userStore: any;
}

interface SentryState {
  warnTypeData: any;
  monitorStatusList: any[];
  startTime: number;
  endTime: number;
  constructionData: any;
  monitorData: any;

  queryBeginTime: number;
  queryEndTime: number;
  warnNumberData: any;
  warnNumberList: any[];
}

@inject('userStore')
@observer
export default class Sentry extends Component<SentryProps, SentryState> {

  config: Config = {
    navigationBarTitleText: '在线监测'
  }

  constructor(props) {
    super(props)
    this.state = {
      warnTypeData: {},
      startTime: moment().startOf('day').valueOf(),
      endTime: moment().endOf('day').valueOf(),
      monitorStatusList: [],
      constructionData: {},
      monitorData: {},

      queryBeginTime: moment().startOf('day').valueOf(),
      queryEndTime: moment().endOf('day').valueOf(),
      warnNumberData: {},
      warnNumberList: [],
    }
  }

  componentDidShow() {
    uma.trackEvent('test', { name: '测试' });
  }

  componentWillMount() {

  }

  componentDidMount() {
    this.initData()
    this.getWarnData()
    this.getWarnTypeData()
  }

  // 饼状图数据和监测设备状态
  initData = () => {
    Promise.all([monitorSiteStatus(), constructionCount()]).then(([monitorSiteStatusRes, constructionCountRes]) => {
      this.setState({
        constructionData: get(constructionCountRes, 'data', []),
        monitorData: get(monitorSiteStatusRes, 'data', [])
      })
    })

    listSiteStatus().then(res => {
      this.setState({ monitorStatusList: get(res, 'data', []) })
    })
  }

  // 预警类别统计数据
  getWarnTypeData = () => {
    try {
      const { startTime, endTime } = this.state

      sortAlarms({ queryBeginTime: startTime, queryEndTime: endTime }).then(res => {
        this.setState({ warnTypeData: get(res, 'data', []) })
      })
    }
    catch (err) { }
  }

  onMoreHandle = () => {
    const { queryEndTime, queryBeginTime } = this.state
    Taro.navigateTo({
      url: `/pages/device/warn?queryBeginTime=${queryBeginTime}&queryEndTime=${queryEndTime}`
    })
  }

  onDeviceHandle = () => {
    Taro.navigateTo({
      url: '/pages/monitor/status'
    })
  }

  onDateChange = (options) => {
    this.setState({
      startTime: options.startTime,
      endTime: options.endTime
    }, this.getWarnTypeData)
  }

  // 在线监测预警时间变化
  onWarnChange = (options) => {
    this.setState({
      queryBeginTime: options.startTime,
      queryEndTime: options.endTime
    }, this.getWarnData)
  }

  // 获取监测预警数据
  getWarnData = () => {
    try {
      const { queryBeginTime, queryEndTime } = this.state
      alarmsStatistics({ queryBeginTime, queryEndTime }).then(res => {
        this.setState({ warnNumberData: get(res, 'data', {}) })
      })
      pollutionSourcesListAlarms({ queryBeginTime, queryEndTime, limit: 3, offset: 0 }).then(res => {
        this.setState({ warnNumberList: get(res, 'data.entries', []) })
      })
    }
    catch (err) { }
  }

  render() {
    const { warnTypeData, startTime, endTime, monitorStatusList, monitorData, constructionData, warnNumberData, queryBeginTime, queryEndTime, warnNumberList } = this.state
    return (
      <View className='sentry-page'>
        <MonitorAccess monitorData={monitorData} constructionData={constructionData} />
        <View className='gap'></View>
        <EarlyWarn onMore={this.onMoreHandle} data={warnTypeData} startTime={startTime} endTime={endTime} onChange={this.onDateChange.bind(this)} />
        <View className='gap'></View>
        <MonitorWarn onMore={this.onMoreHandle} data={warnNumberData} list={warnNumberList} startTime={queryBeginTime} endTime={queryEndTime} onChange={this.onWarnChange.bind(this)} />
        <View className='gap'></View>
        <DeviceStatus onMore={this.onDeviceHandle} data={monitorStatusList} />
      </View>
    )
  }
}
