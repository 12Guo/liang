import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import ListView from "@common/components/ListView";
import EmptyHolder from '@common/components/EmptyHolder';
import DispatchInfo from "./component/dispatchInfo";
import './dispatch_list.scss'
import { rootConstructionSourceBaseUrl } from '@common/utils/requests';

// 调度响应
const dispatchImg = rootConstructionSourceBaseUrl + "/assets/pages/green-construction/dispatch.png";

interface IndexProps {
  userStore: any;
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
}

@inject('userStore')
@observer
export default class Index extends Component<IndexProps, IndexState> {
  config: Config = {
    navigationBarTitleText: "调度响应"
  }
  constructor(props) {
    super(props)
    this.state = {
      hasMore: true,
      hasData: true,
      isLoading: true,
      list: [1, 2],
      query: {
        limit: 10,
        offset: 0
      },
    }
  }

  // 获取数据
   fetchList = async (callback?:any) => {
    // try {
    //   const { query: {limit, offset}, list } = this.state;
    //   const result = await constructionToDoTasksList(offset, limit);
    //   const { data: { entries } } = result;
    //   this.setState({
    //     list: list.concat(entries),
    //     isLoading: false,
    //     hasMore: entries.length == limit,
    //     query: {
    //       limit: 10,
    //       offset: entries.length + offset
    //     },
    //     hasData: !(list.length === 0 && entries.length === 0)
    //   }, () => {
    //     callback && callback();
    //   });
    // } catch (err) {
    //   callback && callback(err);
    //   console.log(err);
    // }

    try{
        const { list } =this.state;
        this.setState({
            list: list.concat(list),
            isLoading: false,
            hasMore: true,
            hasData: true
        })
    } catch (err) {
        console.log(err);
    }
  }

  componentWillUnmount() { }

  componentDidShow() {
    this.fetchList();
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
    }, () => {
        this.fetchList();
    })
  }

  jumpToMyselefReport(){
    Taro.navigateTo({
      url: "/pages/work_options/inspection_report"
    });
  }

  render() {
    const { list, hasMore, hasData, isLoading, } = this.state;
    const showEmpty = (<View className='empty'><EmptyHolder text='暂无相关任务' /></View>);
    return (       
        <ListView
            com-class='dispatch-list'
            hasMore={hasMore}
            hasData={hasData}
            showLoading={isLoading}
            onRefresh={this.onRefresh}
            onEndReached={this.fetchList}
        >
        {
            hasData ? list.map(item => <DispatchInfo />) : showEmpty
        }
        </ListView>
    )
  }
}
