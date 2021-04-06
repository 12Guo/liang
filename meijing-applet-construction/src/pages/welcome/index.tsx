import { ComponentType } from 'react'
import Taro, { Config } from '@tarojs/taro'
import { View, Image, Text } from '@tarojs/components'
import './index.scss'
import { rootSourceBaseUrl } from '@common/utils/requests'
import { observer, inject } from '@tarojs/mobx';
import { UserStore } from '../../store/user'

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
        this.state = {
        }
    }

    config: Config = {
        navigationBarTitleText: '',
    }

    componentWillMount() {
        // const { userStore } = this.props;
        // userStore.load();
    }

    componentDidShow() {
        const { userStore: { isLoggedIn, userDetails: { status } } } = this.props
        if (!isLoggedIn) {
            Taro.redirectTo({ url: '/pages/login/login' });
        } else if (status == 'COMMON') {
            Taro.switchTab({ url: '/pages/index/index' });
        } else if (status == 'ACTIVE_DIVISION_REQUESTING' || status == 'JOIN_DIVISION_REQUESTING') {
            Taro.redirectTo({ url: '/pages/user_request_verify/index' });
        } else {
            Taro.redirectTo({ url: '/pages/user_join/index' });
        }
    }

    render() {
        return (
            <View className='root'>
                <View className="imageContent">
                    <Image className="image" src={welcomeImageUrl}></Image>
                </View>
                <Text className="name">美境绿色工地</Text>
            </View>
        )
    }

}

export default Welcome as ComponentType