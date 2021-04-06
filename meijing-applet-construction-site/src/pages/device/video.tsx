import Taro, { Component, Config } from "@tarojs/taro";
import { View, LivePlayer, ScrollView, Image, Text, Block, CoverView } from "@tarojs/components";
import { AtActivityIndicator } from 'taro-ui'
import { observer, inject } from "@tarojs/mobx";
import {
  videoPlayDetail,
  listConstructionVideos,
  listConstructionVideoInspects,
} from "../../service/device";
import ListView from "@common/components/ListView";
import isEmpty from "lodash/isEmpty";
import VideoAlarmItem from "@common/components/FbiItems/VideoAlarmItem";
import EmptyHolder from "@common/components/EmptyHolder";
import { rootConstructionSourceBaseUrl } from '@common/utils/requests'
import get from 'lodash/get'
import cn from 'classnames'
import "./video.scss";

const ImgIconSnap = `${rootConstructionSourceBaseUrl}/assets/pages/sentry/icon-snap.png`
const ImgVideoPlay = `${rootConstructionSourceBaseUrl}/assets/pages/sentry/video_play.png`
const ImgSentryIcon = `${rootConstructionSourceBaseUrl}/assets/pages/sentry/sentry_icon.png`
const ImgVideoItemDefault = `${rootConstructionSourceBaseUrl}/assets/pages/sentry/video_item_default.png`
const ImgFullBig = `${rootConstructionSourceBaseUrl}/assets/pages/sentry/icon-big.png`
const ImgFullLittle = `${rootConstructionSourceBaseUrl}/assets/pages/sentry/icon-little.png`
const ImgIconPlaying = `${rootConstructionSourceBaseUrl}/assets/pages/sentry/icon-playing.png`
const ImgIconPause = `${rootConstructionSourceBaseUrl}/assets/pages/sentry/icon-pause.png`
const ImgNoVideo = `${rootConstructionSourceBaseUrl}/assets/pages/green-construction/no_video.png`;

interface VideoProps {
  userStore: any;
}

interface VideoState {
  currentVideoCode: string;
  sourceId: string;
  currentVideoPlayAddrdss: string;
  isPlaying: boolean;
  isFirstPlay: boolean;
  videoList: any;
  hasMore: boolean;
  list: any[];
  isLoading: boolean;
  isInit: boolean;
  paramQuery: {
    offset: number;
    limit: number
  };
  isFull: boolean;
  showOperate: boolean;
  online: boolean;    // 判断视频是否在线/离线
  playerLoading: boolean;
  playerError: boolean;
}

@inject("userStore")
@observer
export default class Video extends Component<VideoProps, VideoState> {
  config: Config = {
    navigationBarTitleText: "",
    navigationBarTextStyle: "white",
    navigationBarBackgroundColor: "#1B1E26",
  };
  videoContext: any;
  operateTimer: any = null;

  constructor(props) {
    super(props);
    let { pollutionSourceInfo, tenant } = props.userStore.userDetails
    this.state = {
      sourceId: pollutionSourceInfo && pollutionSourceInfo.pollutionSourceId,
      currentVideoCode: "",
      currentVideoPlayAddrdss: "",
      isPlaying: true,
      videoList: null,
      hasMore: false,
      list: [],
      isInit: false,
      isFirstPlay: true,
      isLoading: false,
      paramQuery: {
        offset: 0,
        limit: 10
      },
      isFull: false,
      showOperate: false,
      online: true,
      playerLoading: true,
      playerError: false
    };
    if (tenant && tenant.name) {
      Taro.setNavigationBarTitle({
        title: tenant.name,
      });
    }
  }

  componentWillMount() { }

  componentDidMount() {
    const tenantCode = this.props.userStore.userDetails.tenant.code;
    let _this = this;
    listConstructionVideos(tenantCode).then((videoList) => {
      const videoResult: any = videoList.data.entries;
      _this.setState({
        videoList: videoResult,
        online: videoResult.length > 0 ? videoResult[0].online : false
      }, () => {
        if (videoResult && videoResult.length > 0) {
          this.resetVideoPlayAddress(videoResult[0].videoCode);
          this.fetchList();
        }
      });
    });

  }

