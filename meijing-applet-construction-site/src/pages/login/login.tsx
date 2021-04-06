import { ComponentType } from 'react'
import Taro, { Config } from '@tarojs/taro'
import { AtModal, AtModalContent, AtModalAction, AtButton } from 'taro-ui'
import { View, Button, Image } from '@tarojs/components'
import './login.scss'
import { observer, inject } from '@tarojs/mobx';
import { UserStore } from '../../common/store/user'
import { rootConstructionSourceBaseUrl } from '@common/utils/requests'

interface LoginProps {
    userStore: UserStore;
}

interface LoginState {
    isTipShow: boolean,
    isRegister: boolean,
    isLogin: boolean,
    divisionCode?: string,
    code?: string
}

interface Login {
    props: LoginProps;
    state: LoginState
}

@inject("userStore")
@observer
class Login extends Taro.Component {

    constructor() {
        super(...arguments)
        this.state = {
            isTipShow: false,
            isRegister: false,
            isLogin: false,
            code: ""
        }
    }

    componentWillMount() {
        let scene: string = Taro.getStorageSync("division_code");
        if (scene != null && scene != undefined && scene != "") {
            this.setState({
                divisionCode: scene
            })
        }
        if (this.$router.params.divisionCode) {
            Taro.setStorageSync("division_code", this.$router.params.divisionCode);
            this.setState({
                divisionCode: this.$router.params.divisionCode
            })
        }
        if (this.$router.params.value) {
            Taro.setStorageSync("invite_user_id", this.$router.params.value);
        }
    }

    config: Config = {
        navigationBarTitleText: '绿色工地管家',
        backgroundColor: '#ffffff'
    }

    // 登录
    onLogin = (res) => {
        const { userStore } = this.props;
        const { currentTarget: { userInfo } } = res;

        if (userInfo) {
            Taro.login().then(res => {
                if (res.code) {
                    this.setState({
                        code: res.code
                    });
                    userStore.login(res.code, (userDetails) => {
                        const { status, requestStatus } = userDetails;
                        if (status == 'COMMON' || requestStatus == "PASS") {
                            Taro.switchTab({ url: '/pages/index/index' });
                        } else if (requestStatus == 'CONFIRMING' || requestStatus == 'REJECT') {
                            Taro.redirectTo({ url: '/pages/user_request_verify/index' });
                        } else {
                            Taro.redirectTo({ url: '/pages/user_join/index' });
                        }
                    }, () => {
                        this.setState({
                            isRegister: true
                        })
                    })
                }
            });
        } else {
            this.setState({
                isTipShow: true
            })
        }
    }

    // 手机号登陆
    onPhone = (phoneRes) => {
        const { userStore } = this.props;
        const { code } = this.state;
        const { iv, encryptedData } = phoneRes.detail;
        if (phoneRes.detail.iv) {
            if (code) {
                userStore.loginByPhoneEncryption({ iv, encryptedData }, (userDetails) => {
                    const { requestStatus } = userDetails;
                    if (requestStatus == 'COMMON' || requestStatus == "PASS") {
                        Taro.switchTab({ url: '/pages/index/index' });
                    } else if (requestStatus == 'CONFIRMING' || requestStatus == 'REJECT') {
                        Taro.redirectTo({ url: '/pages/user_request_verify/index' });
                    } else {
                        Taro.redirectTo({ url: '/pages/user_join/index' });
                    }
                }, () => {
                    Taro.redirectTo({ url: "/pages/login/phoneLogin" });
                });
            }
        } else {
            this.onCancelRegister();
            Taro.navigateTo({ url: "/pages/login/phoneLogin" });
        }
    }

    // 重新用户授权再登录
    anthToLogin = (res) => {
        const { currentTarget: { userInfo } } = res;
        this.setState({
            isTipShow: false
        }, () => {
            if (userInfo) {
                this.onLogin(res);
            }
        });
    }

    // 取消授权
    handleCancel() {
        this.setState({
            isTipShow: false
        });
    }
    // 取消注册
    onCancelRegister() {
        this.setState({
            isRegister: false,
            isLogin: false
        })
    }
    render() {
        const { isRegister, isTipShow, isLogin } = this.state;
        return (
            <View className="root_view">
                <View className='head'>
                    <Image className='img' src={`${rootConstructionSourceBaseUrl}/assets/pages/login/login_logo2.png`} />
                    <Image className='img_info' src={`${rootConstructionSourceBaseUrl}/assets/pages/login/logo_info.png`} />
                </View>
                <View className='body'>
                    <AtButton className='loginBtn' type='primary' openType="getUserInfo" onGetUserInfo={this.onLogin}>微信一键登录</AtButton>
                </View>
                <AtModal isOpened={isTipShow} className='modelStyle'>
                    <AtModalContent>
                        <View className='model_body'>您点击了拒绝授权,无法正常显示个人信息,点击确定重新获取授权</View>
                    </AtModalContent>
                    <AtModalAction>
                        <Button onClick={this.handleCancel}>
                            <View className='model_cancel'>取消</View>
                        </Button>
                        <Button openType='getUserInfo' onGetUserInfo={this.anthToLogin}>
                            <View className='model_confirm'>确定</View>
                        </Button>
                    </AtModalAction>
                </AtModal>
                <AtModal isOpened={isRegister} className='modelStyle'>
                    <AtModalContent>
                        <View className='model_body'>登录失败，请重新验证你的手机号</View>
                    </AtModalContent>
                    <AtModalAction>
                        <Button onClick={this.onCancelRegister}>
                            <View className='model_cancel'>取消</View>
                        </Button>
                        <Button openType='getPhoneNumber' onGetPhoneNumber={this.onPhone}>
                            <View className='model_confirm'>重新验证</View>
                        </Button>
                    </AtModalAction>
                </AtModal>
                <AtModal isOpened={isLogin} className='modelStyle'>
                    <AtModalContent>
                        <View className='model_body'>当前账号已经存在，请直接登录</View>
                    </AtModalContent>
                    <AtModalAction>
                        <Button onClick={this.onCancelRegister}>
                            <View className='model_cancel'>取消</View>
                        </Button>
                        <Button onClick={this.onLogin}>
                            <View className='model_confirm'>登录</View>
                        </Button>
                    </AtModalAction>
                </AtModal>
            </View>
        )
    }
}


export default Login as ComponentType