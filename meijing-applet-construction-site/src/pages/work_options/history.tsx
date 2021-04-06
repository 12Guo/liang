import Taro, { Component, Config } from '@tarojs/taro'
import { View, Block, Text, Image } from '@tarojs/components'
import ListView from '@common/components/ListView'
import { observer, inject } from '@tarojs/mobx';
import { historyPatrolList } from '../../service/home'
import { SimpleRichView } from "@common/components/rich-text"
import EmptyHolder from '@common/components/EmptyHolder'
import isEmpty from 'lodash/isEmpty';
import moment from "moment";
import './history.scss'

interface HistoryProps {
  userStore: any;
}

interface HistoryState {
  list: any[];
  paramQuery: {
    offset: number,
    limit: number,
  },
  tabId: number,
  isInit: boolean,
  isLoading: boolean,
  hasMore: boolean,
}

@inject('userStore')
@observer
export default class History extends Component<HistoryProps, HistoryState> {

  config: Config = {
    navigationBarTitleText: '历史记录'
  }

  constructor(props) {
    super(props)
    this.state = {
      list: [],
      paramQuery: {
        offset: 0,
        limit: 10,
      },
      tabId: 0,
      isInit: true,
      hasMore: true,
      isLoading: true,
    }
  }

  componentDidMount() {
    this.fetchList()
  }


  /**
   * 刷新操作
   */
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

  // 获取列表
  fetchList = (callback?: any) => {
    const { paramQuery, isInit, list } = this.state;
    historyPatrolList({ ...paramQuery }).then(res => {
      const { data: { entries = [] } } = res;
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
          offset: paramQuery.offset + paramQuery.limit
        }
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

  // 去事件详情
  jumpToDetail(inspectId){
    Taro.navigateTo({ url: "/pages/works/detail?inspectId=" + inspectId });
  }

  render() {
    const { hasMore, list, isLoading } = this.state
    let isEmptyData = isEmpty(list);
    const showEmpty = (<View className='empty'><EmptyHolder text='暂无数据' /></View>)
    const showInspectList = list.map((inspect, index) => {
      return (
        <Block key={inspect.id}>
          {index > 0 ? <View className='splitView'></View> : ''}
          {
            <View className='workItem' onClick={this.jumpToDetail.bind(this, inspect.inspectId)}>
              <View className='image'>
                {
                  inspect.pictureLinks && inspect.pictureLinks.length > 0 &&
                  <Image key={inspect.pictureLinks[0]} className='imageItem' src={inspect.pictureLinks[0]} mode='aspectFill' />
                }
              </View>

              <View className='contentAndTime'>
                <View className='content'>
                  <SimpleRichView class-name='' content={inspect.content} />
                </View>
                <View className='timeAndOperate'>
                  <Text className='time'>
                    {moment(inspect.createTime).format('MM/DD HH:mm')}
                  </Text>
                </View>
              </View>

            </View>
          }
        </Block>
      );
    });

    return (
      <View className='history-page'>
        {/* 列表展示部分 */}
        <ListView
          com-class='body'
          hasMore={hasMore}
          hasData={!isEmpty(list)}
          showLoading={isLoading}
          onRefresh={this.onRefresh}
          onEndReached={this.fetchList}
        >
          {isEmptyData ? showEmpty : showInspectList}
        </ListView>
      </View>
    )
  }
}