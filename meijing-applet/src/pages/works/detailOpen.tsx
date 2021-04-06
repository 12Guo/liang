import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, Image, ScrollView, Swiper, SwiperItem, Map } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import { getInspectDetailOpen, InspectDetail, InspectInfoType } from '../../service/inspect'
import { SimpleRichView } from '@common/components/rich-text'
import { inspectTypeText } from '@common/utils/common'
import { rootSourceBaseUrl } from '@common/utils/requests'
import { getShowContent } from '@common/utils/rich-text'
import TopBar from '@common/components/TopBar'
import moment from 'moment';
import get from 'lodash/get';

import './detailOpen.scss'

const pollutionsImg = ['lyfs', 'dlyc', 'cyyy', 'ljwr', 'gdyc', 'lthj', 'shljdf', 'jzlj'];

interface InspectDetailProps {
  systemInfoStore: any;
}

interface InspectDetailState {
  /**
   * 事件id
   */
  inspectId: number;
  /**
   * 事件详情
   */
  inspectDetail?: InspectDetail;

  /**
   * 是否是分享打开的
   */
  share: boolean;
}

@inject('systemInfoStore')
@observer
export default class Detail extends Component<InspectDetailProps, InspectDetailState> {

  config: Config = {
    navigationBarTitleText: '事件详情',
    navigationBarBackgroundColor: '#FFFFFF',
    navigationBarTextStyle: 'black',
    backgroundColor: '#FFFFFF',
    enablePullDownRefresh: true,
    navigationStyle: 'custom'
  }

  constructor(props) {
    super(props)
    this.state = {
      inspectId: 0,
      share: false,
    }
  }

  componentDidMount() {
    let { inspectId, share } = this.$router.params;
    let inspectIdNumber = parseInt(inspectId);

    this.setState({
      inspectId: inspectIdNumber,
      share: 'true' == share,
    });

    (async () => {
      try {
        Taro.showLoading({
          title: '数据加载中',
          mask: true,
        });
        //获取事件详情
        const detailResp = await getInspectDetailOpen(inspectIdNumber);
        this.setState({
          inspectDetail: detailResp.data,
        }, () => {
          Taro.hideLoading();
        });
      } catch (error) {
        Taro.hideLoading();
        //从分享地址进来的时候，如果403，则跳转到权限受限页面
        if ('true' == share && error.statusCode == 403) {
          const message = error.data && error.data.message || '';
          Taro.redirectTo({
            url: `/pages/default/limitedAccess?message=${message}`,
          });
        } else {
          Taro.showToast({
            title: "数据加载失败，请重试！",
            icon: 'none'
          });
        }
      }
    })();

  }

  componentDidShow() {
  }

  atClick() { }

  tagClick() { }

  showBigImage(urls: string[]) {
    Taro.previewImage({
      urls: urls
    })
  }

  /**
   * 分享
   */
  onShareAppMessage() {
    const { inspectDetail } = this.state;

    if (inspectDetail) {
      let inspectId = inspectDetail.id || 0

      let titile = inspectDetail.content && getShowContent(inspectDetail.content) ||
        inspectTypeText(inspectDetail.type, inspectDetail.supervise);

      if (inspectDetail.pollutionTypeName) {
        titile = `【${inspectDetail.pollutionTypeName}】` + titile;
      }

      let imageUrl = inspectDetail.pictureLinks && inspectDetail.pictureLinks.length > 0
        && inspectDetail.pictureLinks[0] || `${rootSourceBaseUrl}/share.png`;

      return {
        title: titile,
        path: `/pages/works/detailOpen?inspectId=${inspectId}&share=true`,
        imageUrl: imageUrl,
      }
    }

    return {
      title: '巡查事件',
      path: `/pages/works/detailOpen?inspectId=0&share=true`,
    }
  }

  /**
   * 影响分析
   */
  yxfx() {
    Taro.navigateTo({
      url: `/pages/discuss_analysis/index`
    })
  }

  // 加载更多
  onScrollToLower = () => {
  }

  //下拉刷新
  onScrollToUpper = () => {
  }

  //下拉刷新
  onPullDownRefresh() {
  }

  navHandle = (item: InspectDetail) => {
    Taro.openLocation({
      longitude: item.longitude,
      latitude: item.latitude
    })
  }

  onBackHandle = () => {
  }


  /**
   * 影响分析跳转
   */
  impactHandle = () => {
    const { inspectDetail } = this.state;
    if (!inspectDetail) {
      return;
    }

    const token: string = Taro.getStorageSync('token');
    let path: string = `impact-analysis?inspectId=${inspectDetail.id}&title=${encodeURIComponent('影响分析')}`

    Taro.navigateTo({
      url: '/common/pages/webview/index?url=' + encodeURIComponent(path)
    });
  }


