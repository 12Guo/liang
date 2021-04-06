import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, Image, ScrollView, Block } from '@tarojs/components'
import { AtInput, AtList, AtListItem, AtAvatar } from 'taro-ui'
import { observer, inject } from '@tarojs/mobx';
import {checkedImage,uncheckedImage,navBackWithData} from '@common/utils/common'
import TopBar from '@common/components/TopBar'
import { departmentUsers, childDivisionUsers, DepartmentUser, DivisionUser, SimpleUser } from '@common/service/user'
import { rootSourceBaseUrl, getUserAvatarUrl } from '@common/utils/requests'

import './index.scss'

interface PersonChooseProps {
  userStore: any;
  systemInfoStore: any;
}

export interface ChoosedDivisionUser extends DivisionUser {
  /**
   * 原始用户组用户个数
   */
  size: number;
}

export interface ChoosedDepartmentUser extends DepartmentUser {
  /**
   * 原始用户组用户个数
   */
  size: number;
}

interface PersonChooseState {
  /**
   * 部门用户列表
   */
  departmentUserList: DepartmentUser[];

  /**
   * 行政区用户列表
   */
  divisionUserList: DivisionUser[];

  /**
   * 加载中
   */
  isLoading: boolean;
  /**
   * 人员是否单选
   */
  radio: boolean;
  /**
   * 返回数据对象编码，用于返回数据
   */
  dataCode: string;

  /**
   * 搜索框文本内容
   */
  searchText?: string;

  /**
   * 选中的用户
   */
  choosedUsers: SimpleUser[];

  /**
   * 选中的下级区域
   */
  choosedDivisionUserList: ChoosedDivisionUser[];

  /**
   * 选中的部门
   */
  choosedDepartmentUserList: ChoosedDepartmentUser[];

  /**
   * 是否展示下级人员列表
   */
  isDetailPage: boolean;
  /**
   * 详细用户组
   */
  detailUser?: DepartmentUser | DivisionUser;

  /**
   * 部门或行政区中的用户列表 
   */
  detailUserList: SimpleUser[];

  /**
   * 是否全选
   */
  isCheckAllUserGroups: boolean;

  /**
   * 是否全选用户列表
   */
  isCheckAllUsers:boolean;
}


/**
 * 判断用户是否已选中
 * @param user 
 */
function isChoosedUser(user: SimpleUser,choosedUsers:SimpleUser[]): boolean {
  let checked = false;
  for (let i = 0; i < choosedUsers.length; i++) {
    if (user.id == choosedUsers[i].id) {
      checked = true;
      break;
    }
  }
  return checked;
}

@inject('userStore','systemInfoStore')
@observer
export default class PersonChoose extends Component<PersonChooseProps, PersonChooseState> {

  config: Config = {
    navigationBarTitleText: '人员选择',
    navigationBarBackgroundColor: '#107EFF',
    navigationBarTextStyle: 'white',
    backgroundColor: '#107EFF',
    navigationStyle: 'custom',
  }

  constructor(props) {
    super(props)
    this.state = {
      departmentUserList: [],
      divisionUserList: [],
      detailUserList: [],
      isLoading: true,
      radio: false,
      choosedUsers: [],
      choosedDivisionUserList: [],
      choosedDepartmentUserList: [],
      isDetailPage: false,
      isCheckAllUserGroups: false,
      isCheckAllUsers:false,
      dataCode : 'personChoosedData',
    }
  }

  async componentWillMount() {
    let { radio,dataCode } = this.$router.params;
    const { userStore: { userDetails } } = this.props;
    let divisionCode = userDetails.divisionCode;

    try {
      const departmentUsersResp = await departmentUsers(divisionCode);
      // const childDivisionUsersResp = await childDivisionUsers(divisionCode);

      this.setState({
        departmentUserList: departmentUsersResp.data,
        divisionUserList: [],
        isLoading: false,
        radio: radio === 'true',
        dataCode: dataCode || 'personChoosedData',
      });
    } catch (error) {
    }
  }

  componentDidMount() {
  }

  componentDidShow() {

  }


  /**
   * 搜索
   * @param text  搜索字符串
   */
  handleSearch(text: string) {
    if (text && text.trim() != '') {
      this.setState({
        searchText: text.trim(),
      });
    }
  }

  /**
   * 显示用户组下级用户列表
   * @param userGroup 用户组
   */
  showDetailUserList(userGroup: DepartmentUser | DivisionUser) {
    if (!userGroup.users || userGroup.users.length == 0) {
      return;
    }
    const {isCheckAllUserGroups} = this.state;

    this.setState({
      isDetailPage: true,
      detailUser: userGroup,
      detailUserList: userGroup.users,
      isCheckAllUsers: isCheckAllUserGroups,
    });
  }

