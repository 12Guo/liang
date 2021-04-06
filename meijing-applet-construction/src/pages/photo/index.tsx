import Taro, { Component, Config } from '@tarojs/taro'
import { View } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import { UserStore } from '../../store/user'
import FpiCamera,{Photo} from '@common/components/FpiCamera'

interface MyProps {
  userStore: UserStore;
}

interface MyState {
  photos: Photo[],
  isForbidden: boolean,
}

@inject('userStore')
@observer
export default class Index extends Component<MyProps, MyState> {
  config: Config = {
    navigationBarTitleText: '素材',
    navigationBarBackgroundColor: '#FFFFFF',
    navigationBarTextStyle: 'black',
    backgroundColor: '#FFFFFF',
    disableScroll: true
  }

  constructor(props) {
    super(props);
    this.state = {
      photos: [],
      isForbidden: false
    };
  }

  onComplete = (list: Photo[]) => {
    this.setState({
      photos: list
    }, () => {
      Taro.redirectTo({
        url: `../inspectReport/report?type=PATROL&photos=${JSON.stringify(list)}`
      })
    })
  }

  onChange = (isShow) => {
    Taro.setNavigationBarColor({
      backgroundColor: isShow ? '#14171A' : '#FFFFFF',
      frontColor: isShow ? '#ffffff' : '#000000'
    })
  }

  componentDidShow() {
    let that = this;
    Taro.getSetting({
      success(res) {
        that.setState({
          isForbidden: !res.authSetting['scope.camera']
        })
      },
    })
  }

  render() {
    return (
      <View className='content'>
        <FpiCamera onOK={this.onComplete.bind(this)} onStatus={this.onChange} isFobidden={this.state.isForbidden} />
      </View>
    )
  }
}
