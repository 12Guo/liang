import Taro, { Component } from '@tarojs/taro'
import { View, Block } from '@tarojs/components'
import {  AtTextarea   } from 'taro-ui'
import './index.scss'


interface FpiTextAreaProps {
    text: string,
    isEdit: boolean,
    onSave: Function,
}

interface FpiTextAreaState {
    value:string, 
    open:boolean,
}

export default class FpiTextArea extends Component<FpiTextAreaProps, FpiTextAreaState> {
    static externalClasses = ['com-class'];

    constructor(props) {
        super(props);

        this.state = {
            value: props.text,
            open: false,
        }
    }

    /**
     * 输入
     */
    onInput = (t:any) => {
        if(t.currentTarget){
            this.setState({
                value: t.currentTarget.value || '',
            });
        }
    }

    /**
     * 编辑弹窗
     */
    onOpen = () => {
        this.setState({
            open: true
        })
    }

    onCancel = () => {
        this.setState({
            open: false
        })
    }

    /**
     * 提交保存
     */
    onOk = () => {
        this.setState({
            open: false
        }, () => {
            this.props.onSave(this.state.value)
        })
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.text != this.props.text) {
            this.setState({
                value: nextProps.text
            })
        }
    }

    onFocusHandle = () => {
    }

    onBlur = () => {
    }

    render() {
        const { text, isEdit } = this.props;
        const { value, open } = this.state;
        
        return (
            <View className='fpi-textarea com-class'>
                <View className='fpi-textarea-body'>
                    {
                        !open && (
                            <Block>
                                <View className='txtInfo'>
                                    {text && text.replace(/\n/g, '<br/><p></p>')}
                                </View>
                                {isEdit && <View className='icon-edit' onClick={this.onOpen.bind(this)} />}
                            </Block>
                        )
                    }
                    
                    {
                        open && isEdit && (
                            <Block>
                                <AtTextarea 
                                  value={value} 
                                  placeholder='输入内容…' 
                                  autoFocus 
                                  className='txtInput' 
                                  onChange={this.onInput.bind(this)}
                                  onFocus={this.onFocusHandle}
                                />
                                <View className='btn-container'>
                                    <View className='btn btn--gray' onClick={this.onCancel}>取消</View>
                                    <View className='btn' onClick={this.onOk}>保存</View>
                                </View>
                            </Block>
                        )}
                </View>

            </View>
        )
    }
}
