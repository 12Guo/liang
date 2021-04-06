import Taro, { Component, Config } from '@tarojs/taro'
import { View, Image, Text, OfficialAccount, Block } from '@tarojs/components'
import './index.scss'
import { AtAvatar, AtList, AtListItem, AtBadge, AtIcon, AtModal } from 'taro-ui'
import { getMyEvents, Event } from '../../service/pollutantEvent';
import { observer, inject } from '@tarojs/mobx';
import { DivisionStatus } from '../../common/utils/divisionUtils'
import { DispatchStore } from '../../store/dispatch'
import { UserStore, UserDetails } from '../../common/store/user'
import { rootSourceBaseUrl, getUserAvatarUrl, rootConstructionSourceBaseUrl } from '@common/utils/requests'
import { isAdministrator, isSalesperson, ADMINISTRATOR } from '@common/utils/common'
import { 
  UserJoinRequestStatus, countByAdmin, administratorRequests, setAdministratorRequests, countBySalesperson, UserJoinRole
} from '../../service/userJoinRequests';
import cn from 'classnames';
import get from 'lodash/get';

interface MyProps {
  userStore: UserStore;
  dispatchStore: DispatchStore;
}

interface MyState {
  events: Event[],
  /**
   * 加入申请数量
   */
  joinRequestCount: number,
  /**
   * 销售人员申请数量
   */
  salespersonRequestCount: number,
  /**
   * 关注item切换状态
   */
  isFocus: boolean;
  userStatus: '' | 'PASS' | 'CONFIRMING' | 'REJECT' | "IS_ADMIN";
  isOpened: boolean;
}

const MAP_IMG = {
  IS_ADMIN: `${rootSourceBaseUrl}/assets/my/admin-3.png`,
  CONFIRMING: `${rootSourceBaseUrl}/assets/my/admin-2.png`,
  PASS: `${rootSourceBaseUrl}/assets/my/admin-3.png`,
}

const MyInspectsList = [
  { key: 'INCIDENT', title: '我的上报', img: `${rootSourceBaseUrl}/assets/my/wodeshangbao.png` },
  { key: 'INCIDENT_FINISHED', title: '我的处置', img: `${rootSourceBaseUrl}/assets/my/wodechuzhi.png` },
  { key: 'my-share', title: '我的分享', img: `${rootSourceBaseUrl}/assets/my/wodefengxiang.png` },
  { key: 'assign-and-at-me', title: '指派/@我', img: `${rootSourceBaseUrl}/assets/my/zhipaiwo.png` },
  { key: 'my-assign', title: '我的指派', img: `${rootSourceBaseUrl}/assets/my/wodezhipai.png` },
  { key: 'my-praise', title: '我的点赞', img: `${rootSourceBaseUrl}/assets/my/wodedianzan.png` },
  { key: 'stats', title: '统计导出', img: `${rootSourceBaseUrl}/assets/my/tongjidaochu.png` },
]

@inject('userStore', 'dispatchStore')
@observer
export default class Index extends Component<MyProps, MyState> {

  /**
   * 指定config的类型声明为: Taro.Config
   *
   * 由于 typescript 对于 object 类型推导只能推出 Key 的基本类型
   * 对于像 navigationBarTextStyle: 'black' 这样的推导出的类型是 string
   * 提示和声明 navigationBarTextStyle: 'black' | 'white' 类型冲突, 需要显示声明类型
   */
  config: Config = {
    navigationBarTitleText: '我的',
    navigationBarBackgroundColor: '#107EFF',
    navigationBarTextStyle: 'white',
    backgroundColor: '#107EFF',
    enablePullDownRefresh: true
  }

  constructor(props) {
    super(props);
    this.state = {
      events: [],
      joinRequestCount: 0,
      salespersonRequestCount: 0,
      isFocus: false,
      userStatus: '',
      isOpened: false
    };
  }

  componentDidMount() {
    this.getAdministratorRequests();
  }

  componentDidShow() {
    this.getJoinRequestCount();
  }

  //下拉刷新
  onPullDownRefresh() {
    const { userStore, dispatchStore } = this.props;
    userStore.getUserDetails((userDetails) => {
      userStore.getConstructionSiteInfo()
      if(userDetails.tenantUser !== null){
        this.getJoinRequestCount();
        this.getAdministratorRequests();
      } else {
        userStore.logout();
        Taro.redirectTo({ url: "/pages/login/login" });
      }
      Taro.stopPullDownRefresh();
      dispatchStore.clearData();
    });
  }