  playVideo(online: boolean) {
    const { isFirstPlay, showOperate } = this.state;
    if (online === false) return;
    if (isFirstPlay) {
      this.setState({
        isPlaying: true,
        isFirstPlay: false,
        showOperate: true
      }, () => {
        console.log("play");
        this.videoContext.play({
          fail: function () {
            Taro.showToast({
              title: `视频播放失败!`,
              icon: 'none'
            })
          }
        });
      })
    }
    else {
      this.setState({ showOperate: !showOperate })
    }
  }

  onChange = (e) => {
    e.stopPropagation()
    this.setState(
      {
        isPlaying: true,
        isFirstPlay: false
      },
      () => {
        if (this.videoContext) {
          try {
            // if (!isPlaying) {
            //   console.log("resume");
            //   this.videoContext.resume();
            // } else {
            //   console.log("pause");
            //   this.videoContext.pause();
            // }
          }
          catch (err) {
            Taro.showToast({
              title: `视频操作失败!`,
              icon: 'none'
            })
          }
        }
      }
    );
  }

  onRefresh = () => {
    const { paramQuery } = this.state;
    this.setState({
      paramQuery: {
        ...paramQuery,
        offset: 0
      },
      list: []
    }, () => {
      this.fetchList();
    })
  }

  fetchList = (callback?: any) => {
    const { paramQuery, isInit, list } = this.state;
    listConstructionVideoInspects(paramQuery).then((res) => {
      const {
        data: { entries = [] },
      } = res;
      let newList = entries;
      if (!isInit) {
        newList = list.concat(newList);
      }
      this.setState({
        list: newList,
        isLoading: false,
        isInit: false,
        hasMore: entries.length == paramQuery.limit,
        paramQuery: {
          ...paramQuery,
          offset: paramQuery.offset + paramQuery.limit,
        },
      }, () => {
        if (callback) {
          callback();
        }
      });
    }).catch(() => {
      callback()
    });
  };

  resetVideoPlayAddress(videoCode: string) {
    const nowVideoObj = this.state.videoList.find(item => item.videoCode === videoCode);
    videoPlayDetail(videoCode).then((videoDetail) => {
      let playAddress: string[] = videoDetail.data.playDomainAddress;

      if (this.videoContext) {
        this.videoContext.stop();
        this.setState({
          currentVideoPlayAddrdss: playAddress[0],
          currentVideoCode: videoCode,
          isFirstPlay: false,
          online: nowVideoObj.online,
          playerLoading: true,
          playerError: false
        }, () => {
          const { online, isPlaying } = this.state;
          this.videoContext = Taro.createLivePlayerContext("live-player");
          if (online) {
            if (isPlaying) {
              this.videoContext.play();
            } else {
              // this.videoContext.stop();
            }
          } else {
            Taro.showToast({
              title: "设备处于离线状态",
              icon: "none"
            });
          }
        })
      } else {
        this.setState({
          currentVideoPlayAddrdss: playAddress[0],
          currentVideoCode: videoCode,
          // isPlaying: false,
          isFirstPlay: true,
          online: nowVideoObj.online
        }, () => {
          this.videoContext = Taro.createLivePlayerContext("live-player");
          if (this.state.online === false) {
            Taro.showToast({
              title: "设备处于离线状态",
              icon: "none"
            });
          }
          else {
            this.playVideo(true)
          }
          // setTimeout(() => {
          //   this.videoContext.stop();
          // })
        });

      }
    });
  }

  onSnapShot = (e) => {
    e.stopPropagation()
    this.videoContext.snapshot().then(response => {
      console.log(response);
      this.setState({ isFull: false }, () => {
        this.videoContext.exitFullScreen();
        Taro.navigateTo({
          url: `./snapshot?tempImagePath=${response.tempImagePath}`
        })
      });
    }).catch(() => {
      Taro.showToast({
        title: `截屏失败!`,
        icon: 'none'
      })
    })
  }

  onFullScreen = (e) => {
    e.stopPropagation()
    const { isFull } = this.state
    this.setState({
      isFull: !isFull
    }, () => {
      isFull ? this.videoContext.exitFullScreen() : this.videoContext.requestFullScreen({ direction: 90 })
    })
  }

