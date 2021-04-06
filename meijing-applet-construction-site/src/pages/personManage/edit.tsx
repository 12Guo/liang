import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, Button, Picker, Image } from '@tarojs/components'
import { AtAvatar, AtIcon, AtInput } from 'taro-ui'
import { observer, inject } from '@tarojs/mobx';
import { tenantUser, updateUser, viewTenantUserDetails  } from '../../service/user'
import { treeByTenantCode, Department } from '../../service/department'
import { getPageData, isAdministrator,  } from '@common/utils/common';
import { addRolesByAdministrator } from '../../service/role'
import { getUserAvatarUrl, rootSourceBaseUrl } from '@common/utils/requests'
import { UserDetails } from '../../common/store/user'
import cn from "classnames";
import isEmpty from "lodash/isEmpty";
import './edit.scss';

const iconphone = `${rootSourceBaseUrl}/assets/my/iconphone.png`;


interface MyProps {
  userStore: any;
}

interface MyState {
  id: number;
  name: string;
  nickname: string;
  phone: string;
  divisionCode: string;
  divisionName: string;
  department: {
    departmentCode: string;
    name: string;
  };
  roles: {
    code: string;
    name: string;
  }[];
  departemtList: Department[];
  tenantCode: string;
  tenantName: string;
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
      phone: "",
      divisionCode: '',
      department: {
        departmentCode: "",
        name: '',
      },
      divisionName: '',
      roles: [],
      departemtList: [],
      tenantCode: "",
      tenantName: ""
    }
  }

  async componentDidMount() {
    let { userId } = this.$router.params;

    const { userStore: { userDetails: currentUserDetails } } = this.props;
    try {
      const resDepartment = await treeByTenantCode(currentUserDetails.tenant.code);
      const viewUserDetailsResp = await viewTenantUserDetails(parseInt(userId));
      const userDetails: UserDetails = viewUserDetailsResp.data;

      this.setState({
        id: userDetails.simpleUserInfo.userId,
        name: userDetails.simpleUserInfo.name,
        nickname: userDetails.simpleUserInfo.nickName,
        phone: userDetails.simpleUserInfo.phone,
        divisionCode: userDetails.tenant ? userDetails.tenant.divisionCode : "",
        department: {
          departmentCode: userDetails.departmentNode ? userDetails.departmentNode.code : "-1",
          name: userDetails.departmentNode ? userDetails.departmentNode.name : "其它部门"
        },
        divisionName: userDetails.tenant ? userDetails.tenant.divisionName : '',
        tenantCode: userDetails.tenant ? userDetails.tenant.code : "",
        tenantName: userDetails.tenant ? userDetails.tenant.name : "",
        roles: userDetails.roles,
        departemtList: resDepartment.data,
      })
    } catch (error) {}
  }


  componentDidShow() {
    const { roles_edit, departmentCode="", departmentName="" } = getPageData(); 

    if (departmentCode) {
      this.setState({
        department: {
          departmentCode, name: departmentName
        }
      });
    }

    if (roles_edit) {
      this.setState({
        roles: roles_edit
      });
    }
  }

  handleNickNameChange(value: string) {
    this.setState({
      nickname: value || ''
    });
  }

  handleNameChange(value: string) {
    const reg = new RegExp(/\s/, "g");
    if(reg.test(value) === true){
      Taro.showToast({
        title: "真实姓名不可包含空格",
        icon: "none",
        duration: 1000
      })
    }
    this.setState({
      name: value.replace(/\s/g, "") || ''
    });
  }

  /**
   * 修改角色
   */
  onRoleChange() {
    const { roles, tenantCode } = this.state;
    let roleCodes: string[] = [];
    roles.forEach(role => roleCodes.push(role.code));

    Taro.navigateTo({
      url: `/common/pages/personalInfo/roleEdit?roleCodes=${roleCodes.join('|')}&tenantCode=${tenantCode}`
      // url: `../personalInfo/roleEdit?roleCodes=${roleCodes.join('|')}`
    })
  }

  /**
   * 修改部门
   * @param res 
   */
  onDepartmentChange() {
    const { tenantCode } = this.state;
    Taro.navigateTo({
      url: `/pages/department_select/index?divisionCode=${tenantCode}`
    })
  }

  onMakePhone = (phone: any) => {
    Taro.makePhoneCall({
        phoneNumber: phone
    })
  }

  async edit() {
    const { userStore: { userDetails: currentUserDetails } } = this.props;
    const { id, name, nickname, tenantCode, department, roles } = this.state;
    const administrator = isAdministrator(currentUserDetails.roles);

    if (!administrator) {
      Taro.showToast({
        title: '只有系统管理员才能修改用户信息',
        mask: true,
        icon: 'none',
        duration: 2000
      });
      return;
    }

    //修改用户角色信息
    let roleCodes: string[] = [];
    roles && roles.forEach(role => roleCodes.push(role.code));

    let user: tenantUser = {
      userId: id,
      name: name,
      nickName: nickname,
      departmentCode: department.departmentCode,
      tenantCode: tenantCode,
      roles: roleCodes
    };

    //修改用户信息
    const response = await updateUser(user);
    if(response.data && response.data.success === true){
      Taro.showToast({
        title: `保存${name}个人信息成功`,
        icon: "success",
        duration: 2000
      })
      Taro.navigateBack();
    }
    // await addRolesByAdministrator([id], roleCodes);

  }


  render() {
    const { id, nickname, name, divisionName, department, roles, phone } = this.state;

    let roleName = '';
    if (roles && roles.length > 0) {
      roleName = roles.map(role => role.name).join('、');
    }

    let departmentName = department && department.name || '';

    return (
      <View className='content'>
        <View className='top_back'></View>

        <View className='userinfo_panel'>
          <View className='info_item'>
            <Text className='item_left'>头像</Text>
            <View className='item_right'>
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
              <Text className='item_left'>手机号</Text> 
              <View className='item_right'>
                <Text className='item_right text_left'>{phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') || '暂无'}</Text> 
                    <Image className={cn('icon', { hide: isEmpty(phone) })}  onClick={this.onMakePhone.bind(this, phone)} src={iconphone} />
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
            <View className='item_right' >
              <Text className='text_right'>{divisionName}</Text>
            </View>
          </View>

          <View className='info_item'>
            <Text className='item_left'>所属部门</Text>
            <View className='item_right' onClick={this.onDepartmentChange}>
              <AtIcon className="chevron_right" value="chevron-right" size="20" color="#7A8499" />
              <Text className='text_right'>{departmentName}</Text>
            </View>
          </View>

          <View className='info_item'>
            <Text className='item_left'>角色</Text>
            <View className='item_right' onClick={this.onRoleChange}>
              <AtIcon className="chevron_right" value="chevron-right" size="20" color="#7A8499" />
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
