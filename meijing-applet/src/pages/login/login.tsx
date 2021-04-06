import { ComponentType } from 'react'
import Taro, { Config } from '@tarojs/taro'
import { AtModal, AtModalContent, AtModalAction, AtButton } from 'taro-ui'
import { View, Button, Image, Text } from '@tarojs/components'
import './login.scss'
import { observer, inject } from '@tarojs/mobx';
import { UserStore } from '@common/store/user'
import { rootSourceBaseUrl } from '@common/utils/requests'

interface LoginProps {
    userStore: UserStore;
}

interface LoginState {
    isTipShow: boolean,
    isRegister: boolean,
    isLogin: boolean,
    divisionCode?: string,
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
        navigationBarTitleText: '易美境',
        backgroundColor: '#ffffff'
    }

    //注册
    onGetUserInfo = (res) => {
        const { userStore } = this.props;
        const { currentTarget: { userInfo } } = res;
        //判断是否确定授权
        if (userInfo) {
            //判断用户是否存在
            Taro.login().then(res => {
                if (res.code) {
                    userStore.login(res.code, () => {
                        this.setState({
                            isLogin: true
                        })
                    }, () => {
                        Taro.redirectTo({ url: '/pages/user_join/index' });
                    })
                }
            })
        } else {
            this.setState({
                isTipShow: true
            })
        }
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
                        const { status, divisionCode } = userDetails;
                        if (status == 'COMMON' || (status == 'EXTERNAL' && divisionCode)) {
                            Taro.switchTab({ url: '/pages/task_dispatch_new/index' });
                        } else if (status == 'TENANT_JOIN_REQUESTING' || status == 'TENANT_JOIN_REJECT' || status == 'JOIN_DIVISION_REQUESTING' || status == 'DIVISION_JOIN_REJECT') {
                            Taro.redirectTo({ url: '/pages/user_request_verify/index' });
                        } else if (status === "EXTERNAL" || status === null) {
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

    //直接登录操作
    onLoginIn = () => {
        Taro.getUserInfo().then(res => this.onLogin({ currentTarget: { userInfo: res.userInfo } }))
    }

    // 手机号登陆
    onPhone = (phoneRes) => {
        const { userStore } = this.props;
        const { code } = this.state;
        const { iv, encryptedData } = phoneRes.detail;
        if (phoneRes.detail.iv) {
            if (code) {
                userStore.loginByPhoneEncryption({ iv, encryptedData }, (userDetails) => {
                    const { status: requestStatus } = userDetails;
                    if (requestStatus == 'COMMON' || requestStatus == "PASS") {
                        Taro.switchTab({ url: '/pages/task_dispatch_new/index' });
                    } else if (requestStatus == 'CONFIRMING' || requestStatus == 'REJECT' || requestStatus == 'JOIN_DIVISION_REQUESTING' || requestStatus == 'DIVISION_JOIN_REJECT') {
                        Taro.redirectTo({ url: '/pages/user_request_verify/index' });
                    } else {
                        Taro.setStorageSync('phoneInfo', phoneRes)
                        Taro.redirectTo({ url: '/pages/user_join/index' });
                    }
                }, () => {
                    // Taro.redirectTo({ url: "/pages/login/phoneLogin" });
                });
            }
        } else {
            this.onCancelRegister();
            // Taro.navigateTo({ url: "/pages/login/phoneLogin" });
        }
    }

    //取消授权
    handleCancel() {
        this.setState({
            isTipShow: false
        })
        // Taro.openSetting({})
    }

    //取消注册
    onCancelRegister() {
        this.setState({
            isRegister: false,
            isLogin: false
        })
    }

    //手机号登陆
    phoneLogin() {
        Taro.redirectTo({ url: '/pages/login/phoneLogin' });
    }
    render() {
        const { isRegister, isTipShow, isLogin } = this.state;
        return (
            <View className="root_view">
                <View className='head'>
                    <Image className='img' src={`${rootSourceBaseUrl}/assets/login/login_logo.png`} />
                </View>
                <View className='body'>
                    {/* <AtButton className='loginBtn' type='primary' onClick={this.onLogin}>微信登录</AtButton> */}
                    <AtButton className='loginBtn' type='primary' openType='getUserInfo' onGetUserInfo={this.onLogin}>微信登录</AtButton>
                    {/* <AtButton className='register' type='secondary' openType='getUserInfo' onGetUserInfo={this.onGetUserInfo}>没有账号？使用微信注册</AtButton> */}
                    <Text className="phoneLogin" onClick={this.phoneLogin}>已有账号，手机号登录</Text>
                </View>
                <AtModal isOpened={isTipShow} className='modelStyle'>
                    <AtModalContent>
                        <View className='model_body'>您点击了拒绝授权,无法正常显示个人信息,点击确定重新获取授权</View>
                    </AtModalContent>
                    <AtModalAction>
                        <Button onClick={this.handleCancel}>
                            <View className='model_cancel'>取消</View>
                        </Button>
                        <Button openType='getUserInfo' onGetUserInfo={this.onGetUserInfo}>
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
                        <Button onClick={this.onLoginIn}>
                            <View className='model_confirm'>登录</View>
                        </Button>
                    </AtModalAction>
                </AtModal>
            </View>
        )
    }
}


export default Login as ComponentType