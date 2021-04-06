import Taro, { Component, Config } from '@tarojs/taro'
import { View } from '@tarojs/components'
import HeaderCard from './components/HeaderCard'
import TodayWork from './components/TodayWork'
import TodayLive from './components/TodayLive'
import AiTip from './components/AiTip'
import { observer, inject } from '@tarojs/mobx';
import { indexData, listByTimeRange, sensitiveList, constructionSiteSentryCount, monitorSiteStatus, alarmsStatistics } from '../../service/home'
import './index.scss'
import moment from 'moment'
import get from 'lodash/get'

interface IndexProps {
  userStore: any;
}

interface IndexState {
  indexData: any;
  monitorData: any;
  todayLiveData: any;
  aiTipData: any;
  deviceCount: number | string;
}

@inject('userStore')
@observer
export default class Index extends Component<IndexProps, IndexState> {

  config: Config = {
    navigationBarTitleText: '首页'
  }

  constructor(props) {
    super(props)
    this.state = {
      indexData: {},
      monitorData: {},
      todayLiveData: {},
      aiTipData: [],
      deviceCount: 0
    }
  }

  componentWillMount() {

  }

  componentDidMount() {
    Taro.authorize({
      scope: 'scope.camera',
    })
    Taro.authorize({
      scope: 'scope.userLocation',
    })
    this.getInitData()
  }

  getInitData = async () => {
    try {
      const startTime = moment().startOf('day').valueOf()
      const endTime = moment().endOf('day').valueOf()
      const params = { startTime, endTime }
      const { userStore: { userDetails: { divisionCode } } } = this.props;
      Promise.all([indexData(params), listByTimeRange({ ...params, offset: 0, limit: 4 }), sensitiveList(params), constructionSiteSentryCount(divisionCode)]).then(([indexDataRes, todayLiveDataRes, AiTipDataRes, deviceCountRes]) => {
        this.setState({
          indexData: indexDataRes.data,
          todayLiveData: todayLiveDataRes.data,
          aiTipData: AiTipDataRes.data,
          deviceCount: deviceCountRes.data
        })
      })
      Promise.all([monitorSiteStatus(), alarmsStatistics({ queryBeginTime: startTime })]).then(([monitorDataRes, deviceDataRes]) => {
        const monitorData = get(monitorDataRes, 'data', {})
        monitorData.deviceData = get(deviceDataRes, 'data', {})
        this.setState({ monitorData })
      })
    }
    catch (err) { }
  }

  componentWillUnmount() { }

  componentDidShow() {
    this.getInitData()
  }

  componentDidHide() { }

  onSentry = () => {
    Taro.navigateTo({
      url: '/pages/sentry/index'
    })
  }

  onSupervise = () => {
    Taro.navigateTo({
      url: '/pages/supervise/index'
    })
  }

  onMonitor = () => {
    Taro.navigateTo({
      url: '/pages/monitor/index'
    })
  }

  onSpray = () => {
    Taro.navigateTo({
      url: '/pages/spray/index'
    })
  }

  onWork = () => {
    Taro.navigateTo({
      url: '/pages/sentry/work'
    })
  }

  onMoreHandle = () => {
    const startTime = moment().startOf('day').valueOf()
    const endTime = moment().endOf('day').valueOf()
    Taro.navigateTo({
      url: `/pages/abnormal/index?startTime=${startTime}&endTime=${endTime}`
    })
  }

  render() {
    const { indexData, todayLiveData, aiTipData, deviceCount, monitorData } = this.state
    const isEmptyData = get(indexData, 'myWork.shouldPatrolNum', 0) === 0 && get(indexData, 'myWork.shouldDisposalNum', 0) === 0
    return (
      <View className='index-page'>
        <HeaderCard
          onSentry={this.onSentry}
          onSupervise={this.onSupervise}
          onMonitor={this.onMonitor}
          onSpray={this.onSpray}
          data={indexData}
          monitorData={monitorData}
          deviceData={deviceCount}
        />
        {!isEmptyData && <TodayWork onWork={this.onWork} data={indexData} />}
        <TodayLive onMore={this.onMoreHandle} data={todayLiveData} />
        <AiTip data={aiTipData} />
      </View>
    )
  }
}
