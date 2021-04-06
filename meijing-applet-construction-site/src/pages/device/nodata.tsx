import Taro, { Component, Config } from '@tarojs/taro';
import { observer, inject } from '@tarojs/mobx';
import { View } from '@tarojs/components';
import NoData from '@common/components/NoData'
import './index.scss'

interface NoDataProps {
    userStore: any;
}

interface NoDataState {
    
}


@inject('userStore')
@observer
class NoDataPage extends Component<NoDataProps, NoDataState> {
    config: Config = {
        navigationBarTitleText: '在线监测'
    }

    static externalClasses = ['com-class']

    constructor(props) {
        super(props);

        this.state = {
            
        }
    }

    render() {
        return (
            <View className='no-data'>
                <NoData />
            </View>
        );
    }
}

export default NoDataPage;