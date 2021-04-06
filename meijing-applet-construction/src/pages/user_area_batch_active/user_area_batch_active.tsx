import Taro, { Config } from '@tarojs/taro'
import { AtIcon, AtModal, AtModalContent, AtModalAction } from 'taro-ui'
import { ComponentType } from 'react'
import { View, Text, ScrollView, Image, Button } from '@tarojs/components'
import './user_area_batch_active.scss'
import { getCityOrCountryChildren, activeDivision } from '../../service/division'
import { DivisonBean } from '../user_area_manage/user_area_manage'
import { navBackWithData } from '@common/utils/common'
import { rootSourceBaseUrl } from '@common/utils/requests'

interface UserAreaBatchActiveState {
    selectedDivisions: DivisonBean[],
    isTipShow: boolean,
    currentDivision: DivisonBean,
    showDivisionList: DivisonBean[],
    isActiveGrandChildren: boolean
}

interface UserAreaBatchActive {
    state: UserAreaBatchActiveState
}

const divisionApplying = `${rootSourceBaseUrl}/assets/user_area_manage/division_applying.png`;
const selectedImageUrl = `${rootSourceBaseUrl}/assets/user_area_manage/checked.png`;
const unSelectedImageUrl = `${rootSourceBaseUrl}/assets/user_area_manage/unchecked.png`;

class UserAreaBatchActive extends Taro.Component {

    constructor() {
        super(...arguments)
        this.state = {
            selectedDivisions: [],
            isTipShow: false,
            showDivisionList: [],
            isActiveGrandChildren: false,
            currentDivision: {
                code: "",
                name: "",
                level: "",
                status: "NONE",
                children: [],
                childrenCount: 0,
                childrenActiveCount: 0
            }
        }
    }

    config: Config = {
        navigationBarTitleText: '批量激活',
    }

    async componentWillMount() {
        let division: DivisonBean = {
            code: "",
            name: "",
            status: "ACTIVE",
            children: [],
            level: "",
            childrenCount: 0,
            childrenActiveCount: 0
        }
        //获取行政区划编码
        if (this.$router.params.currentDivision) {
            division = JSON.parse(this.$router.params.currentDivision)
        }
        this.setState({
            currentDivision: division
        })
        this.setCurrentDivisionByCode(division.code);
    }

