import Taro, { Component } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import './index.scss'

interface NoDataProps {
    onClick?: () => void,
}

interface NoDataState {

}

export default class NoData extends Component<NoDataProps, NoDataState> {
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
            <View className='no-data com-class' onClick={this.onClickHandle}>
                <View className='icon'></View>
                <Text className='text'>该工地暂无监测设备</Text>
                <View className='btn'>返回</View>
            </View>
        )
    }
}