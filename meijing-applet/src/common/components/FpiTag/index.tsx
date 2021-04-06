import Taro, { Component } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import './index.scss'

interface FpiTagProps {
    icon: string,
    onClick: () => void,
}

interface FpiTagState {

}

export default class FpiTag extends Component<FpiTagProps, FpiTagState> {
    static externalClasses = ['com-class']
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    onClickHandle = () => {
        const { onClick } = this.props
        onClick && onClick()
    }

    render() {
        const { icon } = this.props
        return (
            <View className='fpi-tag com-class' onClick={this.onClickHandle}>
                <View className='icon' style={{ backgroundImage: `url(${icon})` }}></View>
                <Text className='text'>{this.props.children}</Text>
            </View>
        )
    }
}