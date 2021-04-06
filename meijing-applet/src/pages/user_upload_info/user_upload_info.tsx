import { ComponentType } from 'react'
import Taro, { Config } from '@tarojs/taro'
import { AtSteps, AtButton } from 'taro-ui'
import { View, Image, Text } from '@tarojs/components'
import './user_upload_info.scss'
import { rootSourceBaseUrl } from '@common/utils/requests'
import { observer, inject } from '@tarojs/mobx';
import { SystemInfoStore } from '@common/store/systeminfo'
import { UserStore } from '@common/store/user';

interface UserBasePhoneProps {
    systemInfoStore: SystemInfoStore,
    userStore: UserStore
}

interface UserBasePhoneState {
    windowHeight?: number,
    current: number,
    success_info: string,
    success_detail: string
}

interface UserUploadInfo {
    props: UserBasePhoneProps;
    state: UserBasePhoneState;
}

//上传成功 icon
const uploadSuccessImage = rootSourceBaseUrl + '/assets/user_upload_info/upload_success.png';

@inject("userStore")
@inject("systemInfoStore")
@observer
class UserUploadInfo extends Taro.Component {

    config: Config = {
        navigationBarTitleText: '填写信息',
        navigationBarBackgroundColor: '#107EFF',
        navigationBarTextStyle: 'white'
    }

    constructor() {
        super(...arguments)
        this.state = {
            current: 2,
            success_info: '激活申请提交成功',
            success_detail: '后台运营人员会尽快联系您进行审核'
        }
    }

    componentWillMount() {
        const { systemInfoStore } = this.props;
        Taro.getStorage({ key: 'isDivisinActive' }).then((res) => {
            if (res.data) {
                this.setState({
                    "success_info": "加入申请提交成功",
                    "success_detail": "区域管理员将会对您提交的资料进行审核"
                })
            }
        })
        if (this.$router.params.isShare && this.$router.params.isShare == "true") {
            this.setState({
                "success_info": "加入申请提交成功",
                "success_detail": "区域管理员将会对您提交的资料进行审核"
            })
        }
        Taro.removeStorageSync('isDivisinActive')
        //设置屏幕高度
        this.setState({
            windowHeight: systemInfoStore.getSystemInfo.windowHeight
        })
    }

    onChangeStep() {

    }

    //我知道了
    jumpToNext() {
        const { userStore } = this.props;
        userStore.getUserDetails();
        Taro.redirectTo({
            url: "/pages/user_request_verify/index"
        })
    }


    render() {
        const items = [
            { 'title': '选择区域' },
            { 'title': '个人资料' },
            { 'title': '提交' }
        ]
        return (
            <View className='bg_view'>
                <AtSteps
                    className='step'
                    items={items}
                    current={this.state.current}
                    onChange={this.onChangeStep.bind(this)}
                />
                <View className="bg_view" style={'width:100%;height:' + (this.state.windowHeight) + "px"}>
                    <View className="view_space"></View>
                    <View className="view_icon">
                        <Image className="item_img" src={uploadSuccessImage}></Image>
                    </View>
                    <View className="view_success_info">
                        <Text className="success_info">{this.state.success_info}</Text>
                    </View>
                    <View className="view_success_detail">
                        <Text className='success_detail'>{this.state.success_detail}</Text>
                    </View>
                    <View className="view_btn">
                        <AtButton className="view_foot_btn" type='secondary' onClick={this.jumpToNext.bind(this)}>我知道了</AtButton>
                    </View>
                </View>
            </View>
        )
    }

}

export default UserUploadInfo as ComponentType