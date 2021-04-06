import Taro, { Component } from '@tarojs/taro'
import { View } from '@tarojs/components'
import { AtModal } from "taro-ui"
import './index.scss'

interface FpiConfirmProps {
    title: string,
    content: string,
    isOpened: boolean,
    onConfirm: () => void,
    onCancel: () => void,
}

interface FpiConfirmState {

}

export default class FpiConfirm extends Component<FpiConfirmProps, FpiConfirmState> {
    static externalClasses = ['com-class']
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    handleClose = () => {
        this.props.onCancel()
    }

    handleCancel = () => {
        this.props.onCancel()
    }

    handleConfirm = () => {
        this.props.onConfirm()
    }

    render() {
        const { title, content, isOpened } = this.props
        return (
            <View className='fpi-confirm com-class'>
                <AtModal
                    isOpened={isOpened}
                    title={title}
                    cancelText='取消'
                    confirmText='确认'
                    onClose={this.handleClose}
                    onCancel={this.handleCancel}
                    onConfirm={this.handleConfirm}
                    content={content}
                />
            </View>
        )
    }
}