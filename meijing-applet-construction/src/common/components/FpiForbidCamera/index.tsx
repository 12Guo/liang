import { Component } from '@tarojs/taro'
import { View, Image, Button, Text } from '@tarojs/components'
import { rootSourceBaseUrl } from '@common/utils/requests'
import './index.scss'

interface FpiForbidProps {
    onAuthorized: () => void
}

interface FpiForbidState {

}

export default class FpiForbidCamera extends Component<FpiForbidProps, FpiForbidState> {

    constructor(props) {
        super(props);

        this.state = {

        }
    }

    static defaultProps = {
        isLoading: false
    }

    componentDidMount() {

    }

    render() {
        return (
            <View className='forbid'>
                <Image className='forbid_img' src={`${rootSourceBaseUrl}/assets/common/forbid-camera.png`} />
                <View className='forbid_tips'>
                    <Text className='tip'>您没有打开小程序的摄像头权限</Text>
                    <Text className='tip'>暂时无法拍照</Text>
                </View>
                <View className='forbid_btn'>
                    <Button className='btn' onClick={this.props.onAuthorized}>获取权限</Button>
                </View>
            </View>
        )
    }
}