  /**
   * 选中用户列表中的用户
   * @param user 操作的用户
   * @param add 添加标记
   */
  chooseUsers(user: SimpleUser) {
    let { choosedUsers,choosedDepartmentUserList,choosedDivisionUserList,isCheckAllUsers,isCheckAllUserGroups,radio } = this.state;

    let tempChoosedUsers: SimpleUser[];

    if(radio){
      //单选
      tempChoosedUsers = [];
      choosedDepartmentUserList = [];
      choosedDivisionUserList = [];

      if (isChoosedUser(user,choosedUsers)) {
        //取消选中
      }else{
        //选中
        tempChoosedUsers.push(user);
      }
    }else{
      tempChoosedUsers = choosedUsers;

      if (isChoosedUser(user,choosedUsers)) {
        //取消选中
        tempChoosedUsers = [];
        choosedUsers.forEach(cu => {
          if (cu.id != user.id) {
            tempChoosedUsers.push(cu);
          }
        })
        isCheckAllUsers = false;
        isCheckAllUserGroups = false;
      } else {
        tempChoosedUsers.push(user);
      }
    }
    

    this.setState({
      choosedUsers: tempChoosedUsers,
      isCheckAllUsers: isCheckAllUsers,
      isCheckAllUserGroups: isCheckAllUserGroups,
      choosedDepartmentUserList: choosedDepartmentUserList,
      choosedDivisionUserList: choosedDivisionUserList,
    });
  }

  

  /**
   * 判断是否选中
   * @param userGroup 用户组
   */
  isChoosedUserGroup(userGroup: DepartmentUser | DivisionUser): boolean {
    return this.getChoosedUserGroupIndex(userGroup) >= 0;
  }
  /**
   * 返回当前用户组在已选择用户组中的索引
   * @param userGroup 用户组
   */
  getChoosedUserGroupIndex(userGroup: DepartmentUser | DivisionUser): number {
    const { choosedDivisionUserList, choosedDepartmentUserList } = this.state;

    if ((userGroup as DepartmentUser).departmentId) {
      for (let i = 0; i < choosedDepartmentUserList.length; i++) {
        if ((userGroup as DepartmentUser).departmentId == choosedDepartmentUserList[i].departmentId) {
          return i;
        }
      }
    } else {
      for (let i = 0; i < choosedDivisionUserList.length; i++) {
        if ((userGroup as DivisionUser).divisionCode == choosedDivisionUserList[i].divisionCode) {
          return i;
        }
      }
    }
    return -1;
  }


  /**
   * 详情页面点击确定时更新【已选择的用户组列表】
   * @param userGroup 用户组
   */
  chooseGroup(userGroup: DepartmentUser | DivisionUser) {
    let { choosedUsers, choosedDivisionUserList, choosedDepartmentUserList, isCheckAllUserGroups } = this.state;
    const users = userGroup.users;

    let isDepartmentGroup: boolean;
    if ((userGroup as DepartmentUser).departmentId) {
      isDepartmentGroup = true;
    } else {
      isDepartmentGroup = false;
    }

    //用户组中被选中的用户列表
    let groupChoosedUsers: SimpleUser[] = [];
    for (let i = 0; i < choosedUsers.length; i++) {
      for (let j = 0; j < users.length; j++) {
        if (choosedUsers[i].id == users[j].id) {
          groupChoosedUsers.push(choosedUsers[i]);
          break;
        }
      }
    }

    //获取用户组在已选择用户组中的索引
    const index = this.getChoosedUserGroupIndex(userGroup);

    if (groupChoosedUsers.length > 0) {
      //继续选中
      if (isDepartmentGroup) {
        //部门用户组
        let departmentUser = (userGroup as DepartmentUser);

        let choosedDepartmentUser = { 
          size: userGroup.users.length, 
          departmentId: departmentUser.departmentId,
          departmentName: departmentUser.departmentName,
          users: groupChoosedUsers,
        };
        if (index >= 0) {
            choosedDepartmentUserList[index] = choosedDepartmentUser;
        } else {
          choosedDepartmentUserList.push(choosedDepartmentUser);
        }
      } else {
        //行政区用户组
        let divisionUser = (userGroup as DivisionUser);

        let choosedDivisionUser = { 
          size: userGroup.users.length, 
          divisionCode: divisionUser.divisionCode,
          divisionName: divisionUser.divisionName,
          users: groupChoosedUsers,
        };
        if (index >= 0) {
          choosedDivisionUserList[index] = choosedDivisionUser;
        } else {
          choosedDivisionUserList.push(choosedDivisionUser);
        }
      }
    } else {
      //取消选中
      if (index >= 0) {
        if (isDepartmentGroup) {
          choosedDepartmentUserList.splice(index, 1);
        } else {
          choosedDivisionUserList.splice(index, 1);
        }
      }
    }

    if(groupChoosedUsers.length<users.length){
      isCheckAllUserGroups = false;
    }

    if (isDepartmentGroup) {
      this.setState({
        choosedDepartmentUserList: choosedDepartmentUserList,
        isCheckAllUserGroups: isCheckAllUserGroups,
      });
    }else{
      this.setState({
        choosedDivisionUserList: choosedDivisionUserList,
        isCheckAllUserGroups: isCheckAllUserGroups,
      });
    }
    
  }

