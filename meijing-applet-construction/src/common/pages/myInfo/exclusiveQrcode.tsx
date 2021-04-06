import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, Image} from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import { AtAvatar, AtButton} from 'taro-ui'
import { getUserAvatarUrl } from '@common/utils/requests'
import { UserStore } from '@common/store/user'
import { getQrCode } from '@common/service/user';
import './exclusiveQrcode.scss';
import TopBar from "@common/components/TopBar";

interface exclusiveQrcodeProps {
  userStore: UserStore;
}

interface exclusiveQrcodeState {
  qRImageUrl: string
}

@inject('userStore')
@observer
export default class exclusiveQrcode extends Component<exclusiveQrcodeProps, exclusiveQrcodeState> {

  config: Config = {
    navigationBarTitleText: '专属邀请邀请码',
    navigationStyle: "custom"
  }

  constructor(props) {
    super(props)
    this.state = {
      qRImageUrl: ""
    }
  }

  async componentDidMount() {
    const { userStore: { userDetails: { tenantUser } } } = this.props;
    let scene: string = "value=" + tenantUser.userId + "&type=user_id";
    let page: string = `pages/login/login`
    let exclusiveQrcodeResponse = await getQrCode(tenantUser.userId + ".jpg", scene, page);
    this.setState({
      qRImageUrl: exclusiveQrcodeResponse.data.qrCodeUrl
    })
  }

  componentDidShow() {

  }

  onShareAppMessage() {
    const { userStore: { userDetails: { tenantUser } } } = this.props;
    return {
      title: `${tenantUser.userName}邀请你体验易美境`,
      imageUrl: require('../../assets/my/salesman_invite.png'),
      path: `/pages/login/login?value=${tenantUser.userId}&type=user_id`
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
        Taro.showToast({
          title: "二维码保存成功",
          mask: true,
          icon: "none",
          duration: 3000
        });
      }
    })
  }

  onNavBack(){
    Taro.navigateBack();
  }

  render() {
    const { userStore: { userDetails: { tenantUser } } } = this.props;
    const { qRImageUrl } = this.state;
    return (
      <View className="root_view">
        <TopBar title="专属邀请二维码" background={'#fff'} color={'#0a2463'} backVisible={true} onBack={this.onNavBack} />
        <View className="user_info">
            <AtAvatar className='avatar' circle image={`${getUserAvatarUrl(tenantUser.userId)}`} />
            <Text className='name'>{`${tenantUser.userName}`}</Text>
          </View>
        <View className="image_group">
          <View className="invate">
            <View className="divider"></View>
            <View className="invate_title">邀请你使用易美境</View>
            <View className="divider"></View>
          </View>
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
