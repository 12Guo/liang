/* eslint-disable jsx-quotes */
import Taro, { Config } from "@tarojs/taro";
import { ComponentType } from "react";
import { View, Image, Text, Input } from "@tarojs/components";
import "./index2.scss";
import { AtButton, AtIcon } from "taro-ui";
import { observer, inject } from "@tarojs/mobx";
import { UserStore } from "@common/store/user";
import isEmpty from 'lodash/isEmpty'
import { getPageData } from "@common/utils/common"
import {
  updateCurrentUserInfo,
  userJoinDivisionRequest,
  uploadDivisionActiveRequest,
  decryptPhone,
  UserInfo,
  UserJoinDivisionRequestEntry
} from "../../service/userBaseInfo";

interface UserJoinProps {
  userStore: UserStore;
}

interface UserJoinState {
  avatar: string,
  nickname: string,
  userName: string;
  userTip: boolean;
  //被邀请加入的行政区划
  divisionCode: string | null;
  selectedDepartment: {
    departmentCode: string,
    departmentName: string,
  }
  isLoading: boolean,
  //选择的行政区
  selectDivision: any;
  //选择的部门
  superviseDepartment: any;
  userPhone: string;
}

interface UserJoin {
  props: UserJoinProps;
  state: UserJoinState;
}

interface RegisterRequest {
  phone: string;
  nickname: string;
  avatar: string;
  sex: number;
  city: string;
  province: string;
  registerToken: string;
}

@inject("userStore")
@observer
class UserJoin extends Taro.Component {
  constructor() {
    super(...arguments);
    this.state = {
      avatar: "",
      nickname: "",
      userName: "",
      userTip: false,
      divisionCode: null,
      selectedDepartment: {
        departmentCode: "-1",
        departmentName: "其它"
      },
      isLoading: false,
      selectDivision: null,
      superviseDepartment: {},
      userPhone: Taro.getStorageSync('userDetailPhone')
    };
  }

  config: Config = {
    navigationBarTitleText: "申请加入"
  };

  async componentDidMount() {
    Taro.getUserInfo({
      success: (res) => {
        const { avatarUrl, nickName } = res.userInfo;
        this.setState({
          avatar: avatarUrl,
          nickname: nickName
        });
      }
    })
  }

  componentDidShow() {
    const { selectDivision, selectDepartmentData } = getPageData();
    if (selectDivision) {
      this.setState({
        selectDivision: selectDivision,
        divisionCode: selectDivision.code,
        superviseDepartment: {}
      });
    }
    if (selectDepartmentData) {
      this.setState({
        superviseDepartment: selectDepartmentData
      });
    }
  }

  // 输入名字
  onUserNameChange(e) {
    this.setState({
      userName: e.target.value,
    });
  }
  // 去选择区域
  toConstruction() {
    Taro.navigateTo({ url: `/pages/division_select/index` });
  }

  /**
  * 修改监管部门
  * @param res 
  */
  onDepartmentChange(divisionCode: any) {
    Taro.navigateTo({
      url: `/pages/department_select/index?dataCode=selectDepartmentData&divisionCode=${divisionCode}`
    });
  }

  //显示提示
  showToast(tip) {
    Taro.showToast({
      title: tip,
      mask: true,
      icon: "none",
      duration: 1500
    });
  }

  async jumpToNext() {
    const { selectDivision } = this.state;
    const {
      userName,
      divisionCode,
      superviseDepartment,
    } = this.state;
    if (divisionCode == null) {
      this.showToast("请选择行政区划");
      return;
    }
    if (userName == "") {
      this.setState({
        userNameTip: "请填写真实姓名"
      });
      this.showToast("请填写真实姓名");
      return;
    }
    if (superviseDepartment == undefined) {
      this.showToast("请选择部门");
      return;
    }
    if (selectDivision && selectDivision.status == "INACTIVE") {
      this.setState({
        isActive: true
      });
    } else {
      this.onActiveOrJoinDivision(false);
    }
  }

