import { ComponentType } from 'react'
import Taro, { Config } from '@tarojs/taro'
import { View, Image, Text } from '@tarojs/components'
import './index.scss'
import { rootSourceBaseUrl } from '../../utils/requests'
import { observer, inject } from '@tarojs/mobx';
import { UserStore } from '../../store/user'
import { getSystemName, isOldVersion } from '../../utils/common'

interface WelcomeProps {
    userStore: UserStore;
}

interface WelcomeState {

}

interface Welcome {
    props: WelcomeProps;
    state: WelcomeState;
}

const welcomeImageUrl = rootSourceBaseUrl + '/assets/welcome/welcome-new.png';

@inject("userStore")
@observer
class Welcome extends Taro.Component {
    constructor() {
        super(...arguments)
        this.state = {}
    }

    config: Config = {
        navigationBarTitleText: getSystemName(),
    }

    componentDidShow() {
        //@ts-ignore
        const { userStore: { isLoggedIn, userDetails: { status, divisionCode, requestStatus } } } = this.props;
        // Taro.switchTab({ url: "/pages/index/index" })

        // if (!isLoggedIn) {
        //     Taro.redirectTo({ url: '/pages/login/login' });
        // } else if (status == 'COMMON' || (status == 'EXTERNAL' && divisionCode)) {
        //     if (isOldVersion() && Taro.getStorageSync('appKey') === 'yimeijing-applet') {
        //         Taro.switchTab({ url: '/pages/task_dispatch_new/index' });
        //     }
        //     else {
        //         Taro.switchTab({ url: '/pages/index/index' });
        //     }
        // } else if (status == 'TENANT_JOIN_REQUESTING' || status == 'TENANT_JOIN_REJECT' || status == 'JOIN_DIVISION_REQUESTING' || status == 'DIVISION_JOIN_REJECT') {
        //     Taro.redirectTo({ url: '/pages/user_request_verify/index' });
        // } else if (status === "EXTERNAL" || status === null) {
        //     Taro.redirectTo({ url: '/pages/user_join/index' });
        // }
        if (!isLoggedIn) {
            Taro.redirectTo({ url: '/pages/login/login' });
        }
        else if (isOldVersion()) {
            if (status == 'COMMON' || (status == 'EXTERNAL' && divisionCode)) {
                if (Taro.getStorageSync('appKey') === 'yimeijing-applet') {
                    Taro.switchTab({ url: '/pages/task_dispatch_new/index' });
                }
                else {
                    Taro.switchTab({ url: '/pages/index/index' });
                }
            }
            else if (status === "EXTERNAL" || status === null) {
                Taro.redirectTo({ url: '/pages/user_join/index' });
            }
        }
        else {
            if (status == 'COMMON' || requestStatus == "PASS") {
                Taro.switchTab({ url: '/pages/index/index' });
            } else if (requestStatus == 'CONFIRMING' || requestStatus == 'REJECT') {
                Taro.redirectTo({ url: '/pages/user_request_verify/index' });
            } else {
                Taro.redirectTo({ url: '/pages/user_join/index' });
            }
        }
    }

    componentWillMount() {
        Taro.setNavigationBarTitle({ title: getSystemName() })
    }

    render() {
        return (
            <View className='root'>
                <View className="imageContent">
                    <Image className="image" src={welcomeImageUrl}></Image>
                </View>
                <Text className="name">{getSystemName()}</Text>
            </View>
        )
    }
}

export default Welcome as ComponentType