  onStateChange = (e: any) => {
    console.log(e, 'video')
    switch (e.detail.code) {
      case 2001:
      case 2007:
      case 2103:
        this.setState({ playerLoading: true })
        break;
      case 2004:
      case 2105:
        this.setState({ playerLoading: false })
        break;
      case -2301:
        this.setState({ playerLoading: false, playerError: true })
        break;
    }
  }

  render() {
    const {
      currentVideoPlayAddrdss, videoList, hasMore, list, isLoading, currentVideoCode, isFull, showOperate, isFirstPlay, online, playerLoading, playerError
    } = this.state;
    console.log('currentVideoPlayAddrdss', currentVideoPlayAddrdss)
    let isEmptyData = !list || list.length == 0;
    const showEmpty = (
      <View className="empty">
        <EmptyHolder text="暂无数据" />
      </View>
    );
    const scrollStyle = {};
    const showList = list.map((item, index) => (
      <VideoAlarmItem
        key={item.id}
        data={item}
        isLast={index === list.length - 1}
      />
    ));

    return (
      <View className="root">
        {
          videoList && videoList.length > 0 && (
            <View
              className={cn("live_player_container", { "live_player_container--hide": !showOperate && !isFirstPlay })}
              onClick={this.playVideo.bind(this, online)}
            >
              {
                currentVideoCode && (
                  <LivePlayer
                    key={currentVideoCode}
                    className="live-player"
                    id="live-player"
                    src={currentVideoPlayAddrdss}
                    mode="RTC"
                    autoplay={false}
                    muted={false}
                    orientation="vertical"
                    minCache={1}
                    maxCache={3}
                    objectFit="fillCrop"
                    backgroundMute={true}
                    onStateChange={this.onStateChange}
                  >
                    {playerLoading && <AtActivityIndicator color='#fff' size={48} mode='center' content='加载中...' />}
                    {playerError && <View className='video_error'>网络不佳，请稍后再试</View>}
                    {!isFirstPlay && (
                      online ? (
                        <Block>
                          <View className='snapshot' onClick={this.onSnapShot}>
                            <Image className="img" src={ImgIconSnap} />
                            <Text className='txt'>截屏预警</Text>
                          </View>
                          {/* <Image className="img_play" src={isPlaying ? ImgIconPlaying : ImgIconPause} onClick={this.onChange} /> */}
                          <Image className="img_full" src={isFull ? ImgFullLittle : ImgFullBig} onClick={this.onFullScreen} />
                        </Block>
                      ) : (
                          <CoverView className="hide-canvas">
                            <CoverView className="online-title">视频设备离线</CoverView>
                          </CoverView>
                        )
                    )}
                  </LivePlayer>
                )
              }
            </View>
          )
        }
        {
          videoList && videoList.length > 0 && (
            <ScrollView
              className="scrollview"
              scrollX={true}
              scrollWithAnimation
              style={scrollStyle}
              onScrollToUpper={() => { }}
              onScroll={() => { }}
            >
              {videoList.map((videoItem) => {
                return (
                  <View className="video_item">
                    {videoItem.sentry && (
                      <Image className="sentry_icon" src={ImgSentryIcon}></Image>
                    )}
                    <View
                      className="video_container"
                      onClick={this.resetVideoPlayAddress.bind(this, videoItem.videoCode)}
                    >
                      <Image
                        className={currentVideoCode == videoItem.videoCode ? "video on_selected" : "video"}
                        src={ImgVideoItemDefault}
                      />
                      <View className={currentVideoCode == videoItem.videoCode ? "title on_selected_title" : "title"}>{videoItem.name}</View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )
        }
        {
          videoList && videoList.length > 0 && (
            <View className="inspect_container">
              <View className="tip">历史预警信息</View>
              <ListView
                com-class="content"
                hasMore={hasMore}
                hasData={!isEmpty(list)}
                showLoading={isLoading}
                onRefresh={this.onRefresh}
                onEndReached={this.fetchList}
              >
                {isEmptyData ? showEmpty : showList}
              </ListView>
            </View>
          )
        }

        {
          videoList && videoList.length === 0 && (
            <View className="no_video">
              <Image src={ImgNoVideo} className="no_video_img" />
              <View className="no_video_text">工地暂无视频设备</View>
            </View>
          )
        }
      </View>
    );
  }
}
