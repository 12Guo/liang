import Taro, { Component } from '@tarojs/taro'
import { View } from '@tarojs/components'
import './indexEx.scss'

interface VoiceBoxExProps {
    status: boolean
}

interface VoiceBoxExState {
    
}

export default class VoiceBoxEx extends Component<VoiceBoxExProps, VoiceBoxExState> {
    constructor(props) {
        super(props)
        this.state = {
            
        }
    }

    render() {
        const { status = false } = this.props;
        return (
            <View className={`voice ${status ? 'play' : ''}`}>
                <View className="bg voicePlay"></View>
            </View>
        )
    }
}