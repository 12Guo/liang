import Taro, { Config } from "@tarojs/taro";
import { ComponentType } from "react";
import { AtButton } from "taro-ui";
import { rootSourceBaseUrl } from '@common/utils/requests';
import { View, Image, Text, OfficialAccount } from "@tarojs/components";
import "./index.scss";
import { observer, inject } from "@tarojs/mobx";
import { UserStore } from '@common/store/user';
import FpiGuide from '@common/components/FpiGuide';

interface UserRequestVerifyProps {
  userStore: UserStore;
}

interface UserRequestVerifyState {
  userStatus:
  | "EXTERNAL"
  | "COMMON"
  | "ACTIVE_DIVISION_REQUESTING"
  | "DIVISION_JOIN_REJECT"
  | "JOIN_DIVISION_REQUESTING";
  loading: boolean;
  showGuide: boolean;
}

interface UserRequestVerify {
  props: UserRequestVerifyProps;
  state: UserRequestVerifyState;
}

@inject("userStore")
@observer
class UserRequestVerify extends Taro.Component {
  constructor() {
    super(...arguments);
    this.state = {
      userStatus: "COMMON",
      loading: false,
      showGuide: false
    };
  }

  config: Config = {
    navigationBarTitleText: "申请审核"
  };

  componentWillMount() {
    this.refreshStatus();
  }

  //刷新状态
  refreshStatus() {
    const { userStore } = this.props;
    this.setState({
      loading: true
    });
    userStore.getUserDetails(userDetails => {
      this.setState({
        userStatus: userDetails.status,
        loading: false
      });
    });
  }

  //重新发送审核请求
  reSendVerify() {
    Taro.setStorageSync("reSendVerify", true);
    Taro.redirectTo({
      url: `/pages/user_join/index`
    });
  }

  //进入小程序
  enter() {
    Taro.removeStorageSync("reSendVerify");
    Taro.switchTab({
      url: "/pages/task_dispatch_new/index"
    });
  }

  onGuideCancel = () => {
    this.setState({
      showGuide: false
    })
  }

  onGuideAllow = () => {
    this.setState({
      showGuide: false
    })
  }

  render() {
    const { userStatus, loading, showGuide } = this.state;
    return (
      <View className="root">
        <View className="image_group">
          {(userStatus == "ACTIVE_DIVISION_REQUESTING" ||
            userStatus == "JOIN_DIVISION_REQUESTING") && (
              <Image
                className="img"
                src={`${rootSourceBaseUrl}/assets/user_request_verify/request_verify.png`}
              />
            )}
          {userStatus == "DIVISION_JOIN_REJECT" && (
            <Image
              className="img"
              src={`${rootSourceBaseUrl}/assets/user_request_verify/verify_faild.png`}
            />
          )}
          {userStatus == "COMMON" && (
            <Image
              className="img"
              src={`${rootSourceBaseUrl}/assets/user_request_verify/user_join_pass.png`}
            />
          )}
        </View>
        {userStatus == "JOIN_DIVISION_REQUESTING" && (
          <View className="verifying">
            <Text className="title">加入申请提交成功</Text>
            <Text className="tip">区域管理员将会对您提交的资料进行审批</Text>
            <AtButton
              loading={loading}
              className="refresh_btn"
              type="secondary"
              onClick={this.refreshStatus.bind(this)}
            >
              刷新审核状态
            </AtButton>
          </View>
        )}
        {userStatus == "ACTIVE_DIVISION_REQUESTING" && (
          <View className="verifying">
            <Text className="title">激活申请提交成功</Text>
            <Text className="tip">后台运营人员会尽快联系您进行审核</Text>
            <AtButton
              loading={loading}
              className="refresh_btn"
              type="secondary"
              onClick={this.refreshStatus.bind(this)}
            >
              刷新审核状态
            </AtButton>
          </View>
        )}
        {userStatus == "DIVISION_JOIN_REJECT" && (
          <View className="verify_faild">
            <Text className="title">审核不通过</Text>
            <Text className="tip">您提交的信息有误，请重新提交申请</Text>
            <AtButton
              className="refresh_btn"
              type="secondary"
              onClick={this.reSendVerify.bind(this)}
            >
              重新提交
            </AtButton>
          </View>
        )}
        {userStatus == "COMMON" && (
          <View className="verify_faild">
            <Text className="title">审核通过</Text>
            <AtButton
              loading={loading}
              className="refresh_btn"
              type="secondary"
              onClick={this.enter.bind(this)}
            >
              进入小程序
            </AtButton>
          </View>
        )}
        <OfficialAccount className="focus-comp" />
        {showGuide && <FpiGuide onCancel={this.onGuideCancel} onAllow={this.onGuideAllow.bind(this)} />}
      </View>
    );
  }
}
export default UserRequestVerify as ComponentType;
