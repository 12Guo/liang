import Taro, { PureComponent } from '@tarojs/taro';
import { View, Block } from '@tarojs/components'
import './index.scss'

interface MyProps {
    onConfirm: () => void
    onCancel: () => void
    isHidden: boolean
}

interface MyState {
}

class Index extends PureComponent<MyProps, MyState> {

    constructor(props) {
        super(props)
        this.state = {
        }
    }

    render() {
        const { isHidden } = this.props
        return (
            <View style={{display: isHidden ? "none" : "block" }}>
                <View className="shadow"></View>
                <View className="dialog">
                    <View className="contain">
                        {
                            this.props.children
                        }
                    </View>

                    <View className="bottom_button">
                        <View className="cancel" onClick={this.props.onCancel}>取消</View>
                        <View className="confirm" onClick={this.props.onConfirm}>确定</View>
                    </View>
                </View>
            </View>

        );
    }
}
export default Index