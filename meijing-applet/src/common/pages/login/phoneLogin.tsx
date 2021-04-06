import Taro, { Config } from '@tarojs/taro'
import { ComponentType } from 'react'
import { observer, inject } from '@tarojs/mobx';
import { UserStore } from '../../store/user'
import { AtButton } from 'taro-ui'
import './phoneLogin.scss'
import { rootSourceBaseUrl } from '../../utils/requests'
import { View, Image, Input, Text } from '@tarojs/components';
import { isRelease } from "../../utils/requests";
import { sendVerifyCode, bindUserPhone } from "../../../service/userBaseInfo";
import { navBackWithData } from "../../utils/common";

interface PhoneLoginProps {
    userStore: UserStore;
}

interface PhoneLoginState {
    userPhone: string;
    isLoading: false;
    phoneTip?: string;
    resultTip?: string;
    currentSecond: number;
    verifyCodeTip: string;
    isCanGetVeifyCode: boolean;
    verifyCode: string;
}

interface PhoneLogin {
    props: PhoneLoginProps;
    state: PhoneLoginState
}

@inject("userStore")
@observer
class PhoneLogin extends Taro.Component {
    constructor() {
        super(...arguments)
        this.state = {
            userPhone: "",
            isLoading: false,
            currentSecond: 59,
            verifyCodeTip: "获取验证码",
            isCanGetVeifyCode: true,
            verifyCode: "",
        }
    }

    config: Config = {
        navigationBarTitleText: '',
        backgroundColor: '#ffffff'
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

    // 验证码倒计时
    countTime() {
        let timer = setInterval(() => {
        this.setState({
            isCanGetVeifyCode: false,
            verifyCodeTip: this.state.currentSecond + "s重新获取",
            currentSecond: this.state.currentSecond - 1
        }, () => {
            if (this.state.currentSecond == -1) {
                clearInterval(timer);
                this.setState({
                currentSecond: 59,
                verifyCodeTip: "获取验证码",
                isCanGetVeifyCode: true
                });
            }
        });}, 1000);
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
    // 获取验证码
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
        let isRegister: boolean = true;
        if (reSendVerify) {
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

    jumpToNext() {
      const { verifyCode, userPhone } = this.state;
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
      const { loginByPhoneVerify } = this.props.userStore;
      loginByPhoneVerify(userPhone, verifyCode, () => {
        Taro.navigateTo({ url: "/pages/user_join/index" });
      }, (error) => { 
        if(error.data.code == "1005"){
          this.setState({
            resultTip: error.data.message
          });
        }
      });
    }

    render() {
        const { phoneTip, resultTip, verifyCodeTip } = this.state;
        const placeholderInput = "font-size: 16px;font-family: PingFang SC;font-weight: 400;line-height: 16px;color: #B2B8C6;";
        return (
            <View className="root_view">
                <View className="body">
                    <View className="title">请绑定手机号</View>
                    <View className="group">
                        <Input type='text' onInput={this.onPhoneChange.bind(this)} className="simple_input" placeholder='请输入手机号' placeholderStyle={placeholderInput}></Input>
                        {phoneTip && <View className="tip">{phoneTip}</View>}
                        <View className="code">
                            <Input type='text' onInput={this.onVerifyCode.bind(this)} className="code_input " placeholder='请输入验证码' placeholderStyle={placeholderInput}></Input>
                            <Text className="has-code" onClick={this.onGetVerifyCode.bind(this)}>{verifyCodeTip}</Text>
                        </View>
                        {resultTip && <View className="tip">{resultTip}</View>}
                    </View>
                    <AtButton className='loginBtn' type='primary' onClick={this.jumpToNext.bind(this)}>确认绑定</AtButton>
                    {/* <AtButton className='loginBtn weixin-login' type='primary' onClick={this.jumpToNext.bind(this)}>微信一键绑定</AtButton> */}
                </View>
            </View>
        )
    }

}

export default PhoneLogin as ComponentType