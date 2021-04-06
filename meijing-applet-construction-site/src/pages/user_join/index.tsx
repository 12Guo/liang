/* eslint-disable jsx-quotes */
import Taro, { Config } from "@tarojs/taro";
import { ComponentType } from "react";
import { View, Image, Text, Input } from "@tarojs/components";
import "./index.scss";
import { AtButton, AtIcon } from "taro-ui";
import { observer, inject } from "@tarojs/mobx";
import { UserStore } from "@common/store/user";
import { getCurrentPage } from "@common/utils/common"
import { get } from "lodash";

interface UserJoinProps {
  userStore: UserStore;
}

interface UserJoinState {
  avatar: string,
  nickname: string,
  userName: string;
  userTip: boolean;
  tenantId: string;
  tenantCode: string,
  tenantName: string,
  selectedDepartment: {
    departmentCode: string,
    departmentName: string,
  }
  isLoading: boolean
}

interface UserJoin {
  props: UserJoinProps;
  state: UserJoinState;
}

// const defaultDepartment: DepartmentInfo = {
//   id: -1,
//   name: "其他"
// };

@inject("userStore")
@observer
class UserJoin extends Taro.Component {
  constructor() {
    super(...arguments);
    this.state = {
      avatar: "",
      nickname: "",
      userTip: false,
      userName: "",
      tenantId: "",
      tenantCode: "",
      tenantName: "",
      selectedDepartment: {
        departmentCode: "-1",
        departmentName: "其它"
      },
      isLoading: false
    };
  }

  config: Config = {
    navigationBarTitleText: "申请加入工地"
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
    let {departmentCode="", departmentName="", tenantCode="", tenantName="", tenantId=""} = getCurrentPage().data;
    if(tenantCode != this.state.tenantCode){
      departmentCode = "";
      departmentName = "";
    }
    this.setState({
      tenantId: tenantId,
      tenantCode: tenantCode,
      tenantName: tenantName,
      selectedDepartment: {
        departmentCode,
        departmentName
      }
    });
  }

  // 输入名字
  onUserNameChange(e){
    this.setState({
      userName: e.target.value,
    });
  }
  // 去选择工地
  toConstruction(){
    Taro.navigateTo({ url: `/pages/user_construction/index` });
  }
  // 去选择部门
  toDepartment(){
    const tenantCode = this.state.tenantCode;
    if(tenantCode === "") {
      this.showToast("请先选择工地哦");
      return;
    }
    Taro.navigateTo({ url: `/pages/department_select/index?divisionCode=${tenantCode}` });
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

  jumpToNext() {
    try{
      const { userName, selectedDepartment, tenantCode, tenantName} = this.state;
      console.log(userName)
      const reg = /\s/g;
      if(userName === ""){
        this.showToast("请输入您的名字");
        return;
      }
      if(reg.test(userName) === true){
        this.showToast("名字不可包含空格");
        return;
      }
      if(tenantCode === ""){
        this.showToast("未选择需加入的工地");
        return;
      }
      if(selectedDepartment.departmentCode === ""){
        this.showToast("未选择需加入的部门");
        return;
      }
      const { userJoinRequest, userDetails } = this.props.userStore;

      this.setState({
        isLoading: true
      }, async () => {
        try{
          const response = await userJoinRequest({
            userId: userDetails.simpleUserInfo.userId,
            userName,
            tenantCode,
            tenantName,
            ...selectedDepartment
          });
          this.setState({
            isLoading: false
          });
          if (response.data.success === true) {
            Taro.reLaunch({ url: "/pages/user_join_success/index" });
          }
        } catch (error) {
          this.setState({
            isLoading: false
          });
          this.showToast(get(error, 'data.message', "发生异常，请重新登录"));
        }
      })
    } catch (error) {
      this.setState({
        isLoading: false
      });
      this.showToast(get(error, 'data.message', "发生异常，请重新登录"));
    }
  }

  render() {
    const placeholderStyle = "font-family:PingFang SC;color:rgba(178,184,198,1);text-align:right";
    const { selectedDepartment, avatar, nickname, userName, userTip, tenantName, isLoading } = this.state;
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
              onFocus={() => {this.setState({ userTip: false })}}
              className="info_input" placeholder="请输入您的真实姓名" placeholderStyle={placeholderStyle} />
          </View>
          <View className="divider"></View>
          <View className="info_item required">
            <Text className="info_title">所属工地</Text>
            <View className="department_group" onClick={this.toConstruction.bind(this)}>
              {
                tenantName ? (
                  <Text className="info_value" >{tenantName}</Text>
                ) : (
                  <Text className="info_placeholder" >请选择你所在工地</Text>
                )
              }
              <AtIcon className="item_icon_style" value="chevron-right" size="20" color="#7A8499"></AtIcon>
            </View>
          </View>
          <View className="divider"></View>
          <View className="info_item required">
            <Text className="info_title">所在部门</Text>
            <View className="department_group" onClick={this.toDepartment.bind(this)}>
              {selectedDepartment.departmentCode ? (
                <Text className="info_value">{selectedDepartment.departmentName}</Text>
              ) : (
                  <Text className="info_placeholder">请选择您所在的部门（必填）</Text>
              )}
              <AtIcon
                className="item_icon_style"
                value="chevron-right"
                color="#7A8499"
                size="20"
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
