import { ComponentType } from "react";
import Taro, { Config } from "@tarojs/taro";
import { AtButton } from "taro-ui";
import { sendVerifyCode, bindUserPhone } from "../../service/userBaseInfo";
import { View, Text, Input } from "@tarojs/components";
import { isRelease } from '@common/utils/requests'
import "./index.scss";
import { navBackWithData } from '@common/utils/common';

interface UserPhoneProps { }

interface UserPhoneState {
  userPhone: string;
  isLoading: false;
  phoneTip?: string;
  resultTip?: string;
  currentSecond: number;
  verifyCodeTip: string;
  isCanGetVeifyCode: boolean;
  verifyCode: string;
  registerToken: string;
}

interface UserUploadInfo {
  props: UserPhoneProps;
  state: UserPhoneState;
}

class UserUploadInfo extends Taro.Component {
  config: Config = {
    navigationBarTitleText: "填写手机号"
  };

  constructor() {
    super(...arguments);
    this.state = {
      userPhone: "",
      isLoading: false,
      currentSecond: 59,
      verifyCodeTip: "获取验证码",
      isCanGetVeifyCode: true,
      verifyCode: "",
      registerToken: ""
    };
  }

  onPhoneChange(res) {
    this.setState({
      userPhone: res.detail.value,
      phoneTip: null
    });
  }

  onVerifyCode(res) {
    this.setState({
      verifyCode: res.detail.value,
      resultTip: null
    });
  }

  //倒计时
  countTime() {
    let timer = setInterval(() => {
      this.setState(
        {
          isCanGetVeifyCode: false,
          verifyCodeTip: this.state.currentSecond + "s重新获取",
          currentSecond: this.state.currentSecond - 1
        },
        () => {
          if (this.state.currentSecond == -1) {
            clearInterval(timer);
            this.setState({
              currentSecond: 59,
              verifyCodeTip: "获取验证码",
              isCanGetVeifyCode: true
            });
          }
        }
      );
    }, 1000);
  }

  componentDidCatchError(error) {
    console.log(error);
    if (!isRelease) {
      Taro.showToast({
        title: JSON.stringify(error),
        mask: true,
        icon: "none",
        duration: 2000
      });
    }
  }

  onGetVerifyCode(e) {
    const { userPhone, isCanGetVeifyCode } = this.state;
    if (!isCanGetVeifyCode) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    if (userPhone == "") {
      this.setState({
        phoneTip: "请输入手机号码"
      });
      return;
    }
    if (!userPhone.match(new RegExp("^[1][3-8][0-9]{9}$"))) {
      this.setState({
        phoneTip: "您输入的手机号码格式不对"
      });
      return;
    }
    this.countTime();
    const reSendVerify = Taro.getStorageSync("reSendVerify");
    let userDetailPhone = Taro.getStorageSync('userDetailPhone')
    let isRegister: boolean = true;
    if (reSendVerify && userDetailPhone && userDetailPhone == userPhone) {
      isRegister = false;
    }
    sendVerifyCode(userPhone, isRegister).then(res => {
      if (res.statusCode != 200) {
        this.setState({
          resultTip: "验证码发送失败"
        });
      }
    });
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  componentWillMount() {
    let registerToken = this.$router.params.registerToken;
    if (registerToken) {
      this.setState({
        registerToken: registerToken
      });
    }
  }

  jumpToNext() {
    const { verifyCode, userPhone, registerToken } = this.state;
    if (userPhone == "") {
      this.setState({
        phoneTip: "请输入手机号"
      });
      return;
    }
    if (verifyCode == "") {
      this.setState({
        resultTip: "请输入验证码"
      });
      return;
    }
    bindUserPhone(userPhone, verifyCode, registerToken).then(res => {
      if (res.statusCode == 200) {
        navBackWithData({
          userPhone: userPhone
        });
      } else {
        this.setState({
          resultTip: "手机号码绑定失败"
        });
      }
    });
  }

  render() {
    const {
      isLoading,
      phoneTip,
      resultTip,
      verifyCodeTip,
      isCanGetVeifyCode
    } = this.state;
    const placeholderStyle =
      "font-family:PingFang SC;color:rgba(178,184,198,1);text-align:left";
    return (
      <View className="root_view">
        <View className="input_group">
          <Input
            className="input_phone"
            type="number"
            placeholderStyle={placeholderStyle}
            placeholder="请输入手机号"
            onInput={this.onPhoneChange}
          ></Input>
          {phoneTip && <Text className="tip">{phoneTip}</Text>}
          <View className="verify_group">
            <Input
              className="input_phone"
              type="number"
              placeholderStyle={placeholderStyle}
              placeholder="请输入验证码"
              onInput={this.onVerifyCode}
            ></Input>
            <Text
              className={isCanGetVeifyCode ? "verify_btn" : "verify_btn_sended"}
              onClick={this.onGetVerifyCode}
            >
              {verifyCodeTip}
            </Text>
          </View>
          {resultTip && <Text className="tip">{resultTip}</Text>}
        </View>
        <View className="view_foot">
          <AtButton
            loading={isLoading}
            className="view_foot_btn"
            type="primary"
            onClick={this.jumpToNext.bind(this)}
          >
            确定
          </AtButton>
        </View>
      </View>
    );
  }
}

export default UserUploadInfo as ComponentType;
