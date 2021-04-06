import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import { AtAvatar } from 'taro-ui'
import { observer, inject } from '@tarojs/mobx';
import { getUserAvatarUrl } from '@common/utils/requests'
import { clearValueInPageData, getPageData } from '../../utils/common'
import { UserStore,UserDetails } from '../../store/user'

import './index.scss'

interface PersonalInfoProps {
  userStore: UserStore;
}

interface PersonalInfoState {
  userDetails: UserDetails
}

@inject('userStore')
@observer
export default class Index extends Component<PersonalInfoProps, PersonalInfoState> {

  config: Config = {
    navigationBarTitleText: '个人信息',
    navigationBarBackgroundColor: '#107EFF',
    navigationBarTextStyle: 'white',
    backgroundColor: '#107EFF',
  }

  constructor(props) {
    super(props)
    let { userStore: { userDetails } } = props;
    this.state={
      userDetails
    }
  }

  componentDidMount() {
    
  }

  async componentDidShow() {
    const { refresh } = getPageData();
    if (refresh && refresh == true) {
      clearValueInPageData(['refresh']);

      this.setState({
        userDetails: Taro.getStorageSync('userDetails'),
      });
    }
  }

  edit() {
    Taro.navigateTo({
      url: './edit'
    })
  }

  logout() {
    const { userStore: { logout } } = this.props;
    logout();
    const { userStore: {isLoggedIn} } = this.props;
    if (!isLoggedIn) {
      Taro.redirectTo({ url: '/pages/login/login' });
    } 
  }

  render() {
    let {userDetails} = this.state;
    if (!userDetails) {
      userDetails = Taro.getStorageSync('userDetails');
    }

    let roleName = '';
    if (userDetails && userDetails.roles && userDetails.roles.length > 0) {
      roleName = userDetails.roles.map(role => role.name).join('、');
    }

    return (
      <View className='content'>
        <View className='top_back'></View>

        <ScrollView className='userinfo_panel' scrollY scrollWithAnimation>
          <View className='userinfo_top'>
            <AtAvatar className='avatar' circle image={`${getUserAvatarUrl(userDetails.simpleUserInfo.userId)}`} />
            <View className='username_phone'>
              <Text className='username'>{userDetails.simpleUserInfo.name || ''}</Text>
              <Text className='phone'>{userDetails.simpleUserInfo.phone || ''}</Text>
            </View>
          </View>

          <View className='userinfo_bottom'>
            <View className='info_item'>
              <Text className='item_left'>昵称</Text>
              <Text className='item_right'>{userDetails.simpleUserInfo.nickName || ''}</Text>
            </View>

            <View className='info_item'>
              <Text className='item_left'>真实姓名</Text>
              <Text className='item_right'>{userDetails.tenantUser.userName || ''}</Text>
            </View>

            <View className='info_item'>
              <Text className='item_left'>所在区域</Text>
              <Text className='item_right'>{userDetails.tenant.divisionName || ''}</Text>
            </View>

            <View className='info_item'>
              <Text className='item_left'>所属部门</Text>
              <Text className='item_right'>{userDetails.departmentNode && userDetails.departmentNode.name || ''}</Text>
            </View>

            <View className='info_item'>
              <Text className='item_left'>角色</Text>
              <Text className='item_right'>{roleName}</Text>
            </View>

            {/* <View className='info_item'>
              <Text className='item_left'>职务</Text>
              <Text className='item_right'>{''}</Text>
            </View> */}
          </View>
        </ScrollView>

        <View className='button_panel' style={{display: "none"}}>
          <Button className='logout_button' onClick={this.logout.bind(this)}>注销</Button>
          <Button className='eidt_button' onClick={this.edit.bind(this)}>编辑</Button>
        </View>
      </View>

    )
  }
}
