import Taro, { Component, Config } from '@tarojs/taro'
import { View } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import { UserStore } from '@common/store/user'
import { reportDetail } from '../../service/report'
import get from 'lodash/get';

interface MyProps {
  userStore: UserStore;
}

interface MyState {

}

const Report_Map = {
  DAILY: 'day',
  WEEKLY: 'week',
  MONTHLY: 'month',
  REMIND: 'remind'
}

@inject('userStore')
@observer
export default class Index extends Component<MyProps, MyState> {
  config: Config = {
    navigationBarTitleText: '分析报告'
  }

  constructor(props) {
    super(props);
    this.state = {

    };

  }

  componentWillMount() {
    this.navigateToReport();
  }

  navigateToReport = async () => {
    const { reportId } = this.$router.params
    const result = await reportDetail({ id: reportId })
    const data = get(result, 'data', {})
    let prefixUrl = '';
    const params = {
      token: Taro.getStorageSync('token'),
      id: reportId,
      title: get(data, 'name'),
      reportType: get(data, 'reportType'),
      reportCategory: get(data, 'reportCategory')
    }

    if (params.reportCategory === 'DEPARTMENT') {
      prefixUrl = 'report/department'
    }
    else {
      switch (params.reportType) {
        case 'REMIND':
          prefixUrl = 'report/remind'
          break;
        case 'DAILY':
          prefixUrl = 'report/day'
          break;
        default:
          prefixUrl = 'report/common'
          break;
      }
    }
    const url = prefixUrl + '?' + Object.entries(params).map(entry => `${entry[0]}=${entry[1]}`).join('&')
    Taro.redirectTo({
      url: '/common/pages/webview/index?url=' + encodeURIComponent(url)
    })
  }

  render() {
    return (
      <View className='content'>
      </View>
    )
  }
}
