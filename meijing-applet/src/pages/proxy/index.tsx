import Taro, { Component, Config } from '@tarojs/taro'
import { View } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import { UserStore } from '@common/store/user'

interface MyProps {
  userStore: UserStore;
}

interface MyState {

}

let isInit = false;
@inject('userStore')
@observer
export default class Index extends Component<MyProps, MyState> {
  config: Config = {
    navigationBarTitleText: '素材'
  }

  constructor(props) {
    super(props);
    this.state = {

    };
  }

  componentDidShow() {
    if (isInit) {
      Taro.switchTab({
        url: '/pages/task_dispatch_new/index'
      });
      isInit = false;
    }
    else {
      Taro.navigateTo({
        url: '../photo/index'
      })
      isInit = true;
    }
  }

  render() {
    return (
      <View className='content'>
      </View>
    )
  }
}
