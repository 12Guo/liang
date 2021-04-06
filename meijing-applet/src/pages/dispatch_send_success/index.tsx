import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, Image, Button } from '@tarojs/components'
import { rootSourceBaseUrl } from '@common/utils/requests'
import { getDispatchDetailById } from '../../service/dispatch'
import './index.scss'

interface DispatchSendSuccessProps {

}

interface DispatchSendSuccessState {
    dispatchId: number,
    imageUrl: string
}

export default class DispatchSendSuccessSuccess extends Component<DispatchSendSuccessProps, DispatchSendSuccessState> {

    config: Config = {
        navigationBarTitleText: '',
        navigationBarBackgroundColor: '#107EFF',
        navigationBarTextStyle: 'white',
        backgroundColor: '#107EFF',
    }

    constructor(props) {
        super(props)
        this.state = {
            dispatchId: 0,
            imageUrl: ""
        }
    }

    componentWillMount() {
        Taro.setNavigationBarTitle({ title: `通知发送` });
        if (this.$router.params.dispatchId) {
            let dispatchId: number = Number(this.$router.params.dispatchId);
            let dispatchResponse = getDispatchDetailById(dispatchId)
            dispatchResponse.then((dispatch) => {
                let image: string = dispatch.data.pictureLinks.length > 0 ? dispatch.data.pictureLinks[0] : "";
                this.setState({
                    imageUrl: image,
                    dispatchId: dispatchId
                })
            })
        }
    }

    componentDidMount() {
    }

    back() {
        Taro.switchTab({
            url: '/pages/task_dispatch_new/index'
        })
    }

    onShareAppMessage() {
        const { dispatchId,imageUrl } = this.state;
        return {
            title: `您有新的调度`,
            path: `/pages/dispatch_msg_detail/index?dispatchId=${dispatchId}`,
            imageUrl: `${imageUrl}`,
        }
    }

    render() {

        return (
            <View className='content'>
                <View className='middleView'>
                    <View className='imageView'>
                        <Image className='successIcon' src={`${rootSourceBaseUrl}/assets/works/success.png`} />
                    </View>
                    <View className='textView'>
                        <Text className='text'>提交成功</Text>
                    </View>

                    <Button plain={true} className='shareButton' open-type="share">
                        <Text className='text'>分享到微信群</Text>
                    </Button>

                    <View className='backButtonView' onClick={this.back.bind(this)} >
                        <Text className='text'>返回</Text>
                    </View>
                </View>
            </View>
        )
    }
}
