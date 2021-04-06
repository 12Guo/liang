import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, Image, ScrollView, Swiper, SwiperItem, Button } from '@tarojs/components'
import { AtAvatar, AtModal, AtModalHeader, AtModalAction } from 'taro-ui'
import { observer, inject } from '@tarojs/mobx';
import {
  getInspectDetail, getAssignList, getPraiseList, getShareList,
  getViewList, getReplyList, InspectDetail, assign, share, view, praise, supervise, InspectInfoType
} from '../../service/inspect'
import { SimpleRichView } from '@common/components/rich-text'
import { clearValueInPageData, getPageData, inspectTypeText, isOnlyInspector, isAnyRole, SUPERVISOR, ADMINISTRATOR, LEADER } from '@common/utils/common'
import { SimpleUser } from '@common/service/user'
import { rootSourceBaseUrl, getUserAvatarUrl, baseUrl } from '@common/utils/requests'
import { RecorderPlay } from '@common/components/recorder'
import { getShowContent } from '@common/utils/rich-text'
import FilterTabs from '@common/components/FilterTabs'
import EmptyHolder from '@common/components/EmptyHolder'
import TopBar from '@common/components/TopBar'
import moment from 'moment';

import './detail.scss'
import get from 'lodash/get';

const superviseIcon = rootSourceBaseUrl + "/assets/works/supervise_dt.png";
const supervisedIcon = rootSourceBaseUrl + "/assets/works/supervised_dt.png";
const assignIcon = rootSourceBaseUrl + "/assets/works/assign_dt.png";
const cantAssignIcon = rootSourceBaseUrl + "/assets/works/gray_person.png";

const praiseIcon = rootSourceBaseUrl + "/assets/works/praise_dt.png";
const praisedIcon = rootSourceBaseUrl + "/assets/works/praised_dt.png";
const shareIcon = rootSourceBaseUrl + "/assets/works/share_dt.png";
const replyIcon = rootSourceBaseUrl + "/assets/works/reply_dt.png";


const limit = 10;
const pollutionsImg = ['lyfs', 'dlyc', 'cyyy', 'ljwr', 'gdyc', 'lthj', 'shljdf', 'jzlj'];

interface PageParms {
  /**
   * 列表数据
   */
  list: any[];
  /**
  * 列表总条数
  */
  total: number;

  limit: number;
  /**
   * 列表页码
   */
  offset: number;

  /**
   * 列表是否有更多
   */
  hasMore: boolean;
}

interface InspectDetailProps {
  userStore: any;
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

  replyPageParams: PageParms;

  assignPageParams: PageParms;

  praisePageParams: PageParms;

  sharePageParams: PageParms;

  viewPageParams: PageParms;

  /**
   * tab标签页id
   */
  tabId: number;
  /**
   * 是否是分享打开的
   */
  share: boolean;
  /**
   * 是否允许指派他人
   */
  canAssign: boolean;
  /**
   * 是否显示督查提示框
   */
  isSuperviseTipShow: boolean;
}

