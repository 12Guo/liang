import Taro, { Component } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import cn from 'classnames'
import './monitor.scss'

interface NoDataProps {
    onClick?: () => void,
    text: string,
    showBack: boolean,
    isVideo?: boolean,
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
        const { text, showBack = false, isVideo = false } = this.props
        return (
            <View className='no-data com-class' onClick={this.onClickHandle}>
                <View className={cn('icon', { 'icon__video': isVideo })}></View>
                <Text className='text'>{text}</Text>
                {showBack && <View className='btn'>返回</View>}
            </View>
        )
    }
}