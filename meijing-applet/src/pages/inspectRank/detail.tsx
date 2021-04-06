import Taro, { Component, Config } from '@tarojs/taro'
import { View, Image, Text, Block } from '@tarojs/components'
import './detail.scss'
import { observer, inject } from '@tarojs/mobx'
import { UserStore, UserDetails } from '@common/store/user'
import { getPrevPageData } from '@common/utils/common'


interface InspectRankProps {
  userStore: UserStore;
}

interface InspectRankState {
    url: string;
    show: boolean;
    width: number;
    height: number;
}


@inject('userStore')
@observer
export default class Index extends Component<InspectRankProps, InspectRankState> {

  config: Config = {
    navigationBarTitleText: '先锋榜',
    navigationBarBackgroundColor: '#F16A39',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F16A39',
    enablePullDownRefresh: true
  }

  constructor(props) {
    super(props);

    const { name } = this.$router.params;
    Taro.setNavigationBarTitle({
        title: name,
    });


    const pages = Taro.getCurrentPages();
    let url = '';
    if(pages.length>1){
        let prevPageData = getPrevPageData();
        url = prevPageData['rankUrl'];
    }

    this.state = {
        url,
        show: false,
        width: 0,
        height: 0,
    }
  }

  componentDidMount() {
  }

  componentDidShow() {
  }

  onImageLoad = (e)=>{
    const {width, height} = e.detail;

    this.setState({
        width: 750,
        height: height*(750/width),
        show: true,
    });
  }

  showBigImage(url: string) {
    Taro.previewImage({
      urls: [url]
    })
  }

  render() {
    const { url , width, height, show} = this.state;

    return (
      <View className='content'>
            {
                url && url.length>0 &&
                <Image className={show ? 'imageItem':'imageItem hidden'} style={{ width: width+'rpx', height: height+'rpx' }} src={url} onLoad={this.onImageLoad} mode='aspectFill' onClick={this.showBigImage.bind(this, url)}  />    
            }

      </View>
    )
  }
}
