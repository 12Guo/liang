import Taro, { Component } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import cn from 'classnames'
import { rootSourceBaseUrl } from "../../utils/requests";
import './index.scss'

interface FpiGuideProps {
    onCancel: () => void;
    onAllow: () => void;
}

interface FpiGuideState {
    show: boolean;
}

const MAP_ICON = {
    checked: `${rootSourceBaseUrl}/assets/user_request_verify/icon-checked.png`,
    uncheck: `${rootSourceBaseUrl}/assets/user_request_verify/icon-uncheck.png`
}

export default class FpiGuide extends Component<FpiGuideProps, FpiGuideState> {
    static externalClasses = ['com-class']
    constructor(props) {
        super(props)
        this.state = {
            show: false
        }
    }

    confirmHandle = () => {
        const { onAllow } = this.props
        this.setState({ show: false }, () => {
            setTimeout(() => {
                onAllow && onAllow()
            }, 300)
        })
    }

    cancelHandle = () => {
        const { onCancel } = this.props
        this.setState({ show: false }, () => {
            setTimeout(() => {
                onCancel && onCancel()
            }, 300)
        })
    }

    componentDidMount() {
        this.setState({
            show: true
        })
    }

    render() {
        const { show } = this.state
        return (
            <View className='fpi-guide com-class'>
                <View className='mask'></View>
                <View className={cn('fpi-guide__modal', { show: show })}>
                    <View className='header'>
                        <Image
                            className="header-img"
                            src={`${rootSourceBaseUrl}/assets/user_request_verify/icon-logo.png`}
                        />
                        <Text className='header-txt'>易美境申请</Text>
                    </View>
                    <Text className='notice'>发送一次以下消息通知</Text>
                    <View className='remind'>
                        <Image
                            className="remind-img"
                            src={MAP_ICON['checked']}
                        />
                        <Text className='remind-txt'>申请审核结果提醒</Text>
                    </View>
                    <View className='btns'>
                        <Text className='btn' onClick={this.cancelHandle}>取消</Text>
                        <Text className='btn confirm' onClick={this.confirmHandle}>允许</Text>
                    </View>
                    <View className='inquiry'>
                        <Image
                            className="inquiry-img"
                            src={MAP_ICON['uncheck']}
                        />
                        <Text className='inquiry-txt'>总是保持以上选择，不再询问</Text>
                    </View>
                </View>
            </View>
        )
    }
}