import Taro, { Config } from '@tarojs/taro'
import { AtButton} from 'taro-ui'
import { ComponentType } from 'react'
import { View, Text, Image } from '@tarojs/components'
import './index.scss'
import { navBackWithData } from '@common/utils/common'
import { Division } from '@common/utils/divisionUtils';
import { rootSourceBaseUrl } from '@common/utils/requests'

interface VerifyHigherAccessState {
    parentsDivision: Division | undefined,
    currentDivision: Division | undefined
}

interface VerifyHigherAccess {
    state: VerifyHigherAccessState
}


const logo = `${rootSourceBaseUrl}/assets/agree_higher_access/logo.png`;

class VerifyHigherAccess extends Taro.Component {

    constructor(...props) {
        super(...props)
        this.state = {
            parentsDivision: undefined,
            currentDivision: undefined
        }
    }

    config: Config = {
        navigationBarTitleText: '上级访问授权',
    }

    componentWillMount() {
        //获取上级行政区划
        if (this.$router.params.parentsDivision) {
            this.setState({
                parentsDivision: JSON.parse(this.$router.params.parentsDivision)
            })
        }
        //获取当前行政区划
        if (this.$router.params.currentDivision) {
            this.setState({
                currentDivision: JSON.parse(this.$router.params.currentDivision)
            })
        }
    }

    onConfirm() {
        navBackWithData({
            isAgree: true
        });
    }

    //返回
    onReject() {
        navBackWithData({
            isAgree: false
        });
    }

    render() {
        const { parentsDivision, currentDivision } = this.state;
        return (
            <View className="root_view">
                <View className="space_view"></View>
                <Text className="tip_detail">
                    您的上级区域 {parentsDivision ? parentsDivision.name : ""} 申请获取 {currentDivision ? currentDivision.name : ""} 管理权限
                </Text>
                <View className="item_icon_and_tip">
                    <Image className="image" src={logo}></Image>
                    <Text className="tip_info">上级访问权限</Text>
                </View>
                <View className="detail">
                    开通上级访问权限后，本区域将能接收和反馈上级的调度信息，本区域内的业务数据将与上级区域共享，上级能实时查看到本区域的工作完成情况，并对本区域的组织人员进行管理。
                </View>

                <View className="btn_on_notagree">
                    <View className="close">
                        <AtButton className="view_foot_btn" type='secondary' onClick={this.onReject.bind(this)}>拒绝</AtButton>
                    </View>
                    <View className="back">
                        <AtButton className="view_foot_btn" type='primary' onClick={this.onConfirm.bind(this)}>同意</AtButton>
                    </View>
                </View>
            </View>
        )
    }

}
export default VerifyHigherAccess as ComponentType