  //激活或加入行政区
  async onActiveOrJoinDivision(isActive: boolean) {
    const { userStore } = this.props;
    const {
      userName,
      divisionCode,
      superviseDepartment,
      userPhone
    } = this.state;
    const registerRequest: RegisterRequest = Taro.getStorageSync("registerInfo");
    if (divisionCode == null) {
      this.showToast("请选择行政区划");
      return;
    }
    const isReSendVerify = Taro.getStorageSync("reSendVerify");
    //判断是否是重新提交的申请
    if (!isReSendVerify) {
      await userStore.register(
        registerRequest,
        () => { },
        () => {
          this.showToast("用户注册失败");
          return;
        }
      );
    }
    let userInfo: UserInfo = {
      avatar: registerRequest.avatar,
      nickname: registerRequest.nickname,
      phone: userPhone,
      name: userName,
      departmentId: superviseDepartment ? superviseDepartment.id : null,
      departmentName: superviseDepartment ? superviseDepartment.name : null,
    };

    let userInfoUpdateResponse = await updateCurrentUserInfo(userInfo);
    if (userInfoUpdateResponse.statusCode != 200) {
      this.setState({
        isLoading: false
      });
      this.showToast("用户信息更新失败");
      return;
    }
    if (isActive) {
      this.setState({
        isActive: false
      });
      userInfo.divisionCode = divisionCode;
      const activeRequestResponse = await uploadDivisionActiveRequest(userInfo);
      if (activeRequestResponse.statusCode == 200) {
        Taro.removeStorageSync("invite_user_id");
        Taro.removeStorageSync("division_code");
        Taro.redirectTo({
          url: `/pages/user_request_verify/index`
        });
      } else {
        this.showToast("行政区激活失败");
      }
    } else {
      let inviteUserId = Taro.getStorageSync("invite_user_id");
      //加入行政区
      let userJoinRequest: UserJoinDivisionRequestEntry = {
        userId: null,
        userName: userName,
        phone: userPhone,
        divisionCode: divisionCode,
        divisionName: "",
        departmentId: superviseDepartment ? superviseDepartment.id : null,
        departmentName: superviseDepartment ? superviseDepartment.name : null,
        inviteUserId: inviteUserId ? inviteUserId : null
      };
      const userJoinResponse = await userJoinDivisionRequest(userJoinRequest);
      if (userJoinResponse.statusCode == 200) {
        Taro.removeStorageSync("invite_user_id");
        Taro.removeStorageSync("division_code");
        Taro.redirectTo({
          url: `/pages/user_request_verify/index`
        });
      } else {
        this.showToast("行政区加入失败");
      }
    }

    this.setState({
      isLoading: false
    });
  }

  render() {
    const placeholderStyle = "font-family:PingFang SC;color:rgba(178,184,198,1);text-align:right";
    const { avatar, nickname, userName, userTip, isLoading, selectDivision, superviseDepartment } = this.state;
    return (
      <View className="root">
        <View className="division">
          <View>
            <Image className="user_avatar" src={avatar}></Image>
            <View className="user-name">{nickname}</View>
          </View>
        </View>
        <View className="info_body">
          <View className="divider"></View>
          <View className="info_item required">
            <Text className={userTip ? "info_title_error" : "info_title"}>
              姓名
            </Text>
            <Input
              onInput={this.onUserNameChange.bind(this)} value={userName}
              onFocus={() => { this.setState({ userTip: false }) }}
              className="info_input" placeholder="请输入您的真实姓名" placeholderStyle={placeholderStyle} />
          </View>
          <View className="divider"></View>
          <View className="info_item required">
            <Text className="info_title">申请加入的地区</Text>
            <View className="department_group" onClick={this.toConstruction.bind(this)}>
              {
                !isEmpty(selectDivision) ? <Text className="info_value" >{selectDivision.name}</Text> : <Text className="info_placeholder" >请选择申请加入的地区</Text>
              }
              <AtIcon className="item_icon_style" value="chevron-right" size="20" color="#7A8499"></AtIcon>
            </View>
          </View>
          <View className="divider"></View>
          <View className="info_item required">
            <Text className="info_title">所在部门</Text>
            <View className='right' onClick={this.onDepartmentChange.bind(this, selectDivision.code)}>
              <Text className='right-label'>
                {isEmpty(superviseDepartment) ? '请选择您所在的部门' : superviseDepartment.name}
              </Text>
              <AtIcon
                className="item_icon_style"
                value="chevron-right"
                size="20"
                color="#7A8499"
              ></AtIcon>
            </View>
          </View>
          <View className="divider"></View>
        </View>
        <View className="view_foot">
          <AtButton
            loading={isLoading}
            className="view_foot_btn"
            type="primary"
            onClick={this.jumpToNext.bind(this)}
          >
            提交
          </AtButton>
        </View>
      </View>
    );
  }
}
export default UserJoin as ComponentType;
