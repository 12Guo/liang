import Taro, { Component, Config } from '@tarojs/taro'
import { View, Image, Text, Block } from '@tarojs/components'
import './index.scss'
import ListView from '@common/components/ListView'
import EmptyHolder from '@common/components/EmptyHolder'
import { observer, inject } from '@tarojs/mobx'
import { UserStore, UserDetails } from '@common/store/user'
import { inspectRankList as getInspectRankList } from '../../service/inspectRank'
import isEmpty from 'lodash/isEmpty'
import moment from 'moment'
import { getCurrentPage } from '@common/utils/common';


const InspectRankTypes:any[] = [
  {code: 'WEEKLY', name: '周榜'},
  {code: 'MONTHLY', name: '月榜'},
  {code: 'QUARTERLY', name: '季度榜'},
  {code: 'ANNUAL', name: '年度榜'},
  {code: 'EXCLUSIVE', name: '专属榜'},
]; 


interface InspectRankProps {
  userStore: UserStore;
}

interface InspectRankState {
  rankTypeCode: string,
  /**
   * 事件列表
   */
  inspectRanks: any[],
  /**
   * 当前第几页
   */
  offset: number;
  /**
   * 每页显示数量
   */
  limit: number;
  /**
   * 列表是否可以加载更多（优化）
   */
  hasMore: boolean,
  
  /**
     * 是否正在加载数据
     */
    isLoading: boolean,
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
    this.state = {
      rankTypeCode: 'WEEKLY',
      offset: 0,
      limit: 10,
      hasMore: true,
      inspectRanks: [],
      isLoading: true,
    };
  }

  componentDidMount() {
    this.getNewInspectRankList();
  }

  componentDidShow() {
  }


  /**
     * 获取更多事件列表
     */
    getMoreInspectRankList = (callback) => {
      const { limit, offset, hasMore, rankTypeCode, inspectRanks } = this.state;
      if (!hasMore) { return; }

      let newOffset = offset + limit;

      const params = {
          type: rankTypeCode,
          offset: newOffset,
          limit,
      }

      getInspectRankList(params).then(resp => {
          const { data: { entries } } = resp;
          this.setState({
              inspectRanks: inspectRanks.concat(entries),
              offset: newOffset,
              hasMore: limit == entries.length,
              isLoading: false
          }, () => {
              if (callback) {
                  callback();
              }
          });
      }).catch(res => {
          if (callback) {
              callback();
          }
      });
  }

  /**
   * 获取最新事件列表
   */
  getNewInspectRankList = () => {
      const { limit, rankTypeCode } = this.state;
      let offset = 0;

      const params = {
          type: rankTypeCode,
          offset,
          limit,
      }

      getInspectRankList(params)
      .then((resp) => {
          const { data: { entries } } = resp;

          this.setState({
              inspectRanks: entries,
              offset: offset,
              hasMore: limit == entries.length,
              limit: limit,
              isLoading: false
          }, () => {
              Taro.hideLoading();
          });
      }).catch(error => {
          Taro.showToast({
              title: "数据加载失败，请重试！",
              icon: 'none'
          })
      });
  }


  // 加载更多
  onScrollToLower = (callback) => {
      this.getMoreInspectRankList(callback);
  }

  //下拉刷新
  onScrollToUpper = () => {
      this.getNewInspectRankList();
  }

  //加载更多
  onPullDownRefresh() {
      this.getNewInspectRankList();
      Taro.stopPullDownRefresh();
  }


  /**
   * 事件详情
   * @param inspctId  事件id
   */
  detail(name:string ,url: string) {
    let page = getCurrentPage();
    let pageData = page.data;

    pageData['rankUrl'] = url;
    page.setData(pageData);

    Taro.navigateTo({
      url: `./detail?name=${name}`
    })
  }

  tabClick = (rankTypeCode:string) => {
    
    if(this.state.rankTypeCode == rankTypeCode){
      return;
    }
    this.setState({
      rankTypeCode
    }, () => {
      this.getNewInspectRankList();
    });
  }

  render() {
    const { rankTypeCode, isLoading, inspectRanks, hasMore,  } = this.state;

    const isEmptyData = !inspectRanks || inspectRanks.length == 0;

    const showEmpty = (<View className='empty'><EmptyHolder text='暂无排名' /></View>)

    const showInspectRankList = inspectRanks.filter(inspectRank => {
      return inspectRank.pictureLinks && inspectRank.pictureLinks.length > 0 
      && inspectRank.realPictureLinks && inspectRank.realPictureLinks.length > 0;
    }).map((inspectRank, index) => {
      return (
        <Block key={inspectRank.id}>
          <View className='rankItem' onClick={this.detail.bind(this, inspectRank.name, inspectRank.realPictureLinks[0])}>
            <View className='image'>
              <Image key={inspectRank.pictureLinks[0]} className='imageItem' src={inspectRank.pictureLinks[0]} mode='aspectFill' />
            </View>
            <View className='nameAndTime'>
              <Text className='name'>{inspectRank.name}</Text>
              <View className='time'>
                  <View className='clock'></View>
                  <Text className='txt'>
                    {moment(inspectRank.startTime).format('YYYY/MM/DD')}~{moment(inspectRank.endTime).format('MM/DD')}
                  </Text>
              </View>
            </View>
          </View>
        </Block>
      )})


    return (
      <View className='content'>
        <View className='top'>
          <View className='topMiddle'>
            <Text className='txt'>环保先锋榜</Text>
          </View>

          <View className='tabs'>
          {
            InspectRankTypes.map((rankType)=> {
              return (
                <View key={rankType.code} className={rankTypeCode == rankType.code ? 'tab choosed':'tab'} onClick={this.tabClick.bind(this, rankType.code)}>
                  {rankType.name}
                </View>
              )
            })
          }
          </View>
        </View>

        <ListView
          com-class='workListView'
          hasMore={hasMore}
          hasData={!isEmpty(inspectRanks)}
          onEndReached={this.onScrollToLower}
          onRefresh={this.onScrollToUpper}
          showLoading={isLoading}
        >
            {isEmptyData ? showEmpty : showInspectRankList}
        </ListView>
        
      </View>
    )
  }
}
