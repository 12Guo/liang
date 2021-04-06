/* eslint-disable jsx-quotes */
import Taro, { Config } from "@tarojs/taro";
import { ComponentType } from "react";
import { View, Image, Text, Input, Button } from "@tarojs/components";
import "./index.scss";
import {
  AtModal,
  AtModalContent,
  AtModalAction,
  AtButton,
  AtIcon,
  AtFloatLayout
} from "taro-ui";
import { Location } from "../../model";
import { observer, inject } from "@tarojs/mobx";
import { UserStore } from '@common/store/user';
import { getPageData, clearValueInPageData } from '@common/utils/common';
import { getAddressByLocationFromTencentMap } from '@common/utils/mapUtils';
import {
  getLocation,
  getParentsOpenDivision
} from "../../service/userDivision";
import { getDivision } from "../../service/division";
import {
  updateCurrentUserInfo,
  userJoinDivisionRequest,
  uploadDivisionActiveRequest,
  decryptPhone,
  UserInfo,
  UserJoinDivisionRequestEntry
} from "../../service/userBaseInfo";
import { rootSourceBaseUrl } from '@common/utils/requests';
import { Division } from '@common/utils/divisionUtils';

import isEmpty from 'lodash/isEmpty';
import cn from 'classnames'

interface UserJoinProps {
  userStore: UserStore;
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

//用户手机号码校验信息
interface RegisterEncryptPhoneData {
  encryptedData: string;
  iv: string;
  registerToken: string;
}

interface UserJoinState {
  //勾选阅读协议的图片地址
  checkImageUrl: string;
  //是否显示阅读文档
  isDocOpen: boolean;
  //是否显示加载中
  isLoading: boolean;
  //被邀请加入的行政区划
  divisionCode: string | null;
  //用户手机号
  userPhone: string;
  //用户名
  userName: string;
  //用户名提示
  userNameTip?: string;
  //用户手机号提示
  userPhoneTip?: string;
  //选择的行政区
  selectDivision: Division | null;
  //用户安全信息
  registerEncryptPhoneData: RegisterEncryptPhoneData | null;
  //是否是激活行政区
  isActive: boolean;
  //选择的部门
  superviseDepartment: any;
}

interface UserJoin {
  props: UserJoinProps;
  state: UserJoinState;
}

//图标引用
const checkedImage =
  rootSourceBaseUrl + "/assets/user_upload_info/checkbox.png";
const uncheckedImage =
  rootSourceBaseUrl + "/assets/user_upload_info/checkbox-un.png";
const divisionSelect =
  rootSourceBaseUrl + "/assets/user_join/division_select.png";
//选择其他行政区
const selectOther = rootSourceBaseUrl + "/assets/user_join/select_other.png";

@inject("userStore")
@observer
class UserJoin extends Taro.Component {
  constructor() {
    super(...arguments);
    this.state = {
      checkImageUrl: checkedImage,
      isDocOpen: false,
      isLoading: false,
      divisionCode: null,
      userPhone: "",
      userName: "",
      selectDivision: null,
      registerEncryptPhoneData: null,
      isActive: false,
      superviseDepartment: {},
    };
  }

  config: Config = {
    navigationBarTitleText: "申请加入"
  };

  async componentDidMount() {
    let divisionCode = Taro.getStorageSync('division_code')
    if (divisionCode != undefined && divisionCode != "") {
      let openDivisionResp = await getParentsOpenDivision(divisionCode);
      let openDivision: Division =
        openDivisionResp == null ? null : openDivisionResp.data;
      this.setState({
        selectDivision: openDivision,
        divisionCode: divisionCode
      });
    } else {
      setTimeout(() => {
        this.setLocationAddress()
        if (Taro.getStorageSync('token')) {
          this.setUserPhone()
        }
      }, 500)
    }
  }

  async setUserPhone() {
    const { userStore } = this.props;
    userStore.getSimpleUserInfo(userInfo => {
      this.setState({
        userPhoneTip: null,
        userPhone: userInfo.phone ? userInfo.phone : ""
      })
      if (userInfo.phone) {
        Taro.setStorageSync("userDetailPhone", userInfo.phone);
      }
    })
  }

  async setLocationAddress() {
    let location: Location;
    try {
      location = await getLocation();
    } catch (error) {
      console.log(error)
      return;
    }

    let addressResponse = await getAddressByLocationFromTencentMap(
      location.latitude,
      location.longitude
    );
    let currentDivisionCode =
      addressResponse.data.result.address_reference.town.id;
    //由于位置过于偏僻导致腾讯地图逆解析获取不到行政区
    if (currentDivisionCode == null) {
      currentDivisionCode =
        addressResponse.data.result.ad_info.adcode + "000000";
    } else {
      currentDivisionCode += "000";
    }
    let openDivisionResp = await getParentsOpenDivision(currentDivisionCode);
    let openDivision: Division =
      openDivisionResp == null ? null : openDivisionResp.data;
    if (openDivision) {
      this.setState({
        selectDivision: openDivision,
        divisionCode: openDivision.code
      })
    }
  }

