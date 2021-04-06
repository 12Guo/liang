import Taro, { Config } from "@tarojs/taro";
import { ComponentType } from "react";
import { AtButton } from "taro-ui";
import { rootSourceBaseUrl } from "@common/utils/requests";
import { View, Image, Text, OfficialAccount } from "@tarojs/components";
import "./index.scss";
import { observer, inject } from "@tarojs/mobx";
import { UserStore } from "../../common/store/user";
import FpiGuide from '@common/components/FpiGuide';

interface UserRequestVerifyProps {
  userStore: UserStore;
}

interface UserRequestVerifyState {
  status: | "CONFIRMING" | "PASS" | "REJECT";
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
      status: "CONFIRMING",
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
        status: userDetails.requestStatus,
        loading: false
      });
    });
  }

  //重新发送审核请求
  reSendVerify() {
    Taro.redirectTo({
      url: `/pages/user_join/index`
    });
  }

  //进入小程序
  enter() {
    Taro.switchTab({
      url: "/pages/index/index"
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
    const { status, loading, showGuide } = this.state;
    return (
      <View className="root">
        <View className="image_group">
          {(status === "CONFIRMING") && (
              <Image
                className="img"
                src={`${rootSourceBaseUrl}/assets/user_request_verify/request_verify.png`}
              />
            )}
          {status == "REJECT" && (
            <Image
              className="img"
              src={`${rootSourceBaseUrl}/assets/user_request_verify/verify_faild.png`}
            />
          )}
          {status == "PASS" && (
            <Image
              className="img"
              src={`${rootSourceBaseUrl}/assets/user_request_verify/user_join_pass.png`}
            />
          )}
        </View>
        {status == "CONFIRMING" && (
          <View className="verifying">
            <Text className="title">加入申请提交成功</Text>
            <Text className="tip">管理员将会对您提交的资料进行审批</Text>
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
        {status == "REJECT" && (
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
        {status == "PASS" && (
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