  render() {
    const { inspectDetail } = this.state;
    const { systemInfoStore } = this.props;

    if (!inspectDetail) {
      return <View className='content'></View>
    }
    const statusBarHeight = get(systemInfoStore, 'systemInfo.statusBarHeight', 22);

    let inspectTypeStr = inspectTypeText(inspectDetail && inspectDetail.type || InspectInfoType.INCIDENT, inspectDetail && inspectDetail.supervise || false);

    const latitude: any = inspectDetail && inspectDetail.latitude || 0;
    const longitude: any = inspectDetail && inspectDetail.longitude || 0;

    const markerList: any = [{
      iconPath: `${rootSourceBaseUrl}/assets/inspect_report/impact_point.png`,
      id: 0,
      latitude,
      longitude,
      width: 28,
      height: 28,
    }];


    return (
      <View className={`content device_pd_${statusBarHeight}`}>
        <TopBar title='事件详情' onBack={this.onBackHandle} />

        <ScrollView
          className='tabContent'
          scrollY
          scrollWithAnimation
          upperThreshold={50}
          onScrollToUpper={this.onScrollToUpper}
          lowerThreshold={50}
          onScrollToLower={this.onScrollToLower}
        >
          <Swiper
            className='images'
            indicatorColor='#999'
            indicatorActiveColor='#333'
            circular
            indicatorDots
            style={{ height: '208px' }}
            autoplay>
            {
              inspectDetail && inspectDetail.pictureLinks && inspectDetail.pictureLinks.length > 0 &&
              inspectDetail.pictureLinks.map(link => {
                return <SwiperItem key={link}>
                  <View className='imageItem-container'>
                    <Image className='imageItem' src={link} mode="aspectFill" onClick={this.showBigImage.bind(this, inspectDetail.pictureLinks)} />
                  </View>
                </SwiperItem>
              })
            }
          </Swiper>

          {
            inspectDetail.type == InspectInfoType.INCIDENT &&
            <View className='pollutionType contentItem splitBorderBottom'>
              <View className='title-container'>
                <Image className='imageItem' src={`${rootSourceBaseUrl}/assets/works/${pollutionsImg[inspectDetail.pollutionTypeId - 1]}.png`} />
                <Text className='pollutionSourceTitle'>{inspectDetail.pollutionTypeName || ''}</Text>
              </View>
            </View>
          }

          <View className='contentItem contentAndVoiceView splitBorderBottom'>
            <View className='contentView'>
              <Text className='inspectType'>{inspectTypeStr}</Text>
              <SimpleRichView class-name='' content={inspectDetail && inspectDetail.content || ''} onAtClick={this.atClick.bind(this)} onTagClick={this.tagClick.bind(this)} />
            </View>
          </View>

          <View className='contentItem contentItemList splitBorderBottom'>
            <View className='propertyItem'>
              <Image className='propertyIcon' src={`${rootSourceBaseUrl}/assets/works/pollution_source_icon.png`} />
              <Text className='propertyName'>污染源</Text>
              <Text className='propertyValue'>{inspectDetail.pollutionSourceName || ''}</Text>
            </View>

            <View className='propertyItem'>
              <Image className='propertyIcon' src={`${rootSourceBaseUrl}/assets/works/address.png`} />
              <Text className='propertyName'>地址</Text>
              <View className='address' onClick={this.navHandle.bind(this, inspectDetail)}>
                <Text className='propertyValue'>{inspectDetail.address || ''}</Text>
                <Image className='propertyIcon' src={`${rootSourceBaseUrl}/assets/task_dispatch/navigator.png`} />
              </View>
            </View>

            <View className='propertyItem'>
              <Image className='propertyIcon' src={`${rootSourceBaseUrl}/assets/works/clock.png`} />
              <Text className='propertyName'>上报时间</Text>
              <Text className='propertyValue'>
                {inspectDetail && moment(inspectDetail.createTime).format('YYYY-MM-DD HH:mm')}
              </Text>
            </View>

            <View className='propertyItem'>
              <Image className='propertyIcon' src={`${rootSourceBaseUrl}/assets/works/reportUser.png`} />
              <Text className='propertyName'>上报人</Text>
              <Text className='propertyValue'>{inspectDetail.anonymous ? '匿名用户' : (inspectDetail.reportUserName || '')}</Text>
            </View>

          </View>

          {
            inspectDetail && inspectDetail.impactAnalysisData &&
            <View className='mapView'>
              <View className='title'>影响分析</View>
              <Map style={{ height: `272rpx`, zIndex: 1, width: `686rpx` }}
                id="map"
                scale={12}
                markers={markerList}
                show-location={true}
                polygons={inspectDetail.impactAnalysisData.geojson.features}
                className="map"
                longitude={longitude}
                latitude={latitude}
              />
            </View>
          }
        </ScrollView>
      </View>
    )
  }
}