  componentDidShow() {
    const { selectDivision, selectDepartmentData } = getPageData();
    console.log(JSON.stringify(getPageData()));
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
    
    const { userPhone } = getPageData();

    if (userPhone) {
      let userInfo: RegisterRequest = Taro.getStorageSync("registerInfo");
      userInfo.phone = userPhone;
      Taro.setStorageSync("registerInfo", userInfo);
      this.setState({
        userPhoneTip: null,
        userPhone: userPhone ? userPhone : ""
      });
    }

    clearValueInPageData(['selectDivision', 'selectDepartmentData']);
  }

  //选择行政区
  onSelectDivision() {
    Taro.navigateTo({
      url: "/pages/division_select/index"
    });
  }

  async componentWillMount() {
    Taro.setStorageSync("isRegiste", true);
    let divisionCode =
      this.$router.params.divisionCode || this.state.divisionCode;
    //邀请加入
    if (divisionCode) {
      this.setState({
        divisionCode: divisionCode
      });
      getDivision(divisionCode).then(divisionResponse => {
        if (divisionResponse.statusCode == 200) {
          this.setState({
            selectDivision: divisionResponse.data,
            divisionCode: divisionCode
          });
        }
      });
    }
    await Taro.getUserInfo().then(res => {
      let registerInfo = {
        nickname: res.userInfo.nickName,
        avatar: res.userInfo.avatarUrl,
        sex: res.userInfo.gender,
        city: res.userInfo.city,
        province: res.userInfo.province,
        rawData: res.rawData,
        signature: res.signature,
        encryptedData: res.encryptedData,
        iv: res.iv
      };

      Taro.setStorageSync("registerInfo", registerInfo);
      this.setState({
        registerEncryptPhoneData: {
          encryptedData: res.encryptedData,
          iv: res.iv
        }
      });
    });
    // await this.login();
  }

  componentWillUnmount() {
    Taro.removeStorageSync('phoneInfo')
  }

  async login() {
    const phoneInfo = Taro.getStorageSync('phoneInfo')
    if (phoneInfo) {
      this.getPhoneNumber(phoneInfo)
    }
  }

  getPhoneNumber = res => {
    const { registerEncryptPhoneData } = this.state;
    if (res.detail.encryptedData && registerEncryptPhoneData) {
      decryptPhone(
        res.detail.encryptedData,
        res.detail.iv,
        registerEncryptPhoneData.registerToken
      ).then(phoneRes => {
        if (phoneRes.phone && phoneRes.phone.length >= 11) {
          this.setState({
            userPhone: phoneRes.phone
          });
        }
        let userInfo: RegisterRequest = Taro.getStorageSync("registerInfo");
        userInfo.phone = phoneRes.phone;
        Taro.setStorageSync("registerInfo", userInfo);
        this.setState({
          userPhoneTip: null
        });
      });
    } else { }
  };


  //修改是否阅读
  onChangeCheckedState() {
    if (this.state.checkImageUrl == checkedImage) {
      this.setState({
        checkImageUrl: uncheckedImage
      });
    } else {
      this.setState({
        checkImageUrl: checkedImage
      });
    }
  }

  onOpenDoc() {
    let path = `negotiate-doc?title=${encodeURIComponent("用户协议")}`;
    Taro.navigateTo({
      url: "/common/pages/webview/index?url=" + encodeURIComponent(path)
    });
  }

  onCloseDoc() {
    this.setState({
      isDocOpen: false
    });
  }

  onUserNameChange(res) {
    this.setState({
      userName: res.detail.value,
      userNameTip: null
    });
  }

