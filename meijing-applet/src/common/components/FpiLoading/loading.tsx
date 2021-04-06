import { Component } from '@tarojs/taro'
import { View, Image } from '@tarojs/components'
import './loading.scss'

interface FpiLoadingProps {
    
}

interface FpiLoadingState {
    
}

export default class Loading extends Component<FpiLoadingProps, FpiLoadingState> {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <View className='fpi-loadingEx'>
                <Image className='img' src={require('./loading.svg')} />
            </View>
        )
    }
}