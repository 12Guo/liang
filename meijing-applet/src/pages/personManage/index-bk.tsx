import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, Image, ScrollView, Block } from '@tarojs/components'
import { AtInput, AtList, AtListItem, AtAvatar } from 'taro-ui'
import { observer, inject } from '@tarojs/mobx';
import {checkedImage,uncheckedImage} from '@common/utils/common'
import { departmentUsers, childDivisionUsers, DepartmentUser, DivisionUser, SimpleUser } from '@common/service/user'
import { rootSourceBaseUrl, getUserAvatarUrl } from '@common/utils/requests'
import TopBar from '@common/components/TopBar'

import './index.scss'

const addImageUrl = rootSourceBaseUrl + "/assets/common/add_image.png"

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

  noDepartmentUser?: DepartmentUser;

  /**
   * 行政区用户列表
   */
  divisionUserList: DivisionUser[];

  /**
   * 加载中
   */
  isLoading: boolean;

  /**
   * 搜索框文本内容
   */
  searchText: string;

  /**
   * 选中的用户
   */
  choosedUsers: SimpleUser[];

  /**
   * 是否展示下级人员列表
   */
  isDetailPage: boolean;

  /**
   * 批量操作
   */
  isBatchOperate: boolean;

  /**
   * 详细用户组
   */
  detailUser?: DepartmentUser | DivisionUser;

  /**
   * 部门或行政区中的用户列表 
   */
  detailUserList: SimpleUser[];

  /**
   * 是否全选用户列表
   */
  isCheckAllUsers: boolean;

  /**
   * 搜索列表
   */
  searchList: SimpleUser[];

  /**
   * 所有用户列表
   */
  allUserList: SimpleUser[];
}


/**
 * 判断用户是否已选中
 * @param user 
 */
