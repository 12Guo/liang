import { ComponentType } from 'react'
import Taro, { Config } from '@tarojs/taro'
import { View, Image, Text } from '@tarojs/components'
import './index.scss'
import { rootSourceBaseUrl } from '@common/utils/requests'

const working = rootSourceBaseUrl + "/assets/task_dispatch/working.png";

class Default extends Taro.Component {

    constructor() {
        super(...arguments)
        this.state = {
        }
    }

    config: Config = {
        navigationBarTitleText: '开发中',
    }

    render() {
        return (
            <View className='root'>
                <View className="imageContent">
                    <Image className="image" src={working}></Image>
                </View>
                <Text className="name">功能正在开发中,敬请期待</Text>
            </View>
        )
    }

}

export default Default as ComponentType