  //显示提示
  showToast(tip) {
    Taro.showToast({
      title: tip,
      mask: true,
      icon: "none",
      duration: 2000
    });
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

  async jumpToNext() {
    const { selectDivision } = this.state;
    const {
      userName,
      divisionCode,
      userPhone,
      superviseDepartment,
      checkImageUrl,
    } = this.state;
    if (checkImageUrl != checkedImage) {
      this.showToast("请勾选同意相关协议");
      return;
    }
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
    // if (userPhone == "") {
    //   this.setState({
    //     userPhoneTip: "请填写手机号"
    //   });
    //   this.showToast("请填写手机号");
    //   return;
    // }
    if (isEmpty(superviseDepartment)) {
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
      userPhone,
      superviseDepartment
    } = this.state;
    const registerRequest: RegisterRequest = Taro.getStorageSync(
      "registerInfo"
    );
    if (divisionCode == null) {
      this.showToast("请选择行政区划");
      return;
    }
    const isReSendVerify = Taro.getStorageSync("reSendVerify");
    //判断是否是重新提交的申请
    if (!isReSendVerify) {
      // await userStore.register(
      //   registerRequest,
      //   () => { },
      //   () => {
      //     this.showToast("用户注册失败");
      //     return;
      //   }
      // );
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
      console.log(userStore, "userStore", superviseDepartment)
      //加入行政区
      let userJoinRequest: UserJoinDivisionRequestEntry = {
        // @ts-ignore
        userId: userStore.userDetails.id || null,
        userName: userName,
        // phone: userPhone,
        tenantCode: divisionCode,
        divisionName: "",
        departmentId: superviseDepartment ? superviseDepartment.id : null,
        departmentName: superviseDepartment ? superviseDepartment.name : null,
        departmentCode: superviseDepartment ? superviseDepartment.code : null,
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

  //取消激活
  onCancelActive() {
    this.setState({
      isActive: false
    });
  }

  //确定激活
  async onSureActive() {
    this.onActiveOrJoinDivision(true);
  }

  render() {
    const {
      superviseDepartment,
      checkImageUrl,
      isLoading,
      isDocOpen,
      selectDivision,
      userNameTip,
      userPhoneTip,
      userPhone,
      isActive,
    } = this.state;
    const placeholderStyle =
      "font-family:PingFang SC;color:rgba(178,184,198,1);text-align:right";
    const placeholderStyleLeft =
      "font-family:PingFang SC;color:rgba(178,184,198,1);text-align:left;font-size:15px";
    const doc = "<<相关协议>>";
    const activeDivisionName = selectDivision
      ? `【${selectDivision.name}】`
      : "";

    return (
      <View className="root">
        <View className="division">
          {selectDivision == null && (
            <View className="center_select" onClick={this.onSelectDivision}>
              <Image className="img" src={divisionSelect}></Image>
              <View className="tip">选择申请加入的行政区</View>
            </View>
          )}
          {selectDivision != null && (
            <View className="division_select">
              <View className="head">
                <Text className="title">申请加入的区域</Text>
                <View className="select_other" onClick={this.onSelectDivision}>
                  <Text>选择其他区域</Text>
                  <Image className="img" src={selectOther}></Image>
                </View>
              </View>
              <View className="current_division">{selectDivision.name}</View>
            </View>
          )}
        </View>
        <View className="info_body">
          <View className="info_item">
            <Text className="info_tip">填写个人信息</Text>
          </View>
          <View className="divider"></View>
          <View className="info_item required">
            <Text className={userNameTip ? "info_title_error" : "info_title"}>
              真实姓名
            </Text>
            <Input
              onInput={this.onUserNameChange}
              className="info_input"
              placeholder="请输入您的真实姓名"
              placeholderStyle={placeholderStyle}
            ></Input>
          </View>
          {/* <View className="divider"></View> */}
          <View className="info_item required" style={{display:'none'}}>
            <Text className={userPhoneTip ? "info_title_error" : "info_title"}>
              手机号
            </Text>
            {userPhone == "" ? (
              <Button
                className="info_btn"
                openType="getPhoneNumber"
                onGetPhoneNumber={this.getPhoneNumber}
              >
                获取手机号
              </Button>
            ) : (
                <Text className="info_value">{userPhone}</Text>
              )}
          </View>
          <View className="divider"></View>
          <View className="info_item required">
            <Text className="info_title">所属部门</Text>
            <View className='right' onClick={this.onDepartmentChange.bind(this, selectDivision.code)}>
              <Text className={cn('right-label', { 'right-label__selected': !isEmpty(superviseDepartment) })}>
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
        </View>
        <View className="view_foot">
          <View className="readDoc">
            <Image
              className="checkedImage"
              src={checkImageUrl}
              onClick={this.onChangeCheckedState}
            ></Image>
            <Text className="doc_tip" onClick={this.onOpenDoc}>
              同意<Text className="doc_tip_blue">{doc}</Text>
            </Text>
          </View>
          <AtButton
            loading={isLoading}
            className="view_foot_btn"
            type="primary"
            onClick={this.jumpToNext.bind(this)}
          >
            提交
          </AtButton>
        </View>
        <AtFloatLayout
          isOpened={isDocOpen}
          title="相关协议"
          onClose={this.onCloseDoc.bind(this)}
        ></AtFloatLayout>
        <AtModal isOpened={isActive} className="modelStyle">
          <AtModalContent>
            <View className="tip_content">
              <View className="model_body">确认激活?</View>
              <View className="model_detail">{activeDivisionName}</View>
            </View>
          </AtModalContent>
          <AtModalAction>
            <Button onClick={this.onCancelActive}>
              <View className="model_cancel">取消</View>
            </Button>
            <Button onClick={this.onSureActive}>
              <View className="model_confirm">确定</View>
            </Button>
          </AtModalAction>
        </AtModal>
      </View>
    );
  }
}
export default UserJoin as ComponentType;
