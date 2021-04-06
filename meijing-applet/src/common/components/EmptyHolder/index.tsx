import Taro, { Component } from '@tarojs/taro'
import { View, Image, Text } from '@tarojs/components'
import { rootSourceBaseUrl } from '@common/utils/requests'
import './index.scss'

interface EmptyHolderProps {
    text?: string
}

interface EmptyHolderState {

}

export default class EmptyHolder extends Component<EmptyHolderProps, EmptyHolderState> {
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    render() {
        const { text } = this.props;
        return (
            <View className='empty-holder'>
                <Image className='img' src={`${rootSourceBaseUrl}/empty2.png`} />
                <Text className='txt'>{text}</Text>
            </View>
        )
    }
}