@inject('userStore', 'systemInfoStore')
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
      canAssign: true,
      tabId: 1,
      replyPageParams: {
        list: [],
        total: 0,
        limit: limit,
        offset: 0,
        hasMore: true,
      },
      assignPageParams: {
        list: [],
        total: 0,
        limit: limit,
        offset: 0,
        hasMore: true,
      },
      praisePageParams: {
        list: [],
        total: 0,
        limit: limit,
        offset: 0,
        hasMore: true,
      },
      sharePageParams: {
        list: [],
        total: 0,
        limit: limit,
        offset: 0,
        hasMore: true,
      },
      viewPageParams: {
        list: [],
        total: 0,
        limit: limit,
        offset: 0,
        hasMore: true,
      },
      isSuperviseTipShow: false,
    }
  }

  componentDidMount() {
    let { userStore: { userDetails } } = this.props;
    if (isOnlyInspector(userDetails.roles)) {
      this.setState({
        canAssign: false
      })
    }
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
        const detailResp = await getInspectDetail(inspectIdNumber);
        this.setState({
          inspectDetail: detailResp.data,
        }, () => {
          Taro.hideLoading();
        });
      } catch (error) {
        Taro.hideLoading();
        //从分享地址进来的时候，如果403，则跳转到权限受限页面
        if ('true' == share && (error.statusCode == 403 || error.statusCode == 500)) {
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


    //查看事件
    view(inspectIdNumber);

    //获取查看列表
    getViewList(inspectIdNumber).then(viewListResp => {
      this.setState({
        viewPageParams: {
          list: viewListResp.data.entries,
          total: viewListResp.data.total,
          limit: limit,
          offset: 0,
          hasMore: this.hasmore(viewListResp.data.entries),
        }
      });
    }).catch(error => { });

    this.getNewReplyList(inspectIdNumber);
    this.getNewAssignList(inspectIdNumber);
    this.getNewShareList(inspectIdNumber);
    this.getNewPraiseList(inspectIdNumber);
  }

  componentDidShow() {
    const { inspectDetail, inspectId } = this.state;
    const { refresh, assignPerson } = getPageData();

    if (refresh) {
      Taro.showLoading({
        title: '数据加载中……',
        mask: true,
      });

      //刷新事件详情数据
      getInspectDetail(inspectId).then(detailResp => {
        this.setState({
          inspectDetail: detailResp.data,
        }, () => {
          Taro.hideLoading();
          this.getNewReplyList(inspectId);
        });
      }).catch(() => {
        Taro.hideLoading();
      });
      clearValueInPageData(['refresh']);
    }

    if (assignPerson) {
      let personsList: SimpleUser[] = assignPerson.choosedUsers;

      if (personsList && personsList.length > 0 && inspectDetail) {
        //指派
        assign({
          inspectId: inspectDetail.id,
          userId: personsList[0].id,
          userName: personsList[0].name,
          departmentId: personsList[0].departmentId,
          departmentCode: personsList[0].departmentCode,
          departmentName: personsList[0].departmentName,
        });
      }
      clearValueInPageData(['assignPerson']);
    }
  }

  reply() {
    const { inspectDetail } = this.state;
    if (inspectDetail) {
      Taro.navigateTo({
        url: `./reply?inspectId=${inspectDetail.id}`
      })
    }
  }


  atClick() { }

  tagClick() { }


  hasmore(entries: any[]) {
    return limit == entries.length;
  }

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
      try {
        share(inspectDetail.id);
      } catch (error) {
      }


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
        path: `/pages/works/detail?inspectId=${inspectId}&share=true`,
        imageUrl: imageUrl,
      }
    }

    return {
      title: '巡查事件',
      path: `/pages/works/detail?inspectId=0&share=true`,
    }
  }

  /**
   * 指派
   */
  assign() {
    const { canAssign } = this.state;
    if (!canAssign) {
      return false;
    }
    Taro.navigateTo({
      url: '../person/index?dataCode=assignPerson&radio=true&type=4&only=true'
    });
  }

  /**
   * 影响分析
   */
  yxfx() {
    Taro.navigateTo({
      url: `/pages/discuss_analysis/index`
    })
  }

  tabChoose(item) {
    const { replyPageParams, assignPageParams, praisePageParams, sharePageParams } = this.state;
    const tabId = item.id;

    let getMore = false;
    switch (tabId) {
      case 1:
        getMore = replyPageParams.list.length > 0;
        break;
      case 2:
        getMore = assignPageParams.list.length > 0;
        break;
      case 3:
        getMore = praisePageParams.list.length > 0;
        break;
      case 4:
        getMore = sharePageParams.list.length > 0;
        break;
      default:
        getMore = replyPageParams.list.length > 0;
        break;
    }

    if (getMore) {
      this.getMoreBehaviorList(tabId);
    } else {
      this.getNewBehaviorList(tabId);
    }

    this.setState({
      tabId: tabId,
    });

  }

  // 加载更多
  onScrollToLower = () => {
    const { tabId } = this.state;
    this.getMoreBehaviorList(tabId);
  }

  //下拉刷新
  onScrollToUpper = () => {
    const { tabId } = this.state;
    this.getNewBehaviorList(tabId);
  }

  //下拉刷新
  onPullDownRefresh() {
    const { tabId } = this.state;
    this.getNewBehaviorList(tabId);
    Taro.stopPullDownRefresh();
  }

  getMoreBehaviorList(tabId: number) {
    switch (tabId) {
      case 1:
        this.getMoreReplyList();
        break;
      case 2:
        this.getMoreAssignList();
        break;
      case 3:
        this.getMorePraiseList();
        break;
      case 4:
        this.getMoreShareList();
        break;
      default:
        this.getMoreReplyList();
        break;
    }
  }

  getNewBehaviorList(tabId: number) {
    const { inspectId } = this.state;

    switch (tabId) {
      case 1:
        this.getNewReplyList(inspectId);
        break;
      case 2:
        this.getNewAssignList(inspectId);
        break;
      case 3:
        this.getNewPraiseList(inspectId);
        break;
      case 4:
        this.getNewShareList(inspectId);
        break;
      default:
        this.getNewReplyList(inspectId);
        break;
    }
  }

  /**
   * 获取最新回复列表
   */
  getNewReplyList = (inspectId: number) => {
    let offset = 0;
    getReplyList(inspectId, offset, limit).then(listResp => {
      const { data: { entries, total } } = listResp;

      this.setState({
        replyPageParams: {
          list: entries,
          total: total,
          limit: limit,
          offset: offset,
          hasMore: this.hasmore(entries),
        }
      });
    }).catch(error => { });
  }

  getMoreReplyList = () => {
    let { inspectId, replyPageParams: { hasMore, offset, list } } = this.state;
    if (!hasMore) { return; }

    let newOffset = offset + limit;

    getReplyList(inspectId, newOffset, limit).then(listResp => {
      const { data: { entries, total } } = listResp;

      this.setState({
        replyPageParams: {
          list: list.concat(entries),
          total: total,
          limit: limit,
          offset: newOffset,
          hasMore: this.hasmore(entries),
        }
      });
    }).catch(error => { });
  }


  getNewAssignList = (inspectId: number) => {
    let offset = 0;

    getAssignList(inspectId, offset, limit).then(listResp => {
      const { data: { entries, total } } = listResp;

      this.setState({
        assignPageParams: {
          list: entries,
          total: total,
          limit: limit,
          offset: offset,
          hasMore: this.hasmore(entries),
        }
      });
    }).catch(e => { });
  }

  getMoreAssignList = () => {
    let { inspectId, assignPageParams: { hasMore, offset, list } } = this.state;
    if (!hasMore) { return; }

    let newOffset = offset + limit;

    getAssignList(inspectId, newOffset, limit).then(listResp => {
      const { data: { entries, total } } = listResp;

      this.setState({
        assignPageParams: {
          list: list.concat(entries),
          total: total,
          limit: limit,
          offset: newOffset,
          hasMore: this.hasmore(entries),
        }
      });
    }).catch(e => { });
  }


  getNewPraiseList = (inspectId: number) => {
    let offset = 0;
    getPraiseList(inspectId, offset, limit).then(listResp => {
      const { data: { entries, total } } = listResp;

      this.setState({
        praisePageParams: {
          list: entries,
          total: total,
          limit: limit,
          offset: offset,
          hasMore: this.hasmore(entries),
        }
      });
    }).catch(e => { });
  }

  getMorePraiseList = () => {
    let { inspectId, praisePageParams: { hasMore, offset, list } } = this.state;
    if (!hasMore) { return; }
    let newOffset = offset + limit;

    getPraiseList(inspectId, newOffset, limit).then(listResp => {
      const { data: { entries, total } } = listResp;

      this.setState({
        praisePageParams: {
          list: list.concat(entries),
          total: total,
          limit: limit,
          offset: newOffset,
          hasMore: this.hasmore(entries),
        }
      });
    }).then(e => { });
  }


  getNewShareList = (inspectId: number) => {
    let offset = 0;
    getShareList(inspectId, offset, limit).then(listResp => {
      const { data: { entries, total } } = listResp;

      this.setState({
        sharePageParams: {
          list: entries,
          total: total,
          limit: limit,
          offset: offset,
          hasMore: this.hasmore(entries),
        }
      });
    }).catch(e => { });
  }

  getMoreShareList = () => {
    let { inspectId, sharePageParams: { hasMore, offset, list } } = this.state;
    if (!hasMore) { return; }
    let newOffset = offset + limit;

    getShareList(inspectId, newOffset, limit).then(listResp => {
      const { data: { entries, total } } = listResp;

      this.setState({
        sharePageParams: {
          list: list.concat(entries),
          total: total,
          limit: limit,
          offset: newOffset,
          hasMore: this.hasmore(entries),
        }
      });
    });
  }

  navHandle = (item: InspectDetail) => {
    Taro.openLocation({
      longitude: item.longitude,
      latitude: item.latitude
    })
  }

  onBackHandle = () => {
    const { share } = this.$router.params;
    //判断pages栈是不是只有当前页面
    const pages = Taro.getCurrentPages();

    if (share || pages.length == 1) {
      Taro.switchTab({
        url: '/pages/work_circle/index'
      });
    } else {
      Taro.navigateBack({});
    }
  }

  onUserHandle = (type: number) => {
    const { inspectDetail } = this.state;
    if (!inspectDetail) {
      return;
    }
    let url = `./users?inspectId=${inspectDetail.id}&type=${type}`;
    if (type == 1) {
      url += `&partner=${inspectDetail.partner}`
    }
    Taro.navigateTo({
      url
    })
  }

  /**
   * 影响分析跳转
   */
  impactHandle = (type: number) => {
    const { inspectDetail } = this.state;
    if (!inspectDetail) {
      return;
    }

    let path: string = '';
    if (type == 1) {
      //影响分析
      path = `impact-analysis?inspectId=${inspectDetail.id}&title=${encodeURIComponent('影响分析')}`
    } else {
      //专车异常报告
      if (inspectDetail.eventId) {
        path = `/meijing-spcar-user-web/#/errorEvent/${inspectDetail.eventId}?title=${encodeURIComponent('专车异常报告')}`
      }
    }

    if (path == '') {
      return;
    }

    Taro.navigateTo({
      url: '/common/pages/webview/index?url=' + encodeURIComponent(path)
    });
  }

  /**
   * 点赞
   * @param inspectInfo 事件信息
   * @param index 事件在列表中的索引
   */
  praise() {
    const { inspectDetail } = this.state;
    if (!inspectDetail || inspectDetail.praised) {
      return;
    }
    praise(inspectDetail.id).then(() => {
      inspectDetail.praised = true;

      this.setState({
        inspectDetail: inspectDetail
      });
    }).catch(e => { });
  }

  /**
   * 督查
   */
  onSupervise() {
    const { inspectDetail } = this.state;
    if (!inspectDetail || inspectDetail.supervise) {
      return;
    }
    this.setState({
      isSuperviseTipShow: true,
    });
  }

  onSuperviseTipCancel() {
    this.setState({
      isSuperviseTipShow: false,
    });
  }

  onSuperviseTipConfirm() {
    const { inspectDetail } = this.state;
    if (!inspectDetail || inspectDetail.supervise) {
      return;
    }

    supervise(inspectDetail.id).then(() => {
      inspectDetail.supervise = true;
      this.setState({
        inspectDetail: inspectDetail
      });
    }).catch(e => {
    });

    this.setState({
      isSuperviseTipShow: false,
    });

  }


  render() {
    const { inspectDetail, tabId, replyPageParams, assignPageParams, praisePageParams,
      sharePageParams, viewPageParams, canAssign } = this.state;
    const { systemInfoStore, userStore: { userDetails } } = this.props;

    if (!inspectDetail) {
      return <View className='content'></View>
    }

    const hasSupervisePermission: boolean = get(inspectDetail, 'type') == InspectInfoType.INCIDENT
      && isAnyRole(userDetails.roles, [SUPERVISOR, ADMINISTRATOR, LEADER]);


    let voiceLink = (inspectDetail && inspectDetail.voiceLink) || '';

    let tabsData = [{ id: 1, name: `回复(${replyPageParams.total})` }, { id: 2, name: `指派(${assignPageParams.total})` }, { id: 3, name: `点赞(${praisePageParams.total})` }, { id: 4, name: `分享(${sharePageParams.total})` }];

    const showEmpty = (<View className='empty'><EmptyHolder text='暂无数据' /></View>)

    const statusBarHeight = get(systemInfoStore, "systemInfo.statusBarHeight", 22);

    let partnerStrArray: string[] = [];
    if (inspectDetail && inspectDetail.partner && inspectDetail.partner.length > 0) {
      let partnerArray: SimpleUser[] = JSON.parse(inspectDetail.partner);
      partnerStrArray = partnerArray.map(item => {
        return item.name;
      });
    }

    let inspectTypeStr = inspectTypeText(inspectDetail && inspectDetail.type || InspectInfoType.INCIDENT, inspectDetail && inspectDetail.supervise || false);

    const hasEvent: boolean = inspectDetail && inspectDetail.eventId && inspectDetail.eventId > 0 ? true : false;
    const hasImpactData: boolean = inspectDetail && inspectDetail.impactAnalysisData && inspectDetail.type == InspectInfoType.INCIDENT ? true : false;

    const disposalList: any[] = replyPageParams.list.filter(item => item.replyType == 'DISPOSAL');
    const lastDisposalReplyId: number = disposalList && disposalList.length > 0 ? disposalList[0].id : 0;

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
                {
                  inspectDetail.pollutionTypeId>0 && pollutionsImg[inspectDetail.pollutionTypeId - 1] &&
                  <Image className='imageItem' src={`${rootSourceBaseUrl}/assets/works/${pollutionsImg[inspectDetail.pollutionTypeId - 1]}.png`} />
                }
                <Text className='pollutionSourceTitle'>{inspectDetail.pollutionTypeName || ''}</Text>
              </View>
              {/* <Text className='yxfxButton' onClick={this.yxfx.bind(this)}>查看影响分析></Text> */}
            </View>
          }

          <View className='contentItem contentAndVoiceView splitBorderBottom'>
            <View className='contentView'>
              <Text className='inspectType'>{inspectTypeStr}</Text>
              <SimpleRichView class-name='' content={inspectDetail && inspectDetail.content || ''} onAtClick={this.atClick.bind(this)} onTagClick={this.tagClick.bind(this)} />
            </View>
            {voiceLink.length > 0 &&
              <View className='voiceView'>
                <RecorderPlay class-name="voice" duration={inspectDetail.voiceDuration || 0} path={voiceLink} />
              </View>
            }
          </View>

          <View className='contentItem contentItemList'>
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
              <Text className='propertyValue'>{inspectDetail.anonymous ? '匿名用户' : (inspectDetail.sourceName || inspectDetail.reportUserName || '')}</Text>
            </View>

            <View className='propertyItem' onClick={this.onUserHandle.bind(this, 1)}>
              <Image className='propertyIcon' src={`${rootSourceBaseUrl}/assets/works/pedestrian.png`} />
              <Text className='propertyName'>同行人</Text>
              <Text className='propertyValue'>{partnerStrArray.join('，')}</Text>
            </View>

            {
              inspectDetail.type == InspectInfoType.INCIDENT &&
              <View className='propertyItem'>
                <Image className='propertyIcon' src={`${rootSourceBaseUrl}/assets/works/zhifa.png`} />
                <Text className='propertyName'>是否需要行政执法</Text>
                <Text className='propertyValue'>{inspectDetail.enforcementLaw ? '是' : '否'}</Text>
              </View>
            }


            <View className='propertyItem' onClick={this.onUserHandle.bind(this, 2)}>
              <Image className='propertyIcon' src={`${rootSourceBaseUrl}/assets/works/eye.png`} />
              <Text className='propertyName'>浏览记录 ({viewPageParams.total}）</Text>
              <View className='photos'>
                {
                  viewPageParams.list.slice(0, 5).map(data => {
                    return <AtAvatar key={data.id} className='avatar' circle image={`${getUserAvatarUrl(data.userId)}`} />
                  })
                }
              </View>
            </View>

          </View>

          {
            (hasImpactData || hasEvent) &&
            <View className='impactView'>
              {
                hasImpactData &&
                <View className='itemView' onClick={this.impactHandle.bind(this, 1)}>
                  <Image className='icon' src={`${rootSourceBaseUrl}/assets/works/impact_icon.png`} />
                  <Text className='text'>事件影响分析</Text>
                </View>
              }
              {
                hasImpactData && hasEvent &&
                <View className='split'>
                </View>
              }
              {
                hasEvent &&
                <View className='itemView' onClick={this.impactHandle.bind(this, 2)}>
                  <Image className='icon' src={`${rootSourceBaseUrl}/assets/works/event_icon.png`} />
                  <Text className='text'>专车异常报告</Text>
                </View>
              }
            </View>
          }


          <View className='splitView'></View>

          <View className='tabs'>
            <FilterTabs isMore={false}
              data={tabsData}
              tabId={tabId}
              onMore={() => { }}
              onTab={this.tabChoose.bind(this)} />
          </View>

          {
            tabId == 1 &&
            <View className='behaviorList'>
              {
                replyPageParams.list.length == 0 ?
                  showEmpty :
                  replyPageParams.list.map(inspectReplyInList => {
                    return (
                      <View key={inspectReplyInList.id} className='operateItem'>
                        <View className='personalInfo'>
                          <AtAvatar className='avatar' circle image={`${getUserAvatarUrl(inspectReplyInList.userId)}`} />
                        </View>
                        <View className='operateContent'>
                          <View className='nameAndTime'>
                            <View className='nameAndStatus'>
                              <Text className='name'>{inspectReplyInList.userName}</Text>
                              {
                                inspectDetail.type == InspectInfoType.INCIDENT && inspectReplyInList.replyType == 'DISPOSAL' &&
                                <Text className={inspectDetail.status && lastDisposalReplyId == inspectReplyInList.id ? 'replyStatus' : 'replyStatus gray'}>完成处置</Text>
                              }
                            </View>
                            <Text className='time'>
                              {moment(inspectReplyInList.createTime).format('MM/DD HH:mm')}
                            </Text>
                          </View>
                          <View className='contentItem pd'>
                            {inspectReplyInList.voiceLink &&
                              <RecorderPlay class-name="voice" duration={inspectReplyInList.voiceDuration || 0} path={inspectReplyInList.voiceLink} />
                            }
                          </View>
                          <View className='replyContent'>
                            <SimpleRichView class-name='' content={inspectReplyInList.content} onAtClick={this.atClick.bind(this)} onTagClick={this.tagClick.bind(this)} />
                          </View>
                          <View className='images'>
                            {
                              inspectReplyInList.pictureLinks && inspectReplyInList.pictureLinks.length > 0
                              && inspectReplyInList.pictureLinks.map(link => {
                                return <Image key={link} className='img' src={link} mode='aspectFill' onClick={this.showBigImage.bind(this, inspectReplyInList.pictureLinks)} />
                              })
                            }
                          </View>
                        </View>
                      </View>
                    )
                  })
              }
            </View>
          }

          {
            tabId == 2 &&
            <View className='behaviorList'>
              {
                assignPageParams.list.length == 0 ?
                  showEmpty :
                  assignPageParams.list.map(data => {
                    return (
                      <View key={data.id} className='operateItem'>
                        <View className='personalInfo'>
                          <AtAvatar className='avatar' circle image={`${getUserAvatarUrl(data.userId)}`} />
                        </View>
                        <View className='operateContent share'>
                          <View className='nameAndTime'>
                            <Text className='name'>{data.userName}</Text>
                            <Text className='time'>
                              {moment(data.createTime).format('MM/DD HH:mm')}
                            </Text>
                          </View>
                          <View className='behaviorContent'>{data.description}</View>
                        </View>
                      </View>
                    )
                  })
              }
            </View>
          }


          {
            tabId == 3 &&
            <View className='behaviorList'>
              {
                praisePageParams.list.length == 0 ?
                  showEmpty :
                  praisePageParams.list.map(data => {
                    return (
                      <View key={data.id} className='operateItem'>
                        <View className='personalInfo'>
                          <AtAvatar className='avatar' circle image={`${getUserAvatarUrl(data.userId)}`} />
                        </View>
                        <View className='operateContent share'>
                          <View className='nameAndTime'>
                            <Text className='name'>{data.userName}</Text>
                            <Text className='time'>
                              {moment(data.createTime).format('MM/DD HH:mm')}
                            </Text>
                          </View>
                          <View className='behaviorContent'>参与了点赞</View>
                        </View>
                      </View>
                    )
                  })
              }
            </View>
          }


          {
            tabId == 4 &&
            <View className='behaviorList'>
              {sharePageParams.list.length == 0 ?
                showEmpty :
                sharePageParams.list.map(data => {
                  return (
                    <View key={data.id} className='operateItem'>
                      <View className='personalInfo'>
                        <AtAvatar className='avatar' circle image={`${getUserAvatarUrl(data.userId)}`} />
                      </View>
                      <View className='operateContent share'>
                        <View className='nameAndTime'>
                          <Text className='name'>{data.userName}</Text>
                          <Text className='time'>
                            {moment(data.createTime).format('MM/DD HH:mm')}
                          </Text>
                        </View>
                        <View className='behaviorContent'>分享了该事件</View>
                      </View>
                    </View>
                  )
                })
              }
            </View>
          }
        </ScrollView>

        {
          inspectDetail && hasSupervisePermission &&
          <Image className='superviseButton' onClick={this.onSupervise.bind(this)} src={inspectDetail.supervise ? supervisedIcon : superviseIcon} />
        }

        <AtModal isOpened={this.state.isSuperviseTipShow} className='modelStyle'>
          <AtModalHeader>
            <View className='model_body'>确认督查?</View>
          </AtModalHeader>
          <AtModalAction>
            <Button onClick={this.onSuperviseTipCancel}>
              <View className='model_cancel'>取消</View>
            </Button>
            <Button onClick={this.onSuperviseTipConfirm}>
              <View className='model_confirm'>确定</View>
            </Button>
          </AtModalAction>
        </AtModal>

        <View className='perateButtonView'>
          <View className='left'>
            <View className='buttonView' onClick={this.praise.bind(this)}>
              <Image className='icon' src={inspectDetail.praised ? praisedIcon : praiseIcon} />
              <Text className='text'>点赞</Text>
            </View>
            <Button plain={true} className='buttonView shareButton' open-type="share">
              <Image className='icon' src={shareIcon} />
              <Text className='text'>分享</Text>
            </Button>
            <View className='buttonView' onClick={this.assign.bind(this)}>
              <Image className='icon' src={canAssign ? assignIcon : cantAssignIcon} />
              <Text className={canAssign ? 'text' : 'gray_text'}>指派</Text>
            </View>
          </View>

          <View className='right'>
            <View className='buttonView' onClick={this.reply.bind(this)}>
              <Image className='icon' src={replyIcon} />
              <Text className='text'>回复</Text>
            </View>
          </View>

        </View>

      </View>
    )
  }
}