function isChoosedUser(user: SimpleUser, choosedUsers: SimpleUser[]): boolean {
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
    navigationBarTitleText: '人员管理',
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
      choosedUsers: [],
      isDetailPage: false,
      isCheckAllUsers: false,
      isBatchOperate: false,
      searchList: [],
      allUserList: [],
      searchText: '',
    }
  }

  async componentDidMount() {
    const { userStore: { userDetails } } = this.props;
    let divisionCode = userDetails.divisionCode;

    try {
      const departmentUsersResp = await departmentUsers(divisionCode);
      const childDivisionUsersResp = await childDivisionUsers(divisionCode);

      const departmentUserList:DepartmentUser[] =departmentUsersResp.data;

      //找出没部门的用户组
      let noDepartmentUser;
      for(let i=0;i<departmentUserList.length;i++){
        if(departmentUserList[i].departmentId <= 0){
          noDepartmentUser = departmentUserList[i];
          break;
        }
      }
      
      const divisionUserList:DivisionUser[] = childDivisionUsersResp.data;
      
      let allUserList:SimpleUser[] = [];
      departmentUserList.forEach(du=> allUserList.push(...du.users));
      divisionUserList.forEach(du=> allUserList.push(...du.users));

      this.setState({
        departmentUserList,
        noDepartmentUser: noDepartmentUser,
        divisionUserList,
        isLoading: false,
        allUserList,
      });
    } catch (error) {
    }
  }


  componentDidShow() {

  }


  /**
   * 搜索
   * @param text  搜索字符串
   */
  handleSearch(text: string) {
    const {allUserList} = this.state;

    if (text && text.trim() != '') {
      const searchText = text.trim();
      let list:SimpleUser[] = [];

      _getNodeByKeyWord(searchText, allUserList, list);

      this.setState({
        searchText,
        searchList: list
      });
    }else{
      this.setState({
        searchText: '',
        searchList: [],
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

    this.setState({
      isDetailPage: true,
      detailUser: userGroup,
      detailUserList: userGroup.users,
      choosedUsers: [],
    });
  }

  /**
   * 选中用户列表中的用户
   * @param user 操作的用户
   * @param add 添加标记
   */
  chooseUsers(user: SimpleUser) {
    let { choosedUsers, isCheckAllUsers } = this.state;

    let tempChoosedUsers: SimpleUser[] = choosedUsers;

    if (isChoosedUser(user, choosedUsers)) {
      //取消选中
      tempChoosedUsers = [];
      choosedUsers.forEach(cu => {
        if (cu.id != user.id) {
          tempChoosedUsers.push(cu);
        }
      })
      isCheckAllUsers = false;
    } else {
      tempChoosedUsers.push(user);
    }


    this.setState({
      choosedUsers: tempChoosedUsers,
      isCheckAllUsers: isCheckAllUsers,
    });
  }


  checkAll() {
    let { isDetailPage, detailUser,
      choosedUsers, isCheckAllUsers } = this.state;

    if (isDetailPage && detailUser) {
      //用户详细页面

      let tempChoosedUsers: SimpleUser[] = [];
      let users = detailUser.users;

      if (isCheckAllUsers) {
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
          if (!exists) {
            tempChoosedUsers.push(choosedUsers[i]);
          }
        }

      } else {
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
          if (!exists) {
            tempChoosedUsers.push(users[i]);
          }
        }
      }

      this.setState({
        choosedUsers: tempChoosedUsers,
        isCheckAllUsers: isCheckAllUsers,
      });

    } else {

    }
  }


  okButton() {
    const { isDetailPage } = this.state;

    if (isDetailPage) {
      this.setState({
        isDetailPage: false,
        detailUser: undefined,
        detailUserList: [],
        isCheckAllUsers: false,
      });
    }
  }

  /**
   * 点击单个用户
   * @param user 用户
   */
  clickOnePerson(user:SimpleUser){
    Taro.navigateTo({
      url: `./edit?userId=${user.id}`
    })
  }

  batchOperate(){
    Taro.navigateTo({
      url: './selectPerson'
    })
  }

  addPerson(){
    Taro.navigateTo({
      url: './add'
    })
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
    const { userStore: { userDetails },  systemInfoStore } = this.props;
    const { isLoading, isDetailPage, departmentUserList, divisionUserList, choosedUsers,
      detailUser, searchText, isCheckAllUsers, isBatchOperate, noDepartmentUser, searchList  } = this.state;

    if (isLoading) {
      return <View className='content'></View>
    }

    let checkAllText = '';

    if(isBatchOperate){
      //批量操作
      checkAllText = '全选';
      if (isDetailPage && detailUser) {
        if ((detailUser as DepartmentUser).departmentId) {
          checkAllText += '-' + (detailUser as DepartmentUser).departmentName;
        } else {
          checkAllText += '-' + (detailUser as DivisionUser).divisionName;
        }
      }
    }else{
      if (isDetailPage && detailUser) {
        if ((detailUser as DepartmentUser).departmentId) {
          checkAllText = userDetails.divisionName+'-'+(detailUser as DepartmentUser).departmentName;
        } else {
          checkAllText = userDetails.divisionName+'-'+(detailUser as DivisionUser).divisionName;
        }
      }else{
        checkAllText = userDetails.divisionName;
      }
    }

    const statusBarHeight = systemInfoStore.systemInfo.statusBarHeight;

    const showSearchList:boolean = searchText !== '';

    return (
      
      <View className={`content device_pd_${statusBarHeight}`}>
        <TopBar title='人员管理' onBack={this.onBackHandle} />
        <View className='searchView'>
          <Image className='searchButton' src={`${rootSourceBaseUrl}/assets/common/search.png`} />
          <AtInput className='personInput'
            name='name'
            type='text'
            cursor='0'
            border={false}
            placeholder='搜索人员'
            value={searchText}
            onChange={this.handleSearch.bind(this)}
          />
        </View>

        {
         isDetailPage && detailUser  && isBatchOperate && 
          <View className='operateView' >
            <Image className='radio' onClick={this.checkAll.bind(this)} src={isCheckAllUsers ? checkedImage : uncheckedImage}></Image>
            <Text className='text'>{checkAllText}</Text>
          </View>
        }

        {
         !isBatchOperate && 
          <View className='operateView'>
            <Text className='divisionName'>{checkAllText}</Text>
            {/* <Text className='batchButton' onClick={this.batchOperate.bind(this)}>批量操作</Text> */}
          </View>
        }

        {
          !isDetailPage && !showSearchList &&
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
                        .filter(departmentUser=>departmentUser.departmentId>0)
                        .map(departmentUser => {
                          return (
                            <AtListItem key={departmentUser.departmentId} title={departmentUser.departmentName + '(' + departmentUser.users.length + ')'}
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
                            <AtListItem key={divisionUser.divisionCode} title={divisionUser.divisionName + '(' + divisionUser.users.length + ')'}
                              arrow='right' onClick={this.showDetailUserList.bind(this, divisionUser)}></AtListItem>
                          )
                        })
                    }
                  </AtList>
                </View>
              </Block>
            }

            {
              noDepartmentUser && noDepartmentUser.users.length>0 &&
              <Block>
                <View className='separateView'></View>
                <View className='personList'>
                  {
                    noDepartmentUser.users.map(user=>{
                      return (
                        <View className='personView' key={user.id} onClick={this.clickOnePerson.bind(this,user)}>
                          <AtAvatar className='avatar' circle image={`${getUserAvatarUrl(user.id)}`} />
                          <Text className='name'>{user.name}</Text>
                        </View> 
                      )
                    })
                  }
                </View>
              </Block>
            }
            
          </ScrollView>
        }


        {
          isDetailPage && !showSearchList &&
          <ScrollView
            className='personListView'
            scrollY
            scrollWithAnimation>
            {
              detailUser && detailUser.users &&
              detailUser.users.map(simpleUser => {
                return (
                  <View className='personView' key={simpleUser.id}  onClick={this.clickOnePerson.bind(this,simpleUser)}>
                    {
                      isBatchOperate && 
                      <Image className='radio' src={isChoosedUser(simpleUser, choosedUsers) ? checkedImage : uncheckedImage}></Image>
                    }
                    <AtAvatar className='avatar' circle image={`${getUserAvatarUrl(simpleUser.id)}`} />
                    <Text className='name'>{simpleUser.name || ''}</Text>
                  </View>
                )
              })
            }
          </ScrollView>
        }

        {
          showSearchList && 
          <ScrollView
          className='searchListView'
          scrollY
          scrollWithAnimation>   
          {
            searchList.length>0 &&
            searchList.map(simpleUser => {
              return (
                <View className='personView' key={simpleUser.id}  onClick={this.clickOnePerson.bind(this,simpleUser)}>
                  {
                    isBatchOperate && 
                    <Image className='radio' src={isChoosedUser(simpleUser, choosedUsers) ? checkedImage : uncheckedImage}></Image>
                  }
                  <AtAvatar className='avatar' circle image={`${getUserAvatarUrl(simpleUser.id)}`} />
                  <Text className='name'>{simpleUser.name || ''}</Text>
                </View>
              )
            })
          } 
          </ScrollView>       
        }

        <View className='addButtonView' onClick={this.addPerson.bind(this)}>
            <Image src={addImageUrl} className="add_image"></Image>
            <Text className='userText'>添加人员</Text>
        </View>

      </View>
    )}
}


function _getNodeByKeyWord(word, allUserList:SimpleUser[], list:SimpleUser[]) {
  allUserList.forEach(u => {
    if (u.name.includes(word)) {
      list.push(u);
    }
  });
}