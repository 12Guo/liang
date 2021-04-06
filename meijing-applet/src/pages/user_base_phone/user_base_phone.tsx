import { ComponentType } from 'react'
import Taro, { Config } from '@tarojs/taro'
import { AtButton, AtInput, AtMessage } from 'taro-ui'
import { View, Image, Text } from '@tarojs/components'
import './user_base_phone.scss'
import { UserStore } from '@common/store/user';
import { rootSourceBaseUrl, isRelease } from '@common/utils/requests'
import { sendVerifyCode, updateUserPhone, decryptPhone } from '../../service/userBaseInfo'
import { observer, inject } from '@tarojs/mobx';
import { SystemInfoStore } from '@common/store/systeminfo'
import { navBackWithData } from '@common/utils/common'

interface UserBasePhoneProps {
    systemInfoStore: SystemInfoStore;
    userStore: UserStore;
}

interface UserBasePhoneState {
    verifyCode: string,
    windowHeight?: number,
    enterPhone: string,
    weixinPhone?: string,
    selectOtherPhone: boolean,
    weChatImageUrl: any,
    otherPhoneImageUrl: any,
    isShowWechatWarnTip: boolean,
    isShowOtherPhoneWarnTip: boolean,
    otherPhoneWarnTip: string,
    verifyCodeTip: string,
    currentSecond: number,
    isCanGetVeifyCode: boolean
}

interface UserBasePhone {
    props: UserBasePhoneProps;
    state: UserBasePhoneState;
}
//图标引用
const checkedImage = rootSourceBaseUrl + '/assets/user_base_phone/checked.png';
const uncheckedImage = rootSourceBaseUrl + '/assets/user_base_phone/unchecked.png';

@inject("systemInfoStore")
@inject("userStore")
@observer
class UserBasePhone extends Taro.Component {

    config: Config = {
        navigationBarTitleText: '选择手机号',
    }

    constructor() {
        super(...arguments)
        this.state = {
            enterPhone: "",
            selectOtherPhone: false,
            weChatImageUrl: checkedImage,
            otherPhoneImageUrl: uncheckedImage,
            isShowWechatWarnTip: false,
            isShowOtherPhoneWarnTip: false,
            otherPhoneWarnTip: "",
            verifyCodeTip: "获取验证码",
            currentSecond: 59,
            isCanGetVeifyCode: false,
            verifyCode: ""
        }
    }

    //选择其他手机号
    onCheckOtherPhone() {
        this.setState({
            weChatImageUrl: uncheckedImage,
            otherPhoneImageUrl: checkedImage,
            selectOtherPhone: true
        })
    }
    //选择绑定微信手机号码
    onCheckBindWechatPhone() {
        this.setState({
            weChatImageUrl: checkedImage,
            otherPhoneImageUrl: uncheckedImage,
            selectOtherPhone: false
        })
    }
    getPhoneNumber = (res) => {
        decryptPhone(res.detail.encryptedData, res.detail.iv).then(phone => {
            if (phone.phoneNumber && phone.phoneNumber.length >= 11) {
                this.setState({
                    weixinPhone: phone.phoneNumber
                })
            }
        })
    }

    //输入手机号码
    onInputPhone(res) {
        this.setState({
            isShowOtherPhoneWarnTip: false
        })
        this.setState({
            enterPhone: res
        })
    }

