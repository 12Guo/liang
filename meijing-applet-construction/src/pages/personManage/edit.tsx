import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, Button,Picker } from '@tarojs/components'
import { AtAvatar, AtIcon, AtInput} from 'taro-ui'
import { observer, inject } from '@tarojs/mobx';
import {User,updateUser,viewUserDetails} from '../../service/user'
import {listDepartmentByDivision,Department} from '../../service/department'
import {getPageData,isAdministrator} from '@common/utils/common';
import {addRolesByAdministrator} from '../../service/role'
import { getUserAvatarUrl } from '@common/utils/requests'
import {UserDetails} from '../../store/user'

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
  roles: {
    code: string;
    name: string;
  }[];
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
   
    this.state = {
      id: 0,
      name: '',
      nickname: '',
      phone: '',
      avatar: '',
      divisionCode: '',
      department: {
        id: 0,
        name: '',
      },
      divisionName: '',
      roles: [],
      departemtList: [],
    }
  }

  async componentDidMount() {
    let { userId } = this.$router.params;

    const { userStore: {userDetails:currentUserDetails}} = this.props;
    try {
      const resDepartment = await listDepartmentByDivision(currentUserDetails.divisionCode);
      const viewUserDetailsResp = await viewUserDetails(parseInt(userId));
      const userDetails:UserDetails = viewUserDetailsResp.data;

      this.setState({
        id: userDetails.id,
        name: userDetails.name,
        nickname: userDetails.nickname,
        phone: userDetails.phone,
        avatar: userDetails.avatar,
        divisionCode: userDetails.divisionCode,
        department: userDetails.departmentInfo,
        divisionName: userDetails.divisionName,
        roles: userDetails.roles,
        departemtList: resDepartment.data,
      })
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
      url: `../personalInfo/roleEdit?roleCodes=${roleCodes.join('|')}`
    })
  }

  /**
   * 行政区修改
   */
  divisionEdit(){
    const {divisionCode} = this.state;
    Taro.navigateTo({
      url: `../personalInfo/divisionEdit?divisionCode=${divisionCode}`
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
    const { userStore: {userDetails:currentUserDetails}} = this.props;
    const {id,name,nickname,phone,avatar,divisionCode,department,roles} = this.state;
    const administrator = isAdministrator(currentUserDetails.roles);

    if(!administrator){
      Taro.showToast({
        title: '只有系统管理员才能修改用户信息',
        mask: true,
        icon: 'none',
        duration: 2000
      });
      return;
    }

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
    await updateUser(user);

    //修改用户角色信息
    let roleCodes:string[] = [];
    roles && roles.forEach(role=> roleCodes.push(role.code));
    await addRolesByAdministrator([id], roleCodes);

    Taro.navigateBack();
  }


  render () {
    const {id,nickname,name,divisionName,department,departemtList,roles} = this.state;
    
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
                    <AtIcon className='chevron_right' value='chevron-right' size='20' color='#7A8499'/>
                    <AtAvatar className='avatar' circle image={`${getUserAvatarUrl(id)}`} />
                </View>
            </View>

            <View className='info_item'>
                <Text className='item_left'>昵称</Text>
                <View className='item_right'>
                    <AtInput className='right_input' 
                      name='nickname' 
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
                      name='name' title=''
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
                <View className='item_right' onClick={this.divisionEdit.bind(this)}>
                    <AtIcon className='chevron_right' value='chevron-right' size='20' color='#7A8499'/>
                    <Text className='text_right'>{divisionName}</Text>
                </View>
            </View>

            <View className='info_item'>
                <Text className='item_left'>所属部门</Text>
                <View className='item_right'>
                  <Picker mode='selector' value={dindex} range={departemtList} range-key='name' onChange={this.onDepartmentChange.bind(this)}>
                    <AtIcon className='chevron_right' value='chevron-right' size='20' color='#7A8499'/>
                    <Text className='text_right'>{departmentName}</Text>
                  </Picker>
                </View>
            </View>

            <View className='info_item'>
                <Text className='item_left'>角色</Text>
                <View className='item_right' onClick={this.onRoleChange.bind(this)}>
                    <AtIcon className='chevron_right' value='chevron-right' size='20' color='#7A8499'/>
                    <Text className='text_right'>{roleName}</Text>
                </View>
            </View>
          </View>

          <View className='button_panel'>
            <Button className='eidt_button' onClick={this.edit.bind(this)}>保存</Button>      
          </View>
      </View>
    )
  }
}
