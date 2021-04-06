import Taro, { Config } from '@tarojs/taro'
import { AtIcon, AtModal, AtModalContent, AtModalAction } from 'taro-ui'
import { ComponentType } from 'react'
import { View, Text, ScrollView, Image, Button } from '@tarojs/components'
import './user_area_manage.scss'
import { getCityOrCountryChildren, activeDivision, sendDataAccessToLower, DivisionDataAccess } from '../../service/division'
import { observer, inject } from '@tarojs/mobx';
import { rootSourceBaseUrl } from '@common/utils/requests'
import { UserStore } from '@common/store/user';
import { getDivisionLevelCode } from '@common/utils/divisionUtils'

export interface DivisonBean {
    code: string,
    name: string,
    level: string,
    status: "INACTIVE" | "UNDER_REVIEW" | "ACTIVE" | "NONE",
    children: DivisonBean[],
    childrenCount: number,
    childrenActiveCount: number,
    isChecked?: boolean,
    superiorAccess: boolean
}

interface UserAreaManageProps {
    userStore: UserStore;
}

interface UserAreaManageState {
    selectedDivisions: DivisonBean[],
    isTipShow: boolean,
    currentDivision: DivisonBean,
    showDivisionList: DivisonBean[],
    isHaveApplying: boolean,
    isAccessTipShow: boolean,
    selectAccessDivision?: DivisonBean
}

interface UserAreaManage {
    props: UserAreaManageProps;
    state: UserAreaManageState
}

const empty = rootSourceBaseUrl + '/assets/user_area_manage/empty_division.png';
const divisionUnopen = rootSourceBaseUrl + '/assets/user_area_manage/division_unopen.png';
const divisionApplying = rootSourceBaseUrl + '/assets/user_area_manage/division_applying.png';
const tip = rootSourceBaseUrl + '/assets/user_area_manage/tip.png';

@inject("userStore")
@observer
class UserAreaManage extends Taro.Component {

    constructor() {
        super(...arguments)
        this.state = {
            isAccessTipShow: false,
            selectedDivisions: [],
            isTipShow: false,
            isHaveApplying: false,
            showDivisionList: [],
            currentDivision: {
                code: "",
                name: "",
                level: '',
                status: "NONE",
                children: [],
                childrenCount: 0,
                childrenActiveCount: 0,
                superiorAccess: false
            }
        }
    }

    config: Config = {
        navigationBarTitleText: '区域管理',
    }

    async componentWillMount() {
        const { userStore: { userDetails } } = this.props;
        let division: DivisonBean = {
            code: userDetails.divisionCode,
            name: userDetails.divisionName,
            status: "ACTIVE",
            children: [],
            level: getDivisionLevelCode(userDetails.divisionCode),
            childrenCount: 0,
            childrenActiveCount: 0,
            superiorAccess: false
        }
        this.setState({
            currentDivision: division
        })
        await this.setCurrentDivisionByCode(division);
    }

    //根据行政区编码设置当前展示的Division
    async setCurrentDivisionByCode(division: DivisonBean) {
        let divisions: DivisonBean[] = [];
        await getCityOrCountryChildren(division.code).then((res) => {
            divisions = res.data;
            divisions.map((res) => {
                if (res.children.length == 0) {
                    res.childrenCount = 0;
                    res.childrenActiveCount = 0;
                } else {
                    let grandChild: DivisonBean[] = res.children;
                    let activeCount = 0;
                    grandChild.map((res_child) => {
                        if (res_child.status != "INACTIVE") {
                            activeCount += 1;
                        }
                    })
                    res.childrenCount = grandChild.length;
                    res.childrenActiveCount = activeCount;
                }
            })
        })
        this.setState({
            showDivisionList: divisions
        })
    }

    parseItemStyleByStatus = (division: DivisonBean) => {
        if (division.code == "-1") {
            return "division_item_space";
        }
        let styleClass = "division_item ";
        switch (division.status) {
            case "ACTIVE":
                styleClass += "active_item"
                break;
            case "INACTIVE":
                styleClass += "un_active_item"
                break;
            case "UNDER_REVIEW":
                styleClass += "ready_approve"
                break;
            default:
                break;
        }

        return styleClass;
    }

    async onClickItem(division: DivisonBean) {

        if (division.status == "INACTIVE") {
            this.setState({
                selectAccessDivision: division,
                isTipShow: true
            })
        } else if (division.status == "ACTIVE") {
            if (!division.superiorAccess) {
                this.setState({
                    isAccessTipShow: true,
                    selectAccessDivision: division
                })
            } else {
                if (division.level == 'TOWN' || division.level == "VILLAGE") {
                    return;
                }
                await this.setCurrentDivisionByCode(division);
                this.setState({
                    currentDivision: division
                })
            }
        }
    }

    handleCancel() {
        this.setState({
            isTipShow: false
        })
    }

    //TODO: 单个激活逻辑
    async onConfirm() {
        const { selectAccessDivision, currentDivision } = this.state;
        if (selectAccessDivision) {
            await activeDivision(selectAccessDivision.code)
        }
        this.setState({
            isTipShow: false
        })
        this.setCurrentDivisionByCode(currentDivision);
    }

