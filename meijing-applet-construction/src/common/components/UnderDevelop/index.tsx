import Taro, { Component } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import './index.scss'

interface UnderDevelopProps {
    onClick: () => void,
}

interface UnderDevelopState {

}

export default class UnderDevelop extends Component<UnderDevelopProps, UnderDevelopState> {
    static externalClasses = ['com-class']
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    onClickHandle = () => {
        Taro.navigateBack()
    }

    render() {
        return (
            <View className='under-develop com-class' onClick={this.onClickHandle}>
                <View className='icon'></View>
                <Text className='text'>该功能正在开发中，敬请期待</Text>
                <View className='btn'>返回</View>
            </View>
        )
    }
}