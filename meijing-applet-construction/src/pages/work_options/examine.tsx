import Taro, { Component, Config } from '@tarojs/taro'
import { View, Button } from '@tarojs/components'
import FilterTabs, { FilterTabsType } from '@common/components/FilterTabs'
import ListView from '@common/components/ListView'
import { observer, inject } from '@tarojs/mobx';
import { getPageData } from '@common/utils/common';
import { sentryInspects, delSentryInspects } from '../../service/home'
import EventItem from '@common/components/FbiItems/EventItem'
import EmptyHolder from '@common/components/EmptyHolder'
import isEmpty from 'lodash/isEmpty'
import { AtSwipeAction, AtModal, AtModalContent, AtModalAction } from "taro-ui"
import './examine.scss'
import get from 'lodash/get';

interface ExamineProps {
  userStore: any;
}

interface ExamineState {
  list: any[];
  paramQuery: {
    offset: number,
    limit: number,
    flag: number,
    userDivisionCode: string
  },
  tabId: number,
  isInit: boolean,
  isLoading: boolean,
  hasMore: boolean,
  currentSelectItem: any,
  isTipShow: boolean,
}

const tabTypes: number[] = [0, 1];

@inject('userStore')
@observer
export default class Examine extends Component<ExamineProps, ExamineState> {

  config: Config = {
    navigationBarTitleText: '事件审核'
  }

  constructor(props) {
    super(props)
    const { userStore: { userDetails } } = props
    this.state = {
      list: [],
      paramQuery: {
        flag: 0,
        offset: 0,
        limit: 10,
        userDivisionCode: get(userDetails, 'divisionCode')
      },
      tabId: 0,
      isInit: true,
      hasMore: true,
      isLoading: true,
      currentSelectItem: {},
      isTipShow: false
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
      list: [],
      currentSelectItem: {},
      isTipShow: false
    }, () => {
      this.fetchList();
    })
  }

  // 获取列表
  fetchList = (callback?: any) => {
    const { paramQuery, isInit, list } = this.state;
    sentryInspects(paramQuery).then(res => {
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

  tabChoose(item: FilterTabsType) {
    const { paramQuery } = this.state
    this.setState({
      tabId: Number(item.id),
      paramQuery: {
        ...paramQuery,
        offset: 0,
        flag: tabTypes[item.id],
      },
      list: [],
      isInit: true,
      isLoading: true,
      hasMore: true
    }, this.fetchList);
  }

  // 滑动item
  handleSingle = (event) => {
    this.setState({ currentSelectItem: event })
  }

  // 选择
  onEvent = () => {
    this.setState({ isTipShow: true })
  }

  // 取消删除
  handleCancel = () => {
    this.setState({ isTipShow: false, currentSelectItem: {} })
  }

  // 删除操作
  handleDelete = () => {
    this.setState({ isTipShow: false }, () => {
      const { currentSelectItem } = this.state
      delSentryInspects(currentSelectItem.id).then(res => {
        this.onRefresh()
      })
    })
  }

  componentDidShow() {
    const { refresh } = getPageData();
    if (refresh) {
      this.onRefresh()
    }
  }

  render() {
    const { tabId, hasMore, list, isLoading, currentSelectItem, isTipShow } = this.state
    let isEmptyData = !list || list.length == 0;
    const showEmpty = (<View className='empty'><EmptyHolder text='暂无数据' /></View>)
    const showList = list.map(item => (
      tabId ? <EventItem key={item.id} data={item} dataType={tabId} /> :
        <AtSwipeAction
          key={item.id}
          options={[{ text: '删除', style: { backgroundColor: '#E84D4D' } }]}
          onOpened={this.handleSingle.bind(this, item)}
          onClosed={this.handleSingle.bind(this, {})}
          isOpened={!isEmpty(currentSelectItem) && currentSelectItem.id === item.id && tabId === 0}
          onClick={this.onEvent.bind(this, item)}
        >
          <EventItem data={item} dataType={tabId} />
        </AtSwipeAction>
    ));

    return (
      <View className='examine-page'>
        <View className='topTabView'>
          <View className='tabs'>
            <FilterTabs isMore={false}
              data={[{ id: 0, name: '待审核' }, { id: 1, name: '审核通过' }]}
              tabId={tabId}
              onMore={() => { }}
              onTab={this.tabChoose.bind(this)} />
          </View>
        </View>

        {/* 列表展示部分 */}
        <ListView
          com-class='body'
          hasMore={hasMore}
          hasData={!isEmpty(list)}
          showLoading={isLoading}
          onRefresh={this.onRefresh}
          onEndReached={this.fetchList}
        >
          {isEmptyData ? showEmpty : showList}
        </ListView>

        <AtModal isOpened={isTipShow} className='modelStyle'>
          <AtModalContent>
            <View className='model_body' style={{ textAlign: 'center', marginTop: '20PX', fontSize: '16PX' }}>确认删除该事件？</View>
          </AtModalContent>
          <AtModalAction>
            <Button onClick={this.handleCancel}>
              <View className='model_cancel'>取消</View>
            </Button>
            <Button onClick={this.handleDelete}>
              <View className='model_confirm'>确定</View>
            </Button>
          </AtModalAction>
        </AtModal>
      </View>
    )
  }
}