import Taro, { Component, Config, uma } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import ListView from "@common/components/ListView/index";
import EmptyHolder from '@common/components/EmptyHolder';
import './index.scss'
import { rootConstructionSourceBaseUrl } from '@common/utils/requests';
import { constructionToDoTasksList, checkRecordToday } from "../../service/home";
import Event from "./components/Event/index";
import TopBar from "@common/components/TopBar";
import { UserDetails, UserStore } from "@common/store/user";

const naoZhongImage = `${rootConstructionSourceBaseUrl}/assets/pages/statistics/naozhong.png`;

interface IndexProps {
  userStore: UserStore;
}

interface IndexState {
  hasMore: boolean;
  hasData: boolean;
  isLoading: boolean;
  list: any[],
  query: {
    limit: number,
    offset: number
  },
  inspectionReportBoolean: boolean;
}

@inject('userStore')
@observer
export default class Index extends Component<IndexProps, IndexState> {
  config: Config = {
    navigationStyle: "custom"
  }
  constructor(props) {
    super(props)
    this.state = {
      hasMore: true,
      hasData: true,
      isLoading: true,
      list: [],
      query: {
        limit: 10,
        offset: 0
      },
      inspectionReportBoolean: false
    }
  }

  componentDidMount() {
    Taro.authorize({
      scope: 'scope.camera',
    })
    Taro.authorize({
      scope: 'scope.userLocation',
    })
  }

  // 获取数据
  fetchList = async (callback?: any) => {
    try {
      const { query: { limit, offset }, list } = this.state;
      const result = await constructionToDoTasksList(offset, limit);
      const { data: { entries } } = result;
      this.setState({
        list: list.concat(entries),
        isLoading: false,
        hasMore: entries.length == limit,
        query: {
          limit: 10,
          offset: entries.length + offset
        },
        hasData: !(list.length === 0 && entries.length === 0)
      }, () => {
        callback && callback();
      });
    } catch (err) {
      callback && callback(err);
      console.log(err);
    }
  }

  componentWillUnmount() { }

  componentDidShow() {
    this.props.userStore.getConstructionSiteInfo((userDetails:UserDetails) => {
      this.fetchList();
      checkRecordToday(userDetails.tenantUser.userId).then(res => {
        this.setState({
          inspectionReportBoolean: res.data
        })
      })
    }, () => {
      this.setState({
        isLoading: false,
        hasData: false
      })
    }) 
    uma.trackEvent('test', { name: '测试' });
  }

  componentDidHide() { }

  // 刷新操作
  onRefresh = () => {
    this.fetchNewList();
    Taro.stopPullDownRefresh()
  }

  fetchNewList = () => {
    this.setState({
      hasMore: true,
      list: [],
      query: {
        limit: 10,
        offset: 0
      }
    }, this.fetchList)
  }

  jumpToMyselefReport() {
    Taro.navigateTo({
      url: "/pages/work_options/inspection_report"
    });
  }

  onCloseInfo(e){
    e.stopPropagation()
    this.setState({
      inspectionReportBoolean: false
    });
  }

  render() {
    const { list, hasMore, hasData, isLoading, inspectionReportBoolean } = this.state;
    const { tenant } = this.props.userStore.userDetails;
    const showEmpty = (<View className='empty'><EmptyHolder text='暂无相关任务' /></View>);
    return (
      <View className='index-page'>
        <TopBar title={tenant && tenant.name} background={'#fff'} color={'#0a2463'} backVisible={false} />
        <View className="head" >
          <View className="title">待办任务</View>
          {
            inspectionReportBoolean && (
              <View className="info" onClick={this.jumpToMyselefReport}>
                <Image className="img" src={naoZhongImage}></Image>
                <Text className="title-center">您有一条【自查上报】还没有提交，马上去提交</Text>
                <View className='at-icon at-icon-close' onClick={this.onCloseInfo.bind(this)}></View>
              </View>
            )
          }
        </View>
        <ListView
          com-class='event-body'
          hasMore={hasMore}
          hasData={hasData}
          showLoading={isLoading}
          onRefresh={this.onRefresh}
          onEndReached={this.fetchList}
        >
          {
            hasData ? list.map((item, index) => <Event event={item} key={item.inspectId + index}></Event>) : showEmpty
          }
        </ListView>
      </View>
    )
  }
}
