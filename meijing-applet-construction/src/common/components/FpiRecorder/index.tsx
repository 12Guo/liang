import Taro, { Component } from '@tarojs/taro'
import { View } from '@tarojs/components'
import { Recorder } from '../recorder'
import './index.scss'

interface FpiRecorderProps {
    onCancel: () => void,
    onDone: (path: string | undefined, duration: number) => void,
}

interface FpiRecorderState {

}

export default class FpiRecorder extends Component<FpiRecorderProps, FpiRecorderState> {
    static externalClasses = ['com-class']
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    onMove = (e) => {
        e.stopPropagation()
        e.preventDefault()
    }

    /**
    * 录音完成
    */
    recoderFinish = (path: string | undefined, duration: number) => {
        if (path) {
            const { onDone } = this.props;
            onDone && onDone(path, duration);
        }
    }

    onMask = () => {
        const { onCancel } = this.props
        onCancel && onCancel()
    }

    render() {
        return (
            <View className='fpi-recorder com-class'>
                <View className='mask' onTouchMove={this.onMove} onClick={this.onMask}></View>
                <Recorder height={300} show={true} onFinish={this.recoderFinish} />
            </View>
        )
    }
}