    //根据行政区编码设置当前展示的Division
    async setCurrentDivisionByCode(code: string) {
        let divisions: DivisonBean[] = [];
        await getCityOrCountryChildren(code).then((res) => {
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

        if (divisions.length > 0) {
            for (let index = 0; index < 3; index++) {
                divisions.push({
                    code: "-1",
                    name: "",
                    status: "NONE",
                    level: "",
                    children: [],
                    childrenCount: 0,
                    childrenActiveCount: 0
                })
            }
            this.setState({
                showDivisionList: divisions
            })
        }
    }

    parseItemStyleByStatus(division: DivisonBean) {
        if (division.code == "-1") {
            return "division_item_space";
        }
        let styleClass = "division_item ";
        switch (division.status) {
            case "ACTIVE":
                styleClass += "un_active_item"
                break;
            case "INACTIVE":
                if (division.isChecked) {
                    styleClass += "active_selected_item"
                } else {
                    styleClass += "active_item"
                }
                break;
            case "UNDER_REVIEW":
                styleClass += "un_active_item"
                break;
            default:
                break;
        }

        return styleClass;
    }

    parseItemCountAndIcon(res: DivisonBean) {
        if (res.status == "NONE") {
            return ""
        }
        switch (res.status) {
            case "ACTIVE":
                {
                    return (
                        res.childrenCount == 0 ?
                            <View className="division_none">
                            </View> :
                            <View>
                                <View className="division_count">{"(" + res.childrenActiveCount + "/" + res.childrenCount + ")"}</View>
                            </View>
                    )
                }
            case "INACTIVE":
                {
                    return (
                        res.childrenCount == 0 ?
                            (res.isChecked ? <Image className="selected_image" src={selectedImageUrl}></Image> : "") :
                            <View>
                                <View className="division_count">{"(" + res.childrenActiveCount + "/" + res.childrenCount + ")"}</View>
                                {res.isChecked ? <Image className="selected_image" src={selectedImageUrl}></Image> : ""}
                            </View>
                    )
                }

            case "UNDER_REVIEW":
                {

                    return (
                        res.childrenCount == 0 ?
                            <View className="division_none">
                            </View> :
                            <View>
                                <View className="division_count">{"(" + res.childrenActiveCount + "/" + res.childrenCount + ")"}</View>
                                <Image className="division_image" src={divisionApplying}></Image>
                            </View>
                    )
                }

            default:
                {
                    return "";
                }
        }
    }

    onClickItem(res: DivisonBean) {
        let { selectedDivisions } = this.state;
        let isExists: boolean = false;
        if (res.status == "INACTIVE") {
            for (let index = 0; index < selectedDivisions.length; index++) {
                if (selectedDivisions[index].code == res.code) {
                    selectedDivisions.splice(index, 1)
                    isExists = true;
                }
            }
            if (!isExists) {
                selectedDivisions.push(res)
            }
        }
        this.parseDivisions(selectedDivisions);
    }

    parseDivisions(divisions: DivisonBean[]) {
        const { showDivisionList } = this.state;
        let checkedCodes: string[] = [];
        divisions.map((res) => {
            checkedCodes.push(res.code);
        })

        showDivisionList.map((res) => {
            let index = checkedCodes.indexOf(res.code)
            if (index != -1) {
                res.isChecked = true
            } else {
                res.isChecked = false
            }
        })
        this.setState({
            showDivisionList: showDivisionList
        })
    }

    onSure() {
        this.setState({
            isTipShow: true
        })
    }

    handleCancel() {
        this.setState({
            isTipShow: false
        })
    }

    //TODO: 批量激活逻辑
    async onConfirm() {
        const { selectedDivisions } = this.state;
        for (let index = 0; index < selectedDivisions.length; index++) {
            const element = selectedDivisions[index];
            await activeDivision(element.code);
        }
        this.setState({
            isTipShow: false
        })

        navBackWithData({
        });
    }

    //修改选定状态
    onChangeSelected() {
        const { isActiveGrandChildren } = this.state;
        this.setState({
            isActiveGrandChildren: !isActiveGrandChildren
        })
    }

    onAgreeHigherAccess() {
        const { currentDivision } = this.state;
        Taro.navigateTo({
            url: `/pages/agree_higher_access/index?currentDivision=${JSON.stringify(currentDivision)}`
        })
    }

    render() {
        const { showDivisionList, selectedDivisions, isActiveGrandChildren } = this.state;
        return (
            <View className="root_view">
                <View className="item_head">
                    <Text className="item_left_title">我所在区域</Text>
                    <AtIcon className="item_icon" value='chevron-right' size='22' color='#7A8499'></AtIcon>
                    <Text className="item_right_title" onClick={this.onAgreeHigherAccess}>允许上级访问</Text>
                </View>
                <View className="address">菏泽</View>
                <View className="space_view"></View>
                <View className="item_body">
                    <ScrollView
                        className='scrollview'
                        scrollY
                        scrollWithAnimation>
                        <View className="division_space">
                            {
                                showDivisionList.map((res) => {
                                    return (
                                        <View className="border" onClick={this.onClickItem.bind(this, res)}>
                                            <View className={this.parseItemStyleByStatus(res)}>
                                                <View className="division_title">{res.name}</View>
                                                {this.parseItemCountAndIcon(res)}
                                            </View>
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
                <View className="view_foot">
                    <View className="select_group" onClick={this.onChangeSelected}>
                        <Image className="select_image" src={isActiveGrandChildren ? selectedImageUrl : unSelectedImageUrl}></Image>
                        <Text className="select_tip"> 激活选定区域的所有下级区域</Text>
                    </View>
                    <View className="view_btn_group">
                        <Text className="seleted_view">已选{selectedDivisions.length}个</Text>
                        <Text className="seleted_confirm" onClick={this.onSure}>确认</Text>
                    </View>
                </View>
            </View>
        )
    }

}
export default UserAreaBatchActive as ComponentType