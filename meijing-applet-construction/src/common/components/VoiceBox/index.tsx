import Taro, { Component } from '@tarojs/taro'
import { View } from '@tarojs/components'
import './index.scss'

interface VoiceBoxProps {
    status: boolean
}

interface VoiceBoxState {
    
}

export default class VoiceBox extends Component<VoiceBoxProps, VoiceBoxState> {
    constructor(props) {
        super(props)
        this.state = {
            
        }
    }

    render() {
        const { status = false } = this.props;
        return (
            <View className={`voice-box ${status ? 'play' : ''}`}>
                <View className="wifi-symbol">
                    <View className="wifi-circle first"></View>
                    <View className="wifi-circle second"></View>
                    <View className="wifi-circle third"></View>
                </View>
            </View>
        )
    }
}