  /**
   * 获取用户申请管理员状态
   */
  getAdministratorRequests = async () => {
    try {
      const { userStore } = this.props;
      if(userStore.userDetails.roles && userStore.userDetails.roles.some(item => item.code === ADMINISTRATOR)){
        this.setState({
          userStatus: "IS_ADMIN"
        });
        return;
      }
      const currentUserStatus = this.state.userStatus;
      const result = await administratorRequests(ADMINISTRATOR)
      this.setState({
        userStatus: get(result, 'data.status', '')
      }, () => {
        const { userStatus } = this.state
        if (userStatus === 'PASS' && currentUserStatus != 'PASS') {
          userStore.getUserDetails()
        }
      })
    }
    catch (error) { console.log(error) }
  }

  /**
   * 查询加入申请数量
   */
  getJoinRequestCount = async () => {
    const { userStore: { userDetails } } = this.props;

    let administrator = isAdministrator(userDetails.roles);
    let salesperson = isSalesperson(userDetails.roles);

    if (salesperson) {
      try {
        const getSalespersonJoinRequestCountResp = await countBySalesperson(UserJoinRequestStatus.CONFIRMING);
        this.setState({
          salespersonRequestCount: getSalespersonJoinRequestCountResp.data || 0,
        });
      } catch (error) {
      }
    }
    if (administrator) {
      try {
        const getJoinRequestCountResp = await countByAdmin(UserJoinRequestStatus.CONFIRMING, userDetails.tenant.code);
        this.setState({
          joinRequestCount: getJoinRequestCountResp.data || 0,
        });
      } catch (error) {
      }
    }
  }


  onShareAppMessage() {
    const { userStore: { userDetails } } = this.props;
    return {
      title: `邀请你加入${userDetails.pollutionSourceInfo.divisionName}`,
      path: `/pages/login/login?divisionCode=${userDetails.pollutionSourceInfo.divisionCode}&share=true`,
      imageUrl: `${rootSourceBaseUrl}/share.png`,
    }
  }

  /**
   * 加入申请页面 -doing
   */
  joinRequest() {
    Taro.navigateTo({
      url: '../joinRequest/index'
    })
  }

  /**
   * 人员管理 -doing
   */
  personManage() {
    Taro.navigateTo({
      url: '../personManage/index',
    });
  }

  /**
   * 部门管理 -doing
   */
  departmentManage() {
    Taro.navigateTo({
      url: '../departmentManage/index',
    })
  }

  /**
   * 个人信息页面 -doing
   */
  personalInfo() {
    Taro.navigateTo({
      url: '/common/pages/personalInfo/index'
    })
  }

  /**
   * 关注公众号切换
   */
  onSwitch = () => {
    const { isFocus } = this.state;
    this.setState({
      isFocus: !isFocus
    })
  }

  /**
   * 切换所在工地
   */
  onChangeConstruction = () => {
    const { dispatchStore } = this.props;
    dispatchStore.clearData();
    Taro.navigateTo({
      url: '/pages/switch_construction/index'
    })
  }

  /**
   * 跳转我的专属二维码
   */
  onJumpMySalespersonQrCode = () => {
    Taro.navigateTo({
      url: '/common/pages/myInfo/exclusiveQrcode'
    })
  }

  /**
   * 跳转我邀请的加入申请
   */
  onJumpSalespersonInviteList = () => {
    Taro.navigateTo({
      url: '/common/pages/myInfo/joinList'
    })
  }
  // 未用到
  onAcceptDispatch = () => {
    Taro.navigateTo({
      url: '/common/pages/myInfo/acceptDispatch'
    })
  }
  // 未用到
  onGoodShare = () => {
    Taro.navigateTo({
      url: '/common/pages/myInfo/goodShare'
    })
  }
  // 未用到
  onLaunchDispatch = () => {
    Taro.navigateTo({
      url: '/common/pages/myInfo/launchDispatch'
    })
  }

  /**
   * 点击申请管理员
   */
  onAdmin = (e) => {
    e.stopPropagation();
    const { userStatus } = this.state;
    if (userStatus === '') {
      this.setState({ isOpened: true })
    }
  }

  handleCancel = () => {
    this.setState({ isOpened: false })
  }

  handleConfirm = () => {
    this.setState({
      isOpened: false
    }, () => {
      const { tenant, tenantUser } = this.props.userStore.userDetails;
      setAdministratorRequests({
        userId: tenant ? tenantUser.userId : 0,
        userName: tenantUser ? tenantUser.userName : "",
        tenantCode: tenant ? tenant.code : "",
        tenantName: tenant ? tenant.name : "",
        roleCode: ADMINISTRATOR,
        roleName: "管理员"
      }).then(res => {
        if(res.data && res.data.success === true){
          this.setState({ userStatus: 'CONFIRMING' });
        }
      })
    })
  }
  // 未用到
  eventNumberClick = (event: Event) => {
    let tabType: string = 'PATROL';
    if (event.code == 'inspect_total') {
      tabType = 'INCIDENT';
    } else if (event.code == 'inspect_finish') {
      tabType = 'INCIDENT_FINISHED';
    } else {
      tabType = 'PATROL';
    }
    Taro.navigateTo({
      url: `/common/pages/myInfo/inspectList?tabType=${tabType}`,
    });
  }

