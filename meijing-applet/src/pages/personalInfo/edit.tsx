import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, Button,Picker } from '@tarojs/components'
import { AtAvatar, AtIcon, AtInput} from 'taro-ui'
import { observer, inject } from '@tarojs/mobx';
import {User,updateCurrentUser} from '@common/service/user'
import {listDepartmentByDivision,Department} from '../../service/department'
import {getPageData,isAdministrator,navBackWithData } from '@common/utils/common';
import {addRolesByAdministrator} from '../../service/role'
import { getUserAvatarUrl } from '@common/utils/requests'

import './edit.scss'


interface MyProps {
    userStore: any;
}

interface MyState {
  id: number;
  name: string;
  nickname: string;
  phone: string;
  avatar: string;
  divisionCode: string;
  divisionName:string;
  department: {
    id?: number;
    name: string;
  };
  roles: [{
    code: string;
    name: string;
  }];
  departemtList: Department[];
}

@inject('userStore')
@observer
export default class Index extends Component<MyProps, MyState> {

  config: Config = {
    navigationBarTitleText: '个人信息',
    navigationBarBackgroundColor: '#FFFFFF',
    navigationBarTextStyle: 'black',
    backgroundColor: '#FFFFFF',
  }

  constructor(props) {
    super(props);

    const { userStore: {userDetails}} = props;
   
    this.state = {
      id: userDetails.id,
      name: userDetails.name,
      nickname: userDetails.nickname,
      phone: userDetails.phone,
      avatar: userDetails.avatar,
      divisionCode: userDetails.divisionCode,
      department: userDetails.departmentInfo,
      divisionName: userDetails.divisionName || '',
      roles: userDetails.roles,
      departemtList: [],
    }
  }

  async componentDidMount () { 
    const { userStore: {userDetails}} = this.props;
    try {
      const resDepartment = await listDepartmentByDivision(userDetails.divisionCode);
      this.setState({ departemtList: resDepartment.data })
    } catch (error) {
    }
  }

  componentDidShow(){
    const {division_edit,roles_edit} = getPageData();

    if(division_edit){
        this.setState({
          divisionCode: division_edit.code,
          divisionName: division_edit.name,
        });
    }

    if(roles_edit){
      this.setState({
        roles: roles_edit
      });
    }
  }

  handleNickNameChange(value:string) {
    this.setState({
      nickname : value || ''
    });
  }

  handleNameChange(value:string){
    this.setState({
      name : value || ''
    });
  }


  handleAvatarChange(value:string){
    // this.setState({
    //   avatar : value || ''
    // });
  }

  handleZhiwuChange(value:string){
    
  }
  /**
   * 修改角色
   */
  onRoleChange(){
    const {roles} = this.state;
    let roleCodes:string[] = [];
    roles.forEach(role=>roleCodes.push(role.code));

    Taro.navigateTo({
      url: `./roleEdit?roleCodes=${roleCodes.join('|')}`
    })
  }

  /**
   * 行政区修改
   */
  divisionEdit(){
    const {divisionCode} = this.state;
    Taro.navigateTo({
      url: `./divisionEdit?divisionCode=${divisionCode}`
    })
  }

  /**
   * 修改部门
   * @param res 
   */ 
  onDepartmentChange(res) {
    let index = res.detail.value;
    const {departemtList} = this.state;

    this.setState({
        department: {
          id: departemtList[index].id,
          name: departemtList[index].name,
        }
    });
  }

  async edit(){
    const {id,name,nickname,phone,avatar,divisionCode,divisionName,department,roles} = this.state;

    let user:User = {
      id: id,
      name: name,
      nickname: nickname,
      phone: phone,
      avatar: avatar,
      divisionCode: divisionCode,
      departmentId: department && department.id,
    };

    //修改用户信息
    await updateCurrentUser(user);

    //修改用户角色信息
    // let roleCodes:string[] = [];
    // roles && roles.forEach(role=> roleCodes.push(role.code));
    // await addRolesByAdministrator([id], roleCodes);

    //修改个人信息完成后 更新userStore中的用户信息
    let { userStore: {userDetails}} = this.props;

    userDetails = {...userDetails, ...{
      name: name,
      nickname: nickname,
      phone: phone,
      avatar: avatar,
      divisionCode: divisionCode,
      divisionName: divisionName,
      // departmentInfo: department,
      roles: roles,
    }}
    Taro.setStorageSync('userDetails', userDetails);

    navBackWithData({
      refresh: true,
    });
  }


  render () {
    const {avatar,nickname,name,divisionName,department,departemtList,roles} = this.state;
    const { userStore : { userDetails}} = this.props
    const { id : userId} = userDetails;

    let roleName = '';
    if(roles && roles.length>0){
      roleName = roles.map(role => role.name).join('、');
    }
    

    let departmentName = department && department.name || '';
    let departmentId = department && department.name || 0;

    let dindex:number;
    for(dindex=0; dindex<departemtList.length;dindex++){
      if(departmentId == departemtList[dindex].id){
        break;
      }
    }

    return (
      <View className='content'>
          <View className='top_back'></View>

          <View className='userinfo_panel'>
            <View className='info_item'>
                <Text className='item_left'>头像</Text>
                <View className='item_right' onClick={this.handleAvatarChange.bind(this)}>
                    <AtAvatar className='avatar' circle image={`${getUserAvatarUrl(userId)}`} />
                </View>
            </View>

            <View className='info_item'>
                <Text className='item_left'>昵称</Text>
                <View className='item_right'>
                    <AtInput className='right_input' 
                      name='value' 
                      title=''
                      type='text'
                      maxLength='18'
                      border={false}
                      placeholder='昵称'
                      value={nickname || ''}
                      onChange={this.handleNickNameChange.bind(this)}
                    />
                </View>
            </View>

            <View className='info_item'>
                <Text className='item_left'>真实姓名</Text> 
                <View className='item_right'>
                    <AtInput className='right_input'  
                      name='value' title=''
                      type='text'
                      maxLength='18'
                      border={false}
                      placeholder='真实姓名'
                      value={name || ''}
                      onChange={this.handleNameChange.bind(this)}
                    />
                </View>
            </View>

            <View className='info_item'>
                <Text className='item_left'>所在区域</Text>
                <View className='item_right'>
                    <Text className='text_right'>{divisionName}</Text>
                </View>
            </View>

            <View className='info_item'>
                <Text className='item_left'>所属部门</Text>
                <View className='item_right'>
                  <Text className='text_right'>{departmentName}</Text>
                  {/* <Picker mode='selector' value={dindex} range={departemtList} range-key='name' onChange={this.onDepartmentChange.bind(this)}>
                    <AtIcon className='chevron_right' value='chevron-right' size='20' color='#7A8499'/>
                    <Text className='text_right'>{departmentName}</Text>
                  </Picker> */}
                </View>
            </View>

            <View className='info_item'>
                <Text className='item_left'>角色</Text>
                <View className='item_right'>
                    {roleName}
                </View>
            </View>

            {/* <View className='info_item'>
                <Text className='item_left'>职务</Text>
                <View className='item_right'>
                    <AtInput className='right_input'  
                            name='value' title=''
                            type='text'
                            maxlength='8' 
                            border={false}
                            placeholder='职务'
                            value={''}
                            onChange={this.handleZhiwuChange.bind(this)}
                        />
                </View>
            </View> */}
          </View>

          <View className='button_panel'>
            <Button className='eidt_button' onClick={this.edit.bind(this)}>保存</Button>      
          </View>
      </View>
    )
  }
}
