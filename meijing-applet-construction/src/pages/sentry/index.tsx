import Taro, { Component, Config } from '@tarojs/taro'
import { View } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import SentryAccess from './components/SentryAccess'
import SentryWarn from './components/SentryWarn'
import DeviceStatus from './components/DeviceStatus'
import { sentryNumber, listFromSentry, constructionSiteVideoStatusList, constructionSiteVideoReport } from '../../service/home'
import moment from 'moment'
import './index.scss'
import get from 'lodash/get';

interface SentryProps {
  userStore: any;
}

interface SentryState {
  sentryNumberData: any;
  sentryNumberList: any[];
  videoStatusList: any[];
  videoReportData: any;
  startTime: number;
  endTime: number;
}

@inject('userStore')
@observer
export default class Sentry extends Component<SentryProps, SentryState> {

  config: Config = {
    navigationBarTitleText: '视频哨兵'
  }

  constructor(props) {
    super(props)
    this.state = {
      sentryNumberData: {},
      sentryNumberList: [],
      startTime: moment().startOf('day').valueOf(),
      endTime: moment().endOf('day').valueOf(),
      videoStatusList: [],
      videoReportData: {}
    }
  }

  componentWillMount() {

  }

  componentDidMount() {
    // this.getSentryData()
  }

  componentWillUnmount() { }

  componentDidShow() {
    this.getSentryData()
  }

  componentDidHide() { }

  getSentryData = () => {
    try {
      const { startTime, endTime } = this.state
      const params = { startTime, endTime }
      Promise.all([sentryNumber(params), listFromSentry({ ...params, offset: 0, limit: 3 })]).then(([sentryNumberRes, sentryNumberListRes]) => {
        this.setState({
          sentryNumberData: sentryNumberRes.data,
          sentryNumberList: get(sentryNumberListRes, 'data.entries', []),
        })
      })

      Promise.all([constructionSiteVideoStatusList(), constructionSiteVideoReport()]).then(([videoStatusListRes, videoReportDataRes]) => {
        console.log(videoReportDataRes, videoStatusListRes)
        this.setState({
          videoStatusList: get(videoStatusListRes, 'data', []),
          videoReportData: get(videoReportDataRes, 'data', [])
        })
      })
    }
    catch (err) { }
  }

  onMoreHandle = () => {
    const { startTime, endTime } = this.state
    Taro.navigateTo({
      url: `/pages/device/index?startTime=${startTime}&endTime=${endTime}`
    })
  }

  onDeviceHandle = () => {
    Taro.navigateTo({
      url: '/pages/device/status'
    })
  }

  onDateChange = (options) => {
    this.setState({
      startTime: options.startTime,
      endTime: options.endTime
    }, this.getSentryData)
  }

  render() {
    const { sentryNumberData, sentryNumberList, startTime, endTime, videoStatusList, videoReportData } = this.state
    return (
      <View className='sentry-page'>
        <SentryAccess data={videoReportData} />
        <View className='gap'></View>
        <SentryWarn onMore={this.onMoreHandle} data={sentryNumberData} list={sentryNumberList} startTime={startTime} endTime={endTime} onChange={this.onDateChange.bind(this)} />
        <View className='gap'></View>
        <DeviceStatus onMore={this.onDeviceHandle} data={videoStatusList} />
      </View>
    )
  }
}
