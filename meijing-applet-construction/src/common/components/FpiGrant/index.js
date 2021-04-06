import Taro, { PureComponent } from '@tarojs/taro';
import { View, Text, Button } from '@tarojs/components'
import moment from 'moment'
import { AtModal, AtModalContent, AtModalAction } from "taro-ui"
import './index.scss'

class Index extends PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            isAuthSetting: false
        }
    }

    onOpenAuth = () => {
        Taro.openSetting({})
    }

    onCancelAuth = () => {
        this.setState({ isAuthSetting: false });
        // Taro.navigateBack()
    }

    componentDidShow() {
        Taro.authorize({
            scope: 'scope.userLocation',
            success: (res) => {
                this.setState({ isAuthSetting: false })
                const { onOk } = this.props
                onOk && onOk()
            }
        }).catch(() => {
            this.setState({ isAuthSetting: true })
        })
    }

    render() {
        const { isAuthSetting } = this.state
        return (
            <AtModal isOpened={isAuthSetting} onCancel={this.onCancelAuth} onClose={this.onCancelAuth}>
                <AtModalContent>
                    <View className='container'>
                        <Text className='txt'>检测到您的位置权限没有打开</Text>
                        <Text className='txt'>是否前往开启</Text>
                    </View>
                </AtModalContent>
                <AtModalAction>
                    <Button onClick={this.onCancelAuth}>取消</Button>
                    <Button onClick={this.onOpenAuth}>前往开启</Button>
                </AtModalAction>
            </AtModal>
        )
    }
}

export default Index