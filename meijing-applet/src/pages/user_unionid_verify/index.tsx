import Taro, { Component, Config } from '@tarojs/taro';
import { observer, inject } from '@tarojs/mobx';
import { View, Text, Image, Button } from '@tarojs/components';
import { AtButton, AtModal, AtModalContent, AtModalAction } from 'taro-ui'
import { rootSourceBaseUrl } from '@common/utils/requests'
import './index.scss'

interface UserUnionIdProps {
    userStore: any;
}

interface UserUnionIdState {
    showPop: boolean;
}

@inject('userStore')
@observer
class UserUnionIdPage extends Component<UserUnionIdProps, UserUnionIdState> {
    config: Config = {
        navigationBarTitleText: '个人信息更新'
    }

    static externalClasses = ['com-class']

    constructor(props) {
        super(props);

        this.state = {
            showPop: false
        }
    }

    componentDidMount() {

    }

    /**
     * 弹窗切换
     */
    onSwitchPop = (status: boolean) => {
        this.setState({
            showPop: status
        })
    }

    //登录
    onLogin = () => {
        const { userStore } = this.props;
        userStore.grantUnionId((userDetails) => {
            const { status } = userDetails
            if (status == 'COMMON') {
                Taro.switchTab({ url: '/pages/task_dispatch_new/index' });
            } else if (status == 'ACTIVE_DIVISION_REQUESTING' || status == 'JOIN_DIVISION_REQUESTING') {
                Taro.redirectTo({ url: '/pages/user_request_verify/index' });
            } else {
                Taro.redirectTo({ url: '/pages/login/login' });
            }
        })
    }

    //授权
    onGetUserInfo = (res) => {
        this.setState({
            showPop: false
        }, () => {
            const { currentTarget: { userInfo } } = res;
            //判断是否确定授权
            if (userInfo) {
                this.onLogin();
            }
        })
    }

    render() {
        const { showPop } = this.state;
        return (
            <View className='unionid-page'>
                <Image className='img' src={`${rootSourceBaseUrl}/assets/common/user_unionid.png`} />
                <Text className='txt'>为了保证您可以收到相关的消息通知</Text>
                <Text className='txt'>需要重新获取您的基本用户信息</Text>
                <AtButton className='btn' type='secondary' onClick={this.onSwitchPop.bind(this, true)}>获取基本信息</AtButton>

                <AtModal className='popUp' isOpened={showPop}>
                    <AtModalContent>
                        <View className='txt'>为了保证您可以使用小程序</View>
                        <View className='txt'>请先更新您的基本信息</View>
                    </AtModalContent>
                    <AtModalAction>
                        <Button onClick={this.onSwitchPop.bind(this, false)}>取消</Button>
                        <Button openType='getUserInfo' onGetUserInfo={this.onGetUserInfo}>确定</Button>
                    </AtModalAction>
                </AtModal>
            </View>
        );
    }
}

export default UserUnionIdPage;