    //输入验证码
    onInputVerifyCode(res) {
        this.setState({
            isShowOtherPhoneWarnTip: false
        })
        this.setState({
            verifyCode: res
        })
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

    //获取屏幕高度
    componentWillMount() {
        const { systemInfoStore } = this.props;
        //设置屏幕高度
        this.setState({
            windowHeight: systemInfoStore.getSystemInfo.windowHeight
        })
    }

    //获取验证码
    getVerifyCode() {
        if (this.state.enterPhone == "") {
            this.setState({
                otherPhoneWarnTip: "请输入您手机号码,并进行验证",
                isShowOtherPhoneWarnTip: true
            })
        } else {
            this.countTime();
            sendVerifyCode(this.state.enterPhone, true).then((res) => {
                if (res.statusCode != 200) {
                    this.setState({
                        otherPhoneWarnTip: res.data.message,
                        isShowOtherPhoneWarnTip: true
                    })
                }
            })
        }
    }

    //倒计时
    countTime() {
        let timer = setInterval(() => {
            this.setState({
                isCanGetVeifyCode: true,
                verifyCodeTip: (this.state.currentSecond + "s重新获取"),
                currentSecond: (this.state.currentSecond - 1)
            }, () => {
                if (this.state.currentSecond == -1) {
                    clearInterval(timer);
                    this.setState({
                        currentSecond: 59,
                        verifyCodeTip: "获取验证码",
                        isCanGetVeifyCode: false
                    })
                }
            })
        }, 1000)
    }

    jumpToNext() {
        const { userStore } = this.props;
        const { enterPhone, verifyCode, weixinPhone } = this.state;
        if (this.state.selectOtherPhone) {
            if (enterPhone == "") {
                this.setState({
                    otherPhoneWarnTip: "请输入您手机号码,并进行验证",
                    isShowOtherPhoneWarnTip: true
                })
            } else if (verifyCode == "") {
                this.setState({
                    otherPhoneWarnTip: "请输入您收到的验证码",
                    isShowOtherPhoneWarnTip: true
                })
            } else {
                updateUserPhone(enterPhone, verifyCode).then((res) => {
                    if (res.statusCode == 200) {
                        userStore.userDetails.phone = enterPhone;
                        Taro.setStorageSync("userDetails", userStore.userDetails);
                        navBackWithData({});
                    } else {
                        this.setState({
                            otherPhoneWarnTip: "验证码错误或失效,请重新输入",
                            isShowOtherPhoneWarnTip: true
                        })
                    }
                })
            }
        } else {
            if (weixinPhone) {
                userStore.userDetails.phone = weixinPhone;
                Taro.setStorageSync("userDetails", userStore.userDetails);
                navBackWithData({});
            } else {
                this.setState({
                    isShowWechatWarnTip: true
                })
            }
        }
    }

    render() {
        const placeholderCss = "color:#B2B8C6;font-size:16px;text-align:left;background:#F2F4F7";
        const { weixinPhone } = this.state
        return (
            <View className='bg_view' style={'width:100%;height:' + (this.state.windowHeight) + "px"}>
                <AtMessage />
                <View className="space_view"></View>
                <View className="control_bg">
                    <Image className="item_img" src={this.state.weChatImageUrl} onClick={this.onCheckBindWechatPhone}></Image>
                    <Text className="item_text" onClick={this.onCheckBindWechatPhone}>微信绑定手机号</Text>

                    <View className="item_view" style={'display:' + (this.state.selectOtherPhone ? 'none' : 'inline')}>
                        <View className="item_phone_group">
                            <Text className="item_phone_tip">{weixinPhone || '尚未获取微信权限'}</Text>
                            <View className="item_phone_btn">
                                <AtButton size="normal" openType="getPhoneNumber" onGetPhoneNumber={this.getPhoneNumber} type='secondary'>立即获取</AtButton>
                            </View>
                        </View>
                        <View className="item_warn_view" style={'display:' + (this.state.isShowWechatWarnTip ? 'inline' : 'none')}>
                            请获取微信授权绑定的手机号
                        </View>
                    </View>
                    <View className="border_view"></View>
                    <View>
                        <Image className="item_img" src={this.state.otherPhoneImageUrl} onClick={this.onCheckOtherPhone}></Image>
                        <Text className="item_text" onClick={this.onCheckOtherPhone}>使用其他手机号</Text>
                        <View style={'display:' + (this.state.selectOtherPhone ? 'inline' : 'none')}>
                            <View className="item_view">
                                <View className="item_otherPhone_group">
                                    <AtInput
                                        className="item_otherPhone_phone"
                                        name='phone'
                                        type='phone'
                                        placeholder='请输入手机号码'
                                        placeholderStyle={placeholderCss}
                                        onChange={this.onInputPhone.bind(this)}
                                    />
                                </View>
                            </View>
                            <View className="item_view">
                                <View className="item_otherPhone_group">
                                    <AtInput
                                        className="item_otherPhone_verifyCode"
                                        name='phone'
                                        type='number'
                                        placeholder='请输入验证码'
                                        placeholderStyle={placeholderCss}
                                        onChange={this.onInputVerifyCode.bind(this)}
                                    />
                                    <View className={this.state.isCanGetVeifyCode ? "item_verifyCode_btn_gray" : "item_verifyCode_btn"}>
                                        <AtButton size="normal" type='secondary' disabled={this.state.isCanGetVeifyCode} onClick={this.getVerifyCode.bind(this)}>{this.state.verifyCodeTip}</AtButton>
                                    </View>
                                </View>
                            </View>
                            <View className="item_warn_view" style={'display:' + (this.state.isShowOtherPhoneWarnTip ? 'inline' : 'none')}>
                                {this.state.otherPhoneWarnTip}
                            </View>
                        </View>
                    </View>
                </View>
                <View className="view_foot">
                    <AtButton className="view_foot_btn" type='primary' onClick={this.jumpToNext.bind(this)}>确定</AtButton>
                </View>
            </View>
        )
    }

}

export default UserBasePhone as ComponentType