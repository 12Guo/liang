import Taro, { Config } from '@tarojs/taro'
import { AtButton, AtModal, AtModalContent, AtModalAction } from 'taro-ui'
import { ComponentType } from 'react'
import { View, Button, Image } from '@tarojs/components'
import './index.scss'
import { inject, observer } from '@tarojs/mobx'
import { UserStore } from '@common/store/user'
import { navBackWithData } from '@common/utils/common'
import { selectDataAccessRequests, DivisionDataAccess, cancelActiveDivision, sendDataAccessToLower } from '../../service/division';
import { rootSourceBaseUrl } from '@common/utils/requests'

interface ApplyLowerProps {
    userStore: UserStore
}

interface ApplyLowerAccessState {
    isTipShow: boolean,
    applyStatus: "CONFIRMING" | "PASS" | "REJECT",
    requestId: number,
    applyDivisionCode: string
}

interface ApplyLowerAccess {
    state: ApplyLowerAccessState
    props: ApplyLowerProps,
}

const logo = rootSourceBaseUrl + '/assets/apply_lower_access/logo.png';

@inject("userStore")
@observer
class ApplyLowerAccess extends Taro.Component {

    constructor(...props) {
        super(...props)
        this.state = {
            isTipShow: false,
            applyStatus: "CONFIRMING",
            requestId: 0,
            applyDivisionCode: ""
        }
    }

    config: Config = {
        navigationBarTitleText: '获取下级权限',
    }

    componentDidMount() {
        //获取行政区划编码
        if (this.$router.params.applyDivisionCode) {
            this.setState({
                applyDivisionCode: this.$router.params.applyDivisionCode
            })
        }
        this.refreshRequest();
    }

    refreshRequest() {
        const { userStore: { userDetails } } = this.props;
        const { applyDivisionCode } = this.state;
        let _this = this;
        let response = selectDataAccessRequests(userDetails.id)
        response.then((res) => {
            res.data && res.data.entries && res.data.entries.filter((item: DivisionDataAccess) => {
                return item.applicantUserId == userDetails.id && applyDivisionCode == item.divisionCode
            }).map((item: DivisionDataAccess) => {
                _this.setState({
                    applyStatus: item.status,
                    requestId: item.id
                })
            })
        })
    }

    onAgree() {
        this.setState({
            isTipShow: true
        })
    }

    async onConfirm() {
        const { requestId } = this.state;
        await cancelActiveDivision(requestId);
        this.setState(
            {
                isTipShow: false
            }
        )
        navBackWithData({
            isApplying: false
        });
    }

    onCancel() {
        this.setState({
            isTipShow: false
        })
    }

    //返回
    onBack() {
        navBackWithData({
            isApplying: true
        });
    }

    //关闭授权
    onClose() {
        this.setState({
            isTipShow: true
        })
    }
    //重新申请
    async retryApply() {
        const { applyDivisionCode } = this.state;
        const { userStore: { userDetails } } = this.props;
        let divisionAccess: DivisionDataAccess = {
            id: 0,
            status: "CONFIRMING",
            applicantUserId: userDetails.id,
            divisionCode: applyDivisionCode,
        }
        let dataAccessResponse = await sendDataAccessToLower(divisionAccess);
        if (dataAccessResponse.statusCode == 200) {
            this.refreshRequest();
        }
    }

    render() {
        const { applyStatus } = this.state;
        return (
            <View className="root_view">
                <View className="logo">
                    <Image className="image" src={logo}></Image>
                </View>
                <View className="tip">获取下级访问权限</View>
                {applyStatus == "CONFIRMING" ? <View className="agree_status">[审核中]</View>
                    : <View className="refuse_status">[已拒绝]</View>}

                <View className="detail">
                    获取下级访问权限后，本区域将能对下级区域发送相关调度信息，下级区域内的业务数据将与本区域共享，并能够实时查看到下级区域的工作情况，并对下级区域的组织人员进行管理。
                </View>
                <View className="btn_on_notagree">
                    {applyStatus == "CONFIRMING" ?
                        <View className="close">
                            <AtButton className="view_foot_btn" type='secondary' onClick={this.onClose.bind(this)}>取消申请</AtButton>
                        </View> :
                        <View className="close">
                            <AtButton className="view_foot_btn" type='secondary' onClick={this.retryApply.bind(this)}>重新申请</AtButton>
                        </View>}
                    <View className="back">
                        <AtButton className="view_foot_btn" type='primary' onClick={this.onBack.bind(this)}>返回</AtButton>
                    </View>
                </View>
                <AtModal isOpened={this.state.isTipShow} className='modelStyle'>
                    <AtModalContent>
                        <View className='model_body'>确认取消申请获取下级访问权限?</View>
                    </AtModalContent>
                    <AtModalAction>
                        <Button onClick={this.onCancel}>
                            <View className='model_cancel'>取消</View>
                        </Button>
                        <Button onClick={this.onConfirm}>
                            <View className='model_confirm'>确定</View>
                        </Button>
                    </AtModalAction>
                </AtModal>
            </View>
        )
    }

}
export default ApplyLowerAccess as ComponentType