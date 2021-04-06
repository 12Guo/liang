import Taro, { Component, Config } from "@tarojs/taro";
import { View, LivePlayer, ScrollView, Image, Block } from "@tarojs/components";
import { AtActivityIndicator } from 'taro-ui'
import { observer, inject } from "@tarojs/mobx";
import {
  videoPlayDetail,
  listConstructionVideos,
  listConstructionVideoInspects,
} from "../../service/home";
import { rootConstructionSourceBaseUrl } from '@common/utils/requests'
import ListView from "@common/components/ListView";
import isEmpty from "lodash/isEmpty";
import VideoAlarmItem from "@common/components/FbiItems/VideoAlarmItem";
import NoData from "@common/components/NoData/monitor";
import EmptyHolder from "@common/components/EmptyHolder";

const ImgFullBig = `${rootConstructionSourceBaseUrl}/assets/pages/sentry/icon-big.png`
const ImgFullLittle = `${rootConstructionSourceBaseUrl}/assets/pages/sentry/icon-little.png`
import "./video.scss";
import { get } from "lodash";

interface VideoProps {
  userStore: any;
}

interface VideoState {
  currentVideoCode: string;
  sourceId: string;
  sourceName: string;
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
    limit: number;
    pollutionSourceId: string;
  };
  isFull: boolean;
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

  constructor(props) {
    super(props);
    let { pollutionSourceId, pollutionSourceName } = this.$router.params;
    this.state = {
      sourceId: pollutionSourceId,
      sourceName: pollutionSourceName,
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
        limit: 10,
        pollutionSourceId: pollutionSourceId,
      },
      isFull: false,
      playerLoading: true,
      playerError: false
    };
    if (pollutionSourceName) {
      Taro.setNavigationBarTitle({
        title: pollutionSourceName,
      });
    }
  }

  componentWillMount() { }

  componentDidMount() {
    const { sourceId } = this.state;
    let _this = this;
    this.videoContext = Taro.createLivePlayerContext("livePlayer");
    listConstructionVideos(sourceId).then((videoList) => {
      const videoResult: any = videoList.data;
      _this.setState({
        videoList: videoList,
      }, () => {
        if (videoResult && videoResult.length > 0) {
          this.resetVideoPlayAddress(videoResult[0].videoCode)
        }
      });
    });
    this.fetchList()
  }

  playVideo() {
    const { isFirstPlay } = this.state;
    this.setState(
      {
        isPlaying: true,
        isFirstPlay: false
      },
      () => {
        if (this.videoContext) {
          if (isFirstPlay) {
            console.log("play");
            this.videoContext.play();
            return;
          }
          // if (!isPlaying) {
          //   console.log("resume");
          //   this.videoContext.resume();
          // } else {
          //   console.log("pause");
          //   this.videoContext.pause();
          // }
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
    let _this = this;
    videoPlayDetail(videoCode).then((videoDetail) => {
      let playAddress: string[] = videoDetail.data.playDomainAddress;
      _this.setState({
        currentVideoPlayAddrdss: playAddress[0],
        currentVideoCode: videoCode,
        // isPlaying: false,
        isFirstPlay: true,
        playerLoading: true,
        playerError: false
      }, () => {
        this.videoContext.stop();
        setTimeout(() => {
          this.playVideo()
        }, 1000)
      });
    });
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
      currentVideoPlayAddrdss,
      isPlaying,
      videoList,
      hasMore,
      list,
      isLoading,
      currentVideoCode,
      isFull,
      playerLoading,
      playerError
    } = this.state;
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
    console.log(currentVideoPlayAddrdss, 'currentVideoPlayAddrdss----', list, videoList)

    if (isEmpty(list) && isEmpty(get(videoList, 'data'))) {
      return (
        <View className='root-empty'>
          <NoData isVideo showBack text='该工地暂无视频设备' />
        </View>
      )
    }

    return (
      <View className="root">
        {
          isEmpty(get(videoList, 'data')) ?
            (
              <View className='video-empty'>
                <NoData showBack={false} isVideo text='该工地暂无视频设备' />
              </View>
            ) :
            (
              <Block>
                <View
                  className="live_player_container"
                  onClick={this.playVideo.bind(this)}
                >
                  <LivePlayer
                    className="live-player"
                    id="livePlayer"
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
                    {isPlaying && (<Image className="img_full" src={isFull ? ImgFullLittle : ImgFullBig} onClick={this.onFullScreen} />)}
                  </LivePlayer>
                </View>
                <ScrollView
                  className="scrollview"
                  scrollX={true}
                  scrollWithAnimation
                  style={scrollStyle}
                  onScrollToUpper={() => { }}
                  onScroll={() => { }}
                >
                  {videoList != null &&
                    videoList.data.map((videoItem) => {
                      return (
                        <View className="video_item">
                          {videoItem.sentry && (
                            <Image
                              className="sentry_icon"
                              src={require("../../assets/video/sentry_icon.png")}
                            ></Image>
                          )}
                          <View
                            className="video_container"
                            onClick={this.resetVideoPlayAddress.bind(
                              this,
                              videoItem.videoCode
                            )}
                          >
                            <Image
                              className={currentVideoCode == videoItem.videoCode ? "video on_selected" : "video"}
                              src={require("../../assets/video/video_item_default.png")}
                            />
                            <View className={currentVideoCode == videoItem.videoCode ? "title on_selected_title" : "title"}>{videoItem.name}</View>
                          </View>
                        </View>
                      );
                    })}
                </ScrollView>
              </Block>
            )
        }
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
      </View>
    );
  }
}
