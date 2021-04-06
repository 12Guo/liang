import { ComponentType } from 'react'
import Taro, { Config } from '@tarojs/taro'
import { AtSteps, AtButton, AtModal, AtModalContent, AtModalAction, AtToast } from 'taro-ui'
import { View, Text, Button, ScrollView, Image } from '@tarojs/components'
import DivisionChoose from '@common/components/divisionChoose';
import { getChildren, getParentDivisions } from '../../service/division'
import { Division as DivisionEntry } from '@common/utils/divisionUtils'
import './user_division.scss'
import { rootSourceBaseUrl } from '@common/utils/requests'
import { getAddressByLocationFromTencentMap } from '@common/utils/mapUtils'
import { observer, inject } from '@tarojs/mobx';
import { UserStore } from '@common/store/user';
import { getLocation } from '../../service/userDivision'
import { Location } from '../../model'

interface UserAreaProps {
    userStore: UserStore;
}

interface UserAreaState {
    onClickState: "CLICK_ADDRESS" | "CLICK_JUMP_NEXT",
    isTipShow: boolean,
    modelTip?: string,
    currentDivision?: DivisionEntry,
    divsionList: DivisionEntry[],
    errorTip: string | undefined,
    currentLocation?: Location,
    isLoading: boolean,
    isShare: boolean
}

interface UserArea {
    props: UserAreaProps;
    state: UserAreaState
}

const empty = rootSourceBaseUrl + '/empty.png';

@inject("userStore")
@observer
class UserArea extends Taro.Component {

    config: Config = {
        navigationBarTitleText: '填写信息',
        navigationBarBackgroundColor: '#107EFF',
        navigationBarTextStyle: 'white'
    }

    constructor() {
        super(...arguments)
        this.state = {
            isTipShow: false,
            errorTip: undefined,
            onClickState: "CLICK_ADDRESS",
            currentLocation: undefined,
            isLoading: true,
            isShare: false,
            divsionList: []
        }
    }

    async componentWillMount() {
        const { userStore: { userDetails } } = this.props;
        //判断用户是否是被邀请加入
        if (this.$router.params.divisionCode && this.$router.params.divisionCode != "undefined") {
            this.setState({
                divisionCode: this.$router.params.divisionCode,
                isShare: true
            })
        } else if (userDetails.divisionCode) {
            this.setState({
                divisionCode: userDetails.divisionCode
            })
        }
        this.setLocationAddress(false);
        Taro.setStorageSync('userDetails', userDetails)
    }

    async setLocationAddress(isShowTip: boolean) {

        let location: Location
        try {
            location = await getLocation();
        } catch (error) {
            if (isShowTip) {
                this.setState({
                    onClickState: "CLICK_ADDRESS",
                    isTipShow: true,
                    modelTip: "您之前拒绝了授权获取您的位置信息,点击确定重新获取位置权限"
                })
            }
            this.setState({
                isLoading: false,
                divsionList: []
            })
            return;
        }

        let addressResponse = await getAddressByLocationFromTencentMap(location.latitude, location.longitude)
        let townCode = addressResponse.data.result.address_reference.town.id;

        await this.setCurrentDivision(townCode);
    }

    //根据行政区划编码查询行政区划 
    async setCurrentDivision(divisionCode: string) {
        divisionCode += "000";

        try {
            let selectDivisionsResp = await getParentDivisions(divisionCode);

            let selectDivisions: DivisionEntry[] = selectDivisionsResp.data;

            if (selectDivisions && selectDivisions.length > 0) {
                let division: DivisionEntry = selectDivisions[selectDivisions.length - 1]
                this.setState({
                    currentDivision: division,
                    divsionList: selectDivisions,
                    isLoading: false
                })
            }
        } catch (error) {
            this.setState({
                divsionList: [],
                isLoading: false
            })
        }
    }

    handleCancel() {
        this.setState({
            isTipShow: false
        })
    }

    onConfirm() {
        const { userStore: { userDetails } } = this.props;
        const { currentDivision } = this.state;
        //判断是否是点击授权地址还是激活行政区
        if (this.state.onClickState == "CLICK_ADDRESS") {
            this.setState({
                isTipShow: false
            })
            Taro.openSetting({})
        }
        else {
            if (currentDivision) {
                userDetails.divisionCode = currentDivision.code;
                userDetails.divisionName = currentDivision.name;
                Taro.setStorageSync("userDetails", userDetails);
                this.setState({
                    isTipShow: false
                })
                Taro.navigateTo({
                    url: `/pages/user_base_info/user_base_info?isShare=${this.state.isShare}&division=${JSON.stringify(this.state.currentDivision)}`
                })
            }
        }
    }

    jumpToNext() {
        const { currentDivision } = this.state;
        this.setState({
            errorTip: undefined
        })
        if (!currentDivision) {
            this.setState({
                errorTip: "请选择行政区划"
            })
            return;
        }

        if (currentDivision.status == undefined || currentDivision.status == "INACTIVE") {
            this.setState({
                isTipShow: true,
                onClickState: "CLICK_JUMP_NEXT",
                modelTip: currentDivision.name + "尚未被激活,确认激活?"
            })
            return;
        }
        Taro.setStorage({ key: 'isDivisinActive', data: true })
        Taro.navigateTo({
            url: `/pages/user_base_info/user_base_info?isShare=${this.state.isShare}&division=${JSON.stringify(this.state.currentDivision)}`
        })
    }

    //切换行政区划
    onDivisionChange(res: DivisionEntry[]) {
        if (res && res.length > 0) {
            let division = res[res.length - 1];
            this.setState({
                currentDivision: division
            })
        }
    }

    //选择行政区划
    onCheckDivision() {
        this.setState({
            errorTip: undefined,
        })
    }

    //选择其他区域
    onSelectOtherArea() {
        this.setState({
            divsionList: []
        })
    }

    render() {
        const { currentDivision, divsionList } = this.state;
        const items = [
            {
                'title': '选择区域',
            },
            {
                'title': '个人资料',
            },
            {
                'title': '提交',
            }
        ]

        return (
            <View className='bg-view'>
                <AtToast isOpened={this.state.errorTip ? true : false} text={this.state.errorTip}></AtToast>
                <AtSteps
                    className='step'
                    items={items}
                    current={0}
                    onChange={() => { }}
                />
                <View className="view_body">
                    <View className="view_item">
                        <Text className='view_body_title_info'>选择行政区划</Text>
                    </View>
                    <View className="space_view"></View>
                </View>
                <ScrollView scrollX className='select-container'>
                    <View className="select_division">
                        <Text className="selected_address">已选: {currentDivision ? currentDivision.name : ""}</Text>
                    </View>
                    {!this.state.isLoading ?
                        <DivisionChoose class-name="division_choose" selectDivisions={divsionList} getChildren={getChildren.bind(this)} onChoose={this.onDivisionChange.bind(this)} />
                        : <View className="content">
                            <Image className="empty" src={empty}></Image>
                        </View>}
                </ScrollView>
                <View className="view_foot">
                    <AtButton className="view_foot_btn" type='primary' onClick={this.jumpToNext.bind(this)}>下一步</AtButton>
                </View>
                <AtModal isOpened={true} className='modelStyle'>
                    <AtModalContent>
                        <View className='model_body'>{this.state.modelTip}</View>
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
            </View>
        )
    }
}

export default UserArea as ComponentType