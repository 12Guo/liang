import Taro, { Config } from '@tarojs/taro'
import { ComponentType } from 'react'
import { AtButton, AtModal, AtModalContent, AtModalAction } from 'taro-ui'
import { View, Button, Image } from '@tarojs/components'
import './index.scss'
import { getParentDivisions, enableHigherAccess } from '../../service/division'
import { navBackWithData } from '@common/utils/common'
import { rootSourceBaseUrl } from '@common/utils/requests'
import { Division } from '@common/utils/divisionUtils'

interface AgreeHigherAccessState {
    isTipShow: boolean,
    isAgree: boolean
}

interface AgreeHigherAccess {
    state: AgreeHigherAccessState
}

const logo = rootSourceBaseUrl + '/assets/agree_higher_access/logo.png';

class AgreeHigherAccess extends Taro.Component {

    constructor(...props) {
        super(...props)
        this.state = {
            isTipShow: false,
            isAgree: false
        }
    }

    config: Config = {
        navigationBarTitleText: '允许上级访问',
    }

    componentWillMount() {
        //获取当前行政区划
        let _this = this;
        if (this.$router.params.currentDivision) {
            let currentDivision: Division = JSON.parse(this.$router.params.currentDivision);
            this.setState({
                currentDivision: currentDivision
            })
            let divisionResponse = getParentDivisions(currentDivision.code);
            divisionResponse.then((divisionResponse) => {
                let divisions: Division[] = divisionResponse.data;
                divisions.filter((itemDivision) => {
                    if (itemDivision.code == currentDivision.code) {
                        return true;
                    }
                    return false;
                }).map((itemDivision) => {
                    _this.setState({
                        isAgree: itemDivision.superiorAccess
                    })
                })
            })
        }
    }

    onAgree() {
        enableHigherAccess(true);
        this.setState({
            isTipShow: true
        })
    }

    onConfirm() {
        const { isAgree } = this.state;
        this.setState(
            {
                isAgree: !isAgree,
                isTipShow: false
            }
        )
    }

    onCancel() {
        this.setState({
            isTipShow: false
        })
    }

    //返回
    onBack() {
        navBackWithData({
            isAgree: this.state.isAgree
        });
    }

    //关闭授权
    onClose() {
        enableHigherAccess(false);
        this.setState({
            isTipShow: true
        })
    }

    render() {
        const { isAgree } = this.state;
        return (
            <View className="root_view">
                <View className="logo">
                    <Image className="image" src={logo}></Image>
                </View>
                <View className="tip">允许上级访问</View>
                {isAgree ? (<View className="agree_status">[已开通]</View>) : ""}
                <View className="detail">
                    开通上级访问权限后，本区域将能接收和反馈上级的调度信息，本区域内的业务数据将能与上级区域共享，上级能实时查看到本区域的工作完成情况,并对本区域的组织人员进行管理。
                </View>
                {isAgree ?
                    <View className="btn_on_notagree">
                        <View className="close">
                            <AtButton className="view_foot_btn" type='secondary' onClick={this.onClose.bind(this)}>关闭授权</AtButton>
                        </View>
                        <View className="back">
                            <AtButton className="view_foot_btn" type='primary' onClick={this.onBack.bind(this)}>返回</AtButton>
                        </View>
                    </View> :
                    <View className="btn">
                        <AtButton className="view_foot_btn" type='primary' onClick={this.onAgree.bind(this)}>确认开通</AtButton>
                    </View>
                }
                <AtModal isOpened={this.state.isTipShow} className='modelStyle'>
                    <AtModalContent>
                        <View className='model_body'>{isAgree ? "确认关闭上级访问权限?" : "确认开通上级访问权限?"}</View>
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
export default AgreeHigherAccess as ComponentType