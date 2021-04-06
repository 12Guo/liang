import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, Image, Button } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import { rootSourceBaseUrl } from '@common/utils/requests'

import './add.scss'

interface AddUserProps {
  userStore: any;
}

interface AddUserState {

}

@inject('userStore')
@observer
export default class Index extends Component<AddUserProps, AddUserState> {

  config: Config = {
    navigationBarTitleText: '添加成员',
    navigationBarBackgroundColor: '#107EFF',
    navigationBarTextStyle: 'white',
    backgroundColor: '#107EFF',
  }

  constructor(props) {
    super(props)
    this.state = {

    }
  }

  componentDidMount() {
  }

  componentDidShow() {

  }

  onShareAppMessage() {
    const { userStore: { userDetails } } = this.props;
    return {
      title: `邀请你加入${userDetails.divisionName}`,
      path: `/pages/login/login?divisionCode=${userDetails.divisionCode}&share=true`,
      imageUrl: `${rootSourceBaseUrl}/share.png`,
    }
  }

  onShareQRCode() {
    Taro.navigateTo({
      url: '/pages/personManage/qrCode'
    })
  }

  render() {
    return (
      <View className='add-user'>
        <Button plain={true} className='container operate_button' open-type="share">
          <Image className='img' src={`${rootSourceBaseUrl}/assets/common/weixin.png`} />
          <Text className='txt'>通过微信邀请</Text>
        </Button>
        <View className="divider"></View>
        <Button plain={true} className='container operate_button' onClick={this.onShareQRCode}>
          <Image className='img' src={`${rootSourceBaseUrl}/assets/person_manage/qr_code.png`} />
          <Text className='txt'>分享邀请二维码</Text>
        </Button>
      </View>
    )
  }

}
