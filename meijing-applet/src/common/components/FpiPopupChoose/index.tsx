import Taro, { Component } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { AtModal, AtModalContent } from "taro-ui"
import cn from 'classnames'
import './index.scss'

interface FpiPopupChooseProps {
    range: any[],
    rangeKey: string,
    value: number | string,
    onChange: (item: any) => void,
}

interface FpiPopupChooseState {
    isOpened: boolean,
    currentValue: number | string,
}

export default class FpiPopupChoose extends Component<FpiPopupChooseProps, FpiPopupChooseState> {
    static externalClasses = ['com-class']
    constructor(props) {
        super(props)
        this.state = {
            isOpened: false,
            currentValue: props.value
        }
    }

    onChoose = (index: number, e) => {
        e.stopPropagation()
        const { onChange } = this.props
        if (onChange) {
            this.setState({
                isOpened: false
            }, onChange.bind(this, { detail: { value: index } }))
        }
    }

    onOpen = () => {
        this.setState({
            isOpened: true
        })
    }

    onClose = (e) => {
        e.stopPropagation()
        this.setState({
            isOpened: false
        })
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.value != this.props.value) {
            this.setState({
                currentValue: nextProps.value
            })
        }
    }

    render() {
        const { range = [], rangeKey } = this.props
        const { isOpened, currentValue } = this.state;
        return (
            <View className='fpi-choose com-class' onClick={this.onOpen}>
                {this.props.children}
                <AtModal
                    closeOnClickOverlay
                    className='popUp'
                    isOpened={isOpened}>
                    <AtModalContent>
                        <View className='popUp__header'>
                            <Text className='title'>选择污染类型</Text>
                            <View className='close' onClick={this.onClose}></View>
                        </View>
                        <View className='popUp__body'>
                            {
                                range.map((item, index) => (
                                    <Text key={item.id} className={cn('list-item', { active: item.id == currentValue })} onClick={this.onChoose.bind(this, index)}>{item[rangeKey]}</Text>
                                ))
                            }
                        </View>
                    </AtModalContent>
                </AtModal>
            </View>
        )
    }
}