  checkAll(){
    let { radio,isDetailPage, detailUser, departmentUserList,divisionUserList,
      choosedUsers, isCheckAllUserGroups, isCheckAllUsers } = this.state;
    if(radio){
      return;
    }

    if(isDetailPage && detailUser){
      //用户详细页面

      let tempChoosedUsers: SimpleUser[] = [];
      let users = detailUser.users;

      if(isCheckAllUsers){
        //取消全选
        isCheckAllUsers = false;

        for (let i = 0; i < choosedUsers.length; i++) {
          let exists = false;
          for (let j = 0; j < users.length; j++) {
            if (choosedUsers[i].id == users[j].id) {
              exists = true;
              break;
            }
          }
          if(!exists){
            tempChoosedUsers.push(choosedUsers[i]);
          }
        }
        
      }else{
        //全选
        isCheckAllUsers = true;
        tempChoosedUsers = tempChoosedUsers.concat(choosedUsers);

        for (let i = 0; i < users.length; i++) {
          let exists = false;
          for (let j = 0; j < choosedUsers.length; j++) {
            if (choosedUsers[j].id == users[i].id) {
              exists = true;
              break;
            }
          }
          if(!exists){
            tempChoosedUsers.push(users[i]);
          }
        }
      }
      
      this.setState({
        choosedUsers: tempChoosedUsers,
        isCheckAllUsers: isCheckAllUsers,
        isCheckAllUserGroups: isCheckAllUserGroups,
      });

    }else{
      //用户组页面
      if(isCheckAllUserGroups){
        //取消全选
        this.setState({
          isCheckAllUserGroups: false,
          choosedDepartmentUserList: [],
          choosedDivisionUserList: [],
          choosedUsers: [],
        });
      }else{
        //全选
        let choosedUsers:SimpleUser[] = [];
        let choosedDepartmentUserList:ChoosedDepartmentUser[] = [];
        let choosedDivisionUserList:ChoosedDivisionUser[] = [];

        for(let i=0;i<departmentUserList.length;i++){
          choosedDepartmentUserList.push({
            size: departmentUserList[i].users.length,
            ...departmentUserList[i]
          });
          choosedUsers = choosedUsers.concat(departmentUserList[i].users);
        }

        for(let i=0;i<divisionUserList.length;i++){
          choosedDivisionUserList.push({
            size: divisionUserList[i].users.length,
            ...divisionUserList[i]
          });
          choosedUsers = choosedUsers.concat(divisionUserList[i].users);
        }

        this.setState({
          isCheckAllUserGroups: true,
          choosedDepartmentUserList: choosedDepartmentUserList,
          choosedDivisionUserList: choosedDivisionUserList,
          choosedUsers: choosedUsers,
        });
      }

    }
  }


  okButton() {
    const { isDetailPage, detailUser, choosedDepartmentUserList,choosedDivisionUserList,
      choosedUsers,dataCode } = this.state;

    if (isDetailPage) {
      //详情页确定按钮,如果有选中用户组下面的用户，则需要选中用户组
      if(detailUser){
        this.chooseGroup(detailUser);
      }
      this.setState({
        isDetailPage: false,
        detailUser: undefined,
        detailUserList: [],
        isCheckAllUsers: false,
      });
    } else {
      //选完后,返回上级页面
      navBackWithData({
        [dataCode] : {
          choosedDepartmentUserList: choosedDepartmentUserList,
          choosedDivisionUserList: choosedDivisionUserList,
          choosedUsers: choosedUsers,
        }
      });
    }
  }

  onBackHandle = ()=>{
    const {isDetailPage} = this.state;
    if(isDetailPage){
      this.setState({
        isDetailPage: false,
        detailUser: undefined,
        detailUserList: [],
        isCheckAllUsers: false,
      });
    }else{
      Taro.navigateBack();
    }
  }



