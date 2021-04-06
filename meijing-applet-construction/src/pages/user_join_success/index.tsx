import { ComponentType } from 'react'
import Taro, { Config } from '@tarojs/taro'
import { AtButton } from 'taro-ui'
import { View, Image, Text } from '@tarojs/components'
import './index.scss'
import { rootSourceBaseUrl } from '@common/utils/requests'

interface UserJoinSuccessProps {

}

interface UserJoinSuccessState {

}

interface UserUploadInfo {
    props: UserJoinSuccessProps;
    state: UserJoinSuccessState;
}

//上传成功 icon
const uploadSuccessImage = rootSourceBaseUrl + '/assets/user_upload_info/upload_success.png';

class UserUploadInfo extends Taro.Component {

    config: Config = {
        navigationBarTitleText: '申请加入',
    }

    constructor() {
        super(...arguments)
    }

    componentWillMount() {

    }

    //我知道了
    jumpToNext() {
        Taro.reLaunch({
            url: "/pages/user_request_verify/index"
        })
    }


    render() {
        return (
            <View className='root_view'>
                <View className="view_space"></View>
                <View className="view_icon">
                    <Image className="item_img" src={uploadSuccessImage}></Image>
                </View>
                <View className="view_success_info">
                    <Text className="success_info">加入申请提交成功</Text>
                </View>
                <View className="view_success_detail">
                    <Text className='success_detail'>区域管理员将会对您提交的资料进行审批</Text>
                </View>
                <View className="view_btn">
                    <AtButton className="view_foot_btn" type='secondary' onClick={this.jumpToNext.bind(this)}>我知道了</AtButton>
                </View>
            </View>
        )
    }

}

export default UserUploadInfo as ComponentType