    onAgreeHigherAccess() {
        const { currentDivision } = this.state;
        Taro.navigateTo({
            url: `/pages/agree_higher_access/index?currentDivision=${JSON.stringify(currentDivision)}`
        })
    }

    onBatchSelect() {
        const { currentDivision } = this.state;
        Taro.navigateTo({
            url: `/pages/user_area_batch_active/user_area_batch_active?currentDivision=${JSON.stringify(currentDivision)}`
        })
    }

    onClickTip() {
        Taro.navigateTo({
            url: `/pages/verify_higher_access/index`
        })
    }

    jumpVerifyHigherAccess() {
        Taro.navigateTo({
            url: `/pages/verify_higher_access/index`
        })
    }

    handleCancelApply() {
        this.setState({
            isAccessTipShow: false
        })
    }

    async onConfirmApply() {
        const { userStore: { userDetails } } = this.props;
        const { selectAccessDivision } = this.state;
        this.setState({
            isAccessTipShow: false
        })
        let dataRequest: DivisionDataAccess = {
            id: 0,
            status: "CONFIRMING",
            applicantUserId: userDetails.id,
            divisionCode: selectAccessDivision && selectAccessDivision.code ? selectAccessDivision.code : "",
        }
        let dataAccessResponse = await sendDataAccessToLower(dataRequest);
        if (dataAccessResponse.statusCode == 200) {
            Taro.navigateTo({
                url: `/pages/apply_lower_access/index?applyDivisionCode=${dataRequest.divisionCode}`
            })
        }
    }

    render() {
        const { userStore: { userDetails } } = this.props;
        const { showDivisionList, selectedDivisions, isHaveApplying, selectAccessDivision } = this.state;

        return (
            <View className="root_view">
                {isHaveApplying ?
                    <View className="item_active_tip" onClick={this.jumpVerifyHigherAccess}>
                        <Image className="select_image" src={tip} onClick={this.onClickTip}></Image>
                        <Text className="select_tip">上级区域菏泽市申请获取郓城县的管理权限</Text>
                    </View> : ""}
                <View className="item_head">
                    <Text className="item_left_title">我所在区域</Text>
                    <AtIcon className="item_icon" value='chevron-right' size='22' color='#7A8499'></AtIcon>
                    <Text className="item_right_title" onClick={this.onAgreeHigherAccess}>允许上级访问</Text>
                </View>
                <View className="address">{userDetails.divisionName}</View>
                <View className="space_view"></View>
                <View className="item_body">
                    {showDivisionList.length == 0 && <Image className="empty_image" src={empty}></Image>}
                    <ScrollView
                        className='scrollview'
                        scrollY
                        scrollWithAnimation>
                        <View className="division_space">
                            {
                                showDivisionList.map((division) => {
                                    return (
                                        <View key={division.code} className="border" onClick={this.onClickItem.bind(this, division)}>
                                            <View className={this.parseItemStyleByStatus(division)}>
                                                <View className="division_title">{division.name}</View>
                                                {division.childrenCount > 0 && <View className="division_count">{`(${division.childrenActiveCount}/${division.childrenCount})`}</View>}
                                            </View>
                                            {division.status == 'INACTIVE' && <Image className="division_image" src={divisionUnopen} />}
                                            {division.status == 'ACTIVE' && !division.superiorAccess && <Image className="division_image" src={divisionApplying} />}
                                        </View>
                                    )
                                })}
                        </View>
                    </ScrollView>
                </View>
                <AtModal isOpened={this.state.isTipShow} className='modelStyle'>
                    <AtModalContent>
                        <View className='model_body'>{selectedDivisions.length == 0 ? "确认激活该区域？" : "确认激活选中的" + selectedDivisions.length + "个区域"}</View>
                    </AtModalContent>
                    <AtModalAction>
                        <Button onClick={this.handleCancel}>
                            <View className='model_cancel'>取消</View>
                        </Button>
                        <Button onClick={this.onConfirm}>
                            <View className='model_confirm'>确定</View>
                        </Button>
                    </AtModalAction>
                </AtModal>
                <AtModal isOpened={this.state.isAccessTipShow} className='modelStyle'>
                    <AtModalContent>
                        <View className='model_body'>{"确认向 " + (selectAccessDivision ? selectAccessDivision.name : "") + "发送获取下级权限申请？"}</View>
                    </AtModalContent>
                    <AtModalAction>
                        <Button onClick={this.handleCancelApply}>
                            <View className='model_cancel'>取消</View>
                        </Button>
                        <Button onClick={this.onConfirmApply}>
                            <View className='model_confirm'>确定</View>
                        </Button>
                    </AtModalAction>
                </AtModal>
                <View className="view_foot" onClick={this.onBatchSelect}>
                    <Text className="view_foot_btn">批量激活</Text>
                </View>
            </View>
        )
    }

}
export default UserAreaManage as ComponentType