  render() {
    const { isLoading, isDetailPage, departmentUserList, divisionUserList, choosedUsers,
      detailUser, searchText, radio,isCheckAllUserGroups,isCheckAllUsers} = this.state;
    const { systemInfoStore} = this.props;  

    if (isLoading) {
      return <View className='content'></View>
    }

    let isCheckAll:boolean;
    let showOperateView = true;
    let checkAllText = '';

    if(isDetailPage && detailUser){
      checkAllText = radio ? '单选' : '全选';
      if ((detailUser as DepartmentUser).departmentId != undefined) {
        if((detailUser as DepartmentUser).departmentName){
          checkAllText += '-'+ (detailUser as DepartmentUser).departmentName;  
        }
      }else{
        checkAllText += '-'+(detailUser as DivisionUser).divisionName;
      }
      isCheckAll = isCheckAllUsers;

    }else{
      checkAllText = radio ? '单选' : '全选';
      showOperateView = !radio;
      isCheckAll = isCheckAllUserGroups;
    }

    const statusBarHeight = systemInfoStore.systemInfo.statusBarHeight;

    return (
      <View className={`content device_pd_${statusBarHeight}`}>
        <TopBar title='人员选择' onBack={this.onBackHandle} />

        <View className='searchView'>
          <Image className='searchButton' src={`${rootSourceBaseUrl}/assets/common/search.png`} />
          <AtInput className='personInput'
            name='name'
            type='text'
            cursor='0'
            // autoFocus={true}
            // focus={true}
            border={false}
            placeholder='搜索人员'
            value={searchText}
            onChange={this.handleSearch.bind(this)}
          />
        </View>

        {
          showOperateView && 
          <View className='operateView' onClick={this.checkAll.bind(this)}>
            {
              !radio &&
              <Image className='radio' src={isCheckAll? checkedImage : uncheckedImage}></Image>
            }
            <Text className='text'>{checkAllText}</Text>
          </View>
        }

        {
          !isDetailPage &&
          <ScrollView
            className='departmentAndDivisionView'
            scrollY
            scrollWithAnimation>
            {
              departmentUserList && departmentUserList.length > 0 &&
              <Block>
                <View className='title'>部门</View>
                <View className='list'>
                  <AtList>
                    {
                      departmentUserList
                      // .filter(departmentUser=>departmentUser.users.length>0)
                      .map(departmentUser => {
                        return (
                          <AtListItem key={departmentUser.departmentId} thumb={this.isChoosedUserGroup(departmentUser) ? checkedImage : uncheckedImage} title={ (departmentUser.departmentName||'未分配部门') + '(' + departmentUser.users.length + ')'}
                            arrow='right' onClick={this.showDetailUserList.bind(this, departmentUser)}></AtListItem>
                        )
                      })
                    }
                  </AtList>
                </View>
              </Block>
            }

            {
              divisionUserList && divisionUserList.length > 0 &&
              <Block>
                <View className='title'>下级区域</View>
                <View className='list'>
                  <AtList>
                    {
                      divisionUserList
                      // .filter(divisionUser=>divisionUser.users.length>0)
                      .map(divisionUser => {
                        return (
                          <AtListItem key={divisionUser.divisionCode} thumb={this.isChoosedUserGroup(divisionUser) ? checkedImage : uncheckedImage} title={divisionUser.divisionName + '(' + divisionUser.users.length + ')'}
                            arrow='right' onClick={this.showDetailUserList.bind(this, divisionUser)}></AtListItem>
                        )
                      })
                    }
                  </AtList>
                </View>
              </Block>
            }
          </ScrollView>
        }


        {
          isDetailPage &&
          <ScrollView
            className='personListView'
            scrollY
            scrollWithAnimation>
            {
              detailUser && detailUser.users &&
              detailUser.users.map(simpleUser => {
                return (
                  <View key={simpleUser.id} className='personView' onClick={this.chooseUsers.bind(this, simpleUser)}>
                    <Image className='radio' src={isChoosedUser(simpleUser,choosedUsers)? checkedImage : uncheckedImage}></Image>
                    <AtAvatar className='avatar' circle image={`${getUserAvatarUrl(simpleUser.id)}`} />
                    <Text className='name'>{simpleUser.name || '' }</Text>
                  </View>
                )
              })
            }
          </ScrollView>
        }


        <View className='buttonView'>
          <Text className='leftView'>已选{choosedUsers.length}人</Text>
          <Text className='rightButton' onClick={this.okButton.bind(this)}>确认</Text>
        </View>
      </View>
    )
  }
}
