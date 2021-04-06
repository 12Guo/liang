import Taro, { Component, Config } from '@tarojs/taro';
import { observer, inject } from '@tarojs/mobx';
import { View } from '@tarojs/components';
import UnderDevelop from '@common/components/UnderDevelop'
import './index.scss'

interface SprayProps {
    userStore: any;
}

interface SprayState {
    
}


@inject('userStore')
@observer
class SprayPage extends Component<SprayProps, SprayState> {
    config: Config = {
        navigationBarTitleText: '智慧喷淋'
    }

    static externalClasses = ['com-class']

    constructor(props) {
        super(props);

        this.state = {
            
        }
    }

    render() {
        return (
            <View className='spray-page'>
                <UnderDevelop />
            </View>
        );
    }
}

export default SprayPage;