import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import { AtAvatar, AtModal } from 'taro-ui'
import { getUserJoinRequests, pass, reject, UserJoinRequest, UserJoinRequestStatus } from '../../service/userJoinRequests'
import { observer, inject } from '@tarojs/mobx';
import EmptyHolder from '@common/components/EmptyHolder'
import { getUserAvatarUrl } from '@common/utils/requests'

import './index.scss'

interface JoinRequestProps {
  userStore: any;
}

interface JoinRequestState {
  /**
   * 加入申请列表
   */
  joinRequestList: UserJoinRequest[],
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
   * 是否拒绝弹窗
   */
  isOpened: boolean;
  /**
   * 当前申请的Id
   */
  currentJoinId: number | null;
}

const limit = 10;

@inject('userStore')
@observer
export default class JoinRequest extends Component<JoinRequestProps, JoinRequestState> {

  config: Config = {
    navigationBarTitleText: '加入团队申请',
    navigationBarBackgroundColor: '#FFFFFF',
    navigationBarTextStyle: 'black',
    backgroundColor: '#FFFFFF',
    enablePullDownRefresh: true
  }

  constructor(props) {
    super(props)
    this.state = {
      offset: 0,
      limit: limit,
      hasMore: true,
      joinRequestList: [],
      isOpened: false,
      currentJoinId: null
    }
  }

  componentWillMount() {
    this.getNewList();
  }

  componentDidMount() {
  }

  componentDidShow() { 
    this.getNewList()
  }

  //下拉刷新
  onPullDownRefresh() {
    this.getNewList();
    Taro.stopPullDownRefresh();
  }

  // 加载更多
  onScrollToLower = () => {
    this.getMoreList();
  }

  //下拉刷新
  onScrollToUpper = () => {
    this.getNewList();
  }

  getNewList = async () => {
    let offset = 0;
    const resp = await getUserJoinRequests(offset, limit);
    const { data: { entries, total } } = resp;

    this.setState({
      joinRequestList: entries || [],
      offset: offset,
      hasMore: limit == entries.length && total > limit,
      limit: limit,
    });
  }

  getMoreList = async () => {
    const { limit, offset, hasMore, joinRequestList } = this.state;
    if (!hasMore) { return; }

    try {
      let newOffset = offset + limit;
      const resp = await getUserJoinRequests(newOffset, limit);

      const { data: { entries, total } } = resp;

      this.setState({
        joinRequestList: joinRequestList.concat(entries),
        offset: newOffset,
        hasMore: limit == entries.length && total > limit,
      });
    } catch (error) {
    }
  }

  async reject(id: number) {
    const { joinRequestList } = this.state;

    try {
      await reject(id);
    } catch (error) {
      return;
    }


    for (let i = 0; i < joinRequestList.length; i++) {
      if (joinRequestList[i].id == id) {
        joinRequestList[i].status = UserJoinRequestStatus.REJECT;
        break;
      }
    }

    this.setState({
      joinRequestList: joinRequestList,
    });
  }

  async agree(userinfo: UserJoinRequest) {
    Taro.navigateTo({
      url: `./agree?userInfo=${JSON.stringify(userinfo)}`
    })
    // const { joinRequestList } = this.state;

    // try {
    //   await pass(id);
    // } catch (error) {
    //   return;
    // }

    // for (let i = 0; i < joinRequestList.length; i++) {
    //   if (joinRequestList[i].id == id) {
    //     joinRequestList[i].status = UserJoinRequestStatus.PASS;
    //     break;
    //   }
    // }

    // this.setState({
    //   joinRequestList: joinRequestList,
    // });
  }

  handleCancel = () => {
    this.setState({ isOpened: false })
  }

  handleConfirm = () => {
    const { currentJoinId } = this.state
    this.setState({
      isOpened: false
    }, () => {
      currentJoinId && this.reject(currentJoinId)
    })
  }

  /**
   * 拒绝弹窗
   */
  showReject = (id: number) => {
    this.setState({
      isOpened: true,
      currentJoinId: id
    })
  }

  render() {
    const { joinRequestList = [], isOpened } = this.state;
    const isEmpty = joinRequestList && joinRequestList.length == 0;

    const showEmpty = (<View className='empty'><EmptyHolder text='暂无申请记录' /></View>)
    const showJoinRequestList = joinRequestList.map((jRequest) => {
      let maxWidth = UserJoinRequestStatus.CONFIRMING == jRequest.status ? 300 : 450;
      let departmentName = (jRequest.departmentName || jRequest.otherDepartment) ? ` | ${jRequest.departmentName || jRequest.otherDepartment}` : ''
      return (
        <View key={jRequest.id} className='list_item'>
          <View className='item_content'>
            <AtAvatar className='avatar' circle image={`${getUserAvatarUrl(jRequest.userId)}`} />
            <View className='user_info'>
              <Text className='username'>{jRequest.userName || ''}</Text>
              <Text className='phone'>{jRequest.phone}</Text>
              <Text className='department' style={{ maxWidth: Taro.pxTransform(maxWidth) }}>{jRequest.divisionName}{departmentName}</Text>
            </View>
            {
              UserJoinRequestStatus.CONFIRMING == jRequest.status ?
                (
                  <View className='reject_agree'>
                    <Button plain={true} className='reject_button' onClick={this.showReject.bind(this, jRequest.id)} >拒绝</Button>
                    <Button plain={true} className='agree_button' onClick={this.agree.bind(this, jRequest)}>同意</Button>
                  </View>
                )
                :
                (
                  <Text className='request_result'>{UserJoinRequestStatus.PASS == jRequest.status ? '已同意' : '已拒绝'}</Text>
                )
            }
          </View>
        </View>
      )
    });

    return (
      <View className='content'>
        <View className='top_back'></View>
        <ScrollView
          className='listView'
          scrollY
          scrollWithAnimation
          upperThreshold={50}
          onScrollToUpper={this.onScrollToUpper}
          lowerThreshold={50}
          onScrollToLower={this.onScrollToLower}
        >
          {
            isEmpty ? showEmpty : showJoinRequestList
          }
        </ScrollView>
        <AtModal
          isOpened={isOpened}
          className='myPop'
          cancelText='取消'
          confirmText='确认'
          onClose={this.handleCancel}
          onCancel={this.handleCancel}
          onConfirm={this.handleConfirm}
          content='确认拒绝？'
        />
      </View>
    )
  }
}
