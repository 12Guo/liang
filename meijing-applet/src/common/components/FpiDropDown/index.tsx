import Taro, { Component } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import get from 'lodash/get'
import cn from 'classnames'
import './index.scss'

interface DropDownProps {
    source: any[],
    value: string | number,
    onChange: (item: any) => void,
}

interface DropDownState {
    open: boolean
}

export default class FpiDropDown extends Component<DropDownProps, DropDownState> {
    static externalClasses = ['com-class']
    constructor(props) {
        super(props)
        this.state = {
            open: false
        }
    }

    onSwitch = () => {
        const { open } = this.state
        this.setState({
            open: !open
        })
    }

    onItem = (item) => {
        this.setState({
            open: false
        }, this.props.onChange.bind(this, item.value))
    }

    onMask = () => {
        this.setState({
            open: false
        })
    }

    render() {
        const { source = [], value } = this.props
        const { open } = this.state
        const currentItem = source.find(item => item.value == value)
        return (
            <View className={`drop-down-box com-class`}>
                <View className={cn('mask', { show: open })} onClick={this.onMask}></View>
                <View className='item-show' onClick={this.onSwitch}>
                    <Text className='label'>{get(currentItem, 'label', '全部')}</Text>
                    <View className='icon'></View>
                </View>
                <View className={cn('list-content', { open: open })}>
                    {
                        source.map(option => (
                            <Text
                                className={cn('list-item', { active: option.value == value })}
                                key={option.value}
                                onClick={this.onItem.bind(this, option)}
                            >{option.label}</Text>
                        ))
                    }
                </View>
            </View>
        )
    }
}