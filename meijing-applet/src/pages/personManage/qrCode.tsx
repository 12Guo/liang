import Taro, { Component, Config } from '@tarojs/taro'
import { View, Image } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import { AtButton } from 'taro-ui'
import { UserStore } from '@common/store/user';
import { getQrCode } from '@common/service/user';
import './qrCode.scss'

interface QRCodeProps {
  userStore: UserStore;
}

interface QRCodeState {
  qRImageUrl: string
}

@inject('userStore')
@observer
export default class QRCode extends Component<QRCodeProps, QRCodeState> {

  config: Config = {
    navigationBarTitleText: '邀请二维码',
  }

  constructor(props) {
    super(props)
    this.state = {
      qRImageUrl: ""
    }
  }

  async componentDidMount() {
    const { userStore: { userDetails } } = this.props;
    let scene: string = "value=" + userDetails.divisionCode + "&type=code";
    let page: string = `pages/login/login`
    let qrCodeResponse = await getQrCode(userDetails.divisionCode + ".jpg", scene, page);
    this.setState({
      qRImageUrl: qrCodeResponse.data.qrCodeUrl
    })
  }

  componentDidShow() {

  }

  onShareAppMessage() {
    const { userStore: { userDetails } } = this.props;
    const { qRImageUrl } = this.state;
    return {
      title: `邀请你加入${userDetails.divisionName}`,
      imageUrl: qRImageUrl,
      path: `/pages/login/login?divisionCode=${userDetails.divisionCode}&share=true`
    }
  }

  //保存到手机
  async onSaveToPhone() {
    const { qRImageUrl } = this.state;
    await Taro.downloadFile({
      url: qRImageUrl,
      success(res) {
        let tempPath: string = res.tempFilePath;
        Taro.authorize({
          scope: 'scope.writePhotosAlbum',
        }).then(() => {
          Taro.saveImageToPhotosAlbum({
            filePath: tempPath
          })
        })
      }
    })
  }

  render() {
    const { userStore: { userDetails } } = this.props;
    const { qRImageUrl } = this.state;
    return (
      <View className="root_view">
        <View className="image_group">
          <View className="invate">
            <View className="divider"></View>
            <View className="invate_title">邀请你加入</View>
            <View className="divider"></View>
          </View>
          <View className="division_name">{userDetails.divisionName}</View>
          <View className="qr_code">
            <Image src={qRImageUrl} className="qr_image"></Image>
          </View>
          <View className="tip">打开微信扫描二维码加入</View>
        </View>
        <View className="foot_view">
          <View className="btn_item">
            <AtButton className="view_foot_btn" type='primary' onClick={this.onSaveToPhone.bind(this)}>保存到手机</AtButton>
          </View>
          <View className="btn_item">
            <AtButton className="view_foot_btn" type='primary' openType="share">分享</AtButton>
          </View>
        </View>
      </View>
    )
  }

}
