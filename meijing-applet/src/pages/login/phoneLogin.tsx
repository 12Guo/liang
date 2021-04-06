import Taro, { Config } from '@tarojs/taro'
import { ComponentType } from 'react'
import { observer, inject } from '@tarojs/mobx';
import { UserStore } from '@common/store/user'
import { AtButton } from 'taro-ui'
import './phoneLogin.scss'
import { rootSourceBaseUrl } from '@common/utils/requests'
import { View, Image, Input } from '@tarojs/components';

interface PhoneLoginProps {
    userStore: UserStore;
}

interface PhoneLoginState {
    phone: string,
    password: string
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
            phone: "",
            password: ""
        }
    }

    config: Config = {
        navigationBarTitleText: '登录',
        backgroundColor: '#ffffff'
    }

    //登陆
    onLogin() {
        const { userStore } = this.props;
        const { phone, password } = this.state;
        userStore.loginByPhone(phone, password, (userDetails) => {
            const { status, divisionCode } = userDetails

            if (status == 'COMMON' || (status == 'EXTERNAL' && divisionCode)) {
                Taro.switchTab({ url: '/pages/task_dispatch_new/index' });
            } else if (status == 'ACTIVE_DIVISION_REQUESTING' || status == 'JOIN_DIVISION_REQUESTING' || status == 'JOIN_DIVISION_REQUESTING') {
                Taro.redirectTo({ url: '/pages/user_request_verify/index' });
            } else {
                Taro.redirectTo({ url: '/pages/login/login' });
            }
        })
    }

    //手机号输入监听
    onPhoneInput(res) {
        this.setState({
            phone: res.detail.value
        })
    }

    //密码输入监听
    onPasswordInput(res) {
        this.setState({
            password: res.detail.value
        })
    }

    render() {
        const placeholderInput = "font-size: 16px;font-family: PingFang SC;font-weight: 400;line-height: 16px;color: #B2B8C6;";
        return (
            <View className="root_view">
                <View className="head">
                    <Image className="logo" src={`${rootSourceBaseUrl}/assets/login/phone_login/logo.png`}></Image>
                </View>
                <View className="body">
                    <View className="group">
                        <Input type='text' onInput={this.onPhoneInput} className="simple_input" placeholder='请输入手机号' placeholderStyle={placeholderInput}></Input>
                        <Input type='text' password onInput={this.onPasswordInput} className="simple_input" placeholder='请输入密码' placeholderStyle={placeholderInput}></Input>
                    </View>
                    <AtButton className='loginBtn' type='primary' onClick={this.onLogin.bind(this)}>登录</AtButton>
                </View>
            </View>
        )
    }

}

export default PhoneLogin as ComponentType