  onItemClick = (item: any) => {
    if (item.key !== 'stats') {
      Taro.navigateTo({
        url: `/common/pages/myInfo/myList?tabKey=${item.key}&tabName=${item.title}`
      })
    }
    else {
      Taro.navigateTo({
        url: `/common/pages/myInfo/myStats`
      })
    }
  }

  render() {
    const { userStore: { userDetails } } = this.props;
    const { joinRequestCount, salespersonRequestCount, isFocus, userStatus, isOpened } = this.state;
    if (!userDetails) {
      return (<View className='content'></View>)
    }

    let administrator = isAdministrator(userDetails.roles);
    let salesperson = isSalesperson(userDetails.roles);
    const allSwitchArea = (userDetails.roles || []).some(user => ['experter', 'system_administrator', 'system_operator'].includes(user.code))

    return (
      userDetails &&
      <View className='content'>
        <View className='topBack'>
          <View className='user_info'>
            <View className='user_info_up' onClick={this.personalInfo.bind(this)}>
              <View>
                <AtAvatar className='avatar' circle image={`${getUserAvatarUrl(userDetails.tenantUser ? userDetails.tenantUser.userId : 0)}`} />
              </View>

              <View className='user_div'>
                <View className='user_div__top'>
                  <Text className='username'>{userDetails.tenantUser.userName || ''}</Text>
                  {
                    userStatus != 'REJECT' &&
                    <Image className='img' src={MAP_IMG[userStatus] || `${rootSourceBaseUrl}/assets/my/admin-1.png`} onClick={this.onAdmin} />
                  }
                </View>
                <Text className='department'>{userDetails.departmentNode && userDetails.departmentNode.name || ''}</Text>
              </View>
            </View>
          </View>
          {/* 管理员 */}
          {
            administrator &&
            <View className='operations'>
                <View className='operations_child' onClick={this.joinRequest.bind(this)}>
                  <Image className='operations_bg' src={`${rootSourceBaseUrl}/assets/my/join_apply.png`} />
                  {
                    joinRequestCount && joinRequestCount > 0 &&
                    <View className='num'><AtBadge value={joinRequestCount} ></AtBadge></View>
                  }
                  <Text className='operations_name'>加入申请</Text>
                </View>
                <View className='operations_child' onClick={this.personManage.bind(this)}>
                  <Image className='operations_bg' src={`${rootSourceBaseUrl}/assets/my/person_management.png`} />
                  <Text className='operations_name'>人员管理</Text>
                </View>
                <View className='operations_child' onClick={this.departmentManage.bind(this)}>
                  <Image className='operations_bg' src={`${rootSourceBaseUrl}/assets/my/department_management.png`} />
                  <Text className='operations_name'>部门管理</Text>
                </View>
              </View>
          }
          <View className='bottom adminTop'>
            <View className='inspects'>
              <Text className='title'>我的巡查事件</Text>
              <View className='inspects-list'>
                {
                  MyInspectsList.map(item => (
                    <View className='list-item' key={item.key} onClick={this.onItemClick.bind(this, item)}>
                      <Image className='img' src={item.img} />
                      <Text className='txt'>{item.title}</Text>
                    </View>
                  ))
                }
              </View>
            </View>
            {/* 销售人员和系统级人员 */}
            {
              (allSwitchArea || salesperson) && (
                <Block>
                  {
                    <View className='area'>
                      <View className='left'>
                        <Image className='img' src={`${rootConstructionSourceBaseUrl}/assets/pages/green-construction/invite-construction.png`} />
                        <Text className='txt'>切换所在工地</Text>
                      </View>
                      <View className='right' onClick={this.onChangeConstruction}>
                        <Text className='txt'>{userDetails.tenant.name}</Text>
                        <AtIcon className='img' value='chevron-right' size='24' color='#7A8499' />
                      </View>
                    </View>
                  }
                  
                </Block>
              )
            }
          </View>
        </View>

        <AtModal
          isOpened={isOpened}
          className='myPop'
          cancelText='取消'
          confirmText='确认'
          onClose={this.handleCancel}
          onCancel={this.handleCancel}
          onConfirm={this.handleConfirm}
          content='确认提交成为管理员的申请？'
        />
        {/* <OfficialAccount className={cn('focus-comp', { hide: !isFocus })} /> */}
      </View>
    )
  }
}
