import Taro, { Component, Config } from "@tarojs/taro";
import { View, Image, Text } from "@tarojs/components";
import { observer, inject } from "@tarojs/mobx";
import { rootConstructionSourceBaseUrl } from '@common/utils/requests'
import "./snapshot.scss";

interface SnapshotProps {
  userStore: any;
}

interface SnapshotState {

}

//图标引用
const fanhui = `${rootConstructionSourceBaseUrl}/assets/pages/device/fanhui.png`;
const shangbao = `${rootConstructionSourceBaseUrl}/assets/pages/device/shangbao.png`;
const xiazai = `${rootConstructionSourceBaseUrl}/assets/pages/device/xiazai.png`;

@inject("userStore")
@observer
export default class Video extends Component<SnapshotProps, SnapshotState> {
  config: Config = {
    navigationBarTitleText: "截屏",
    navigationBarTextStyle: "white",
    navigationBarBackgroundColor: "#1B1E26",
  };
  videoContext: any;

  constructor(props) {
    super(props);
    this.state = {

    };
  }

  onInspect = () => {
    const { tempImagePath } = this.$router.params
    Taro.redirectTo({
      url: `/pages/inspectReport/report?type=PATROL&photos=${JSON.stringify([{ url: tempImagePath, rotate: 0 }])}`
    })
  }

  onBack = () => {
    Taro.navigateBack()
  }

  onSave = () => {
    const { tempImagePath } = this.$router.params
    Taro.saveImageToPhotosAlbum({
      filePath: tempImagePath,
    }).then(() => {
      Taro.showToast({ title: '图片保存成功', icon: 'success', duration: 2000 })
    })
  }

  render() {
    const { tempImagePath } = this.$router.params
    return (
      <View className="snap-shot">
        <Image className='img' src={tempImagePath} />
        <View className='operate'>
          <View className='operate-item' onClick={this.onBack}>
            <Image className='item-img' src={fanhui} />
            <Text className='item-txt'>返回</Text>
          </View>
          <View className='operate-item' onClick={this.onSave}>
            <Image className='item-img' src={xiazai} />
            <Text className='item-txt'>保存相册</Text>
          </View>
          <View className='operate-item' onClick={this.onInspect}>
            <Image className='item-img' src={shangbao} />
            <Text className='item-txt'>上报事件</Text>
          </View>
        </View>
      </View>
    );
  }
}
