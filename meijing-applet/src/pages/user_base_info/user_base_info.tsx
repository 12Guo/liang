import Taro, { Config } from '@tarojs/taro'
import { ComponentType } from 'react'
import { AtSteps, AtIcon, AtAvatar, AtButton, AtInput, AtToast, AtFloatLayout } from 'taro-ui'
import { View, Text, Picker, Image } from '@tarojs/components'
import './user_base_info.scss'
import { UserStore } from '@common/store/user';
import { observer, inject } from '@tarojs/mobx';
import { SystemInfoStore } from '@common/store/systeminfo'
import DivisionEntry from '../../model/divisionEntry'
import { updateCurrentUserInfo, uploadDivisionActiveRequest, userJoinDivisionRequest, UserInfo, UserJoinDivisionRequestEntry } from '../../service/userBaseInfo'
import { getPageData } from '@common/utils/common'
import { listDepartmentByDivision } from '../../service/department'
import { rootSourceBaseUrl } from '@common/utils/requests'

//图标引用
const checkedImage = rootSourceBaseUrl + '/assets/user_upload_info/checkbox.png';
const uncheckedImage = rootSourceBaseUrl + '/assets/user_upload_info/checkbox-un.png';

interface UserBaseInfoProps {
    systemInfoStore: SystemInfoStore;
    userStore: UserStore;
}

interface DepartmentInfo {
    id: number,
    name: string
}

interface UserState {
    //窗口高度
    windowHeight?: number,
    //待选择的部门
    departments: DepartmentInfo[],
    //已经选择的部门
    selectedDepartment?: DepartmentInfo,
    //是否选择异常
    showError: boolean,
    //轻提示
    toastContent: string | undefined,
    //是否显示加载中
    isLoading: boolean,
    //勾选阅读协议的图片地址
    checkImageUrl: string,
    //是否显示阅读文档
    isDocOpen: boolean,
    //行政区划
    division?: DivisionEntry,
    //是否是邀请加入
    isShare: boolean
}

interface UserBaseInfo {
    props: UserBaseInfoProps;
    state: UserState
}

@inject("systemInfoStore")
@inject("userStore")
@observer
class UserBaseInfo extends Taro.Component {

    config: Config = {
        navigationBarTitleText: '填写信息',
        navigationBarBackgroundColor: '#107EFF',
        navigationBarTextStyle: 'white'
    }

    constructor() {
        super(...arguments)
        this.state = {
            departments: [],
            showError: false,
            toastContent: undefined,
            isLoading: false,
            checkImageUrl: checkedImage,
            isDocOpen: false,
            isShare: false
        }
    }

    componentWillMount() {
        const { systemInfoStore } = this.props;
        let _this = this;
        let division: DivisionEntry = {
            code: "",
            name: "",
            status: ""
        };
        //获取行政区划编码
        if (this.$router.params.division) {
            this.setState({
                division: JSON.parse(this.$router.params.division)
            })
        }
        if (this.$router.params.isShare) {
            this.setState({
                isShare: this.$router.params.isShare
            })
        }
        division = JSON.parse(this.$router.params.division);

        let departmentResponse = listDepartmentByDivision(division.code)

        departmentResponse.then((res) => {
            if (res.statusCode == 200) {
                let departemts: DepartmentInfo[] = [];
                for (let index = 0; index < res.data.length; index++) {
                    const element = res.data[index];
                    departemts.push(element)
                }
                _this.setState({
                    departments: departemts
                })
            }
        })

        //设置屏幕高度
        this.setState({
            windowHeight: systemInfoStore.getSystemInfo.windowHeight
        })
    }

    componentDidShow() {
        const { phone } = getPageData()
        if (phone) {
            this.setState({
                phone: phone
            })
        }
    }

    onInputChange(res: string) {
        const { userStore: { userDetails } } = this.props;
        res = res.trim();
        userDetails.name = res;
        Taro.setStorageSync("userDetails", userDetails);
        this.setState({
            name: res
        })
    }

    //修改手机号
    onChangePhone() {
        Taro.navigateTo({
            url: "/pages/user_base_phone/user_base_phone"
        })
    }

    //修改部门
    onChangeDivision(res) {
        let department = this.state.departments[res.detail.value];
        this.setState({
            selectedDepartment: department
        })
    }

    async jumpToNext() {
        const { division, checkImageUrl, selectedDepartment } = this.state;
        const { userStore: { userDetails } } = this.props;
        //防止重复点击
        if (this.state.isLoading) {
            return;
        }
        if (userDetails.name == null || userDetails.name == "") {
            this.setState({
                showError: true
            })
        } else if (userDetails.phone == null || userDetails.phone == "") {
            this.setState({
                showError: true
            })
        } else if (checkImageUrl != checkedImage) {
            this.setState({
                toastContent: "请勾选相关协议",
            })
        }
        else {
            this.setState({
                isLoading: true
            })

            let userInfo: UserInfo = {
                avatar: userDetails ? userDetails.avatar : "",
                nickname: userDetails ? userDetails.nickname : "",
                phone: userDetails.phone,
                name: userDetails.name,
                departmentId: selectedDepartment ? selectedDepartment.id : null
            }

            this.setState({
                isLoading: false
            })
            if (division && division.status == "INACTIVE") {
                let response = await this.updateUserInfo(userInfo);
                if (response > 0) {
                    return;
                }
                //如果行政区没有激活提交激活申请
                userInfo.divisionCode = division ? division.code : "";
                const activeRequestResponse = await uploadDivisionActiveRequest(userInfo);
                if (activeRequestResponse.statusCode != 200) {
                    this.setState({
                        toastContent: "行政区激活失败"
                    })
                    return;
                }
            } else {
                let inviteUserId = Taro.getStorageSync("invite_user_id");
                let userJoinRequest: UserJoinDivisionRequestEntry = {
                    userId: userDetails ? userDetails.id : null,
                    userName: userDetails.name,
                    phone: userDetails.phone,
                    divisionCode: division ? division.code : "",
                    divisionName: division ? division.name : "",
                    inviteUserId: inviteUserId ? inviteUserId : null
                };
                let response = await this.updateUserInfo(userInfo);
                if (response > 0) {
                    return;
                }
                const userJoinResponse = await userJoinDivisionRequest(userJoinRequest)
                if (userJoinResponse.statusCode != 200) {
                    this.setState({
                        toastContent: "加入行政区划失败"
                    })
                    return;
                }
            }
            Taro.reLaunch({
                url: `/pages/user_upload_info/user_upload_info?isShare=${this.state.isShare}`
            })
        }
    }

    async updateUserInfo(userInfo: UserInfo) {
        const updateUserInfoRes = await updateCurrentUserInfo(userInfo);

        if (updateUserInfoRes.statusCode != 200) {
            if (updateUserInfoRes.data.message) {
                this.setState({
                    toastContent: updateUserInfoRes.data.message
                })
            } else {
                this.setState({
                    toastContent: "个人信息更新异常"
                })
            }
            return 1;
        }
        return 0;
    }

    //修改是否阅读
    onChangeCheckedState() {
        if (this.state.checkImageUrl == checkedImage) {
            this.setState({
                checkImageUrl: uncheckedImage
            })
        } else {
            this.setState({
                checkImageUrl: checkedImage
            })
        }
    }

    onOpenDoc() {
        this.setState({
            isDocOpen: true
        })
    }

    onCloseDoc() {
        this.setState({
            isDocOpen: false
        })
    }

    render() {
        const { userStore: { userDetails } } = this.props;
        const holderstyle = "color:#B2B8C6;font-size:16px;text-align:right";
        const doc = '<<相关协议>>';
        const items = [
            { 'title': '选择区域' },
            { 'title': '个人资料' },
            { 'title': '提交' }
        ]

        return (
            <View className='bg-view' style={'width:100%;height:' + (this.state.windowHeight) + "px"}>
                <AtToast isOpened={this.state.toastContent ? true : false} text={this.state.toastContent}></AtToast>
                <AtSteps
                    className='step'
                    items={items}
                    current={1}
                    onChange={() => { }}
                />
                <View className="bg_body">
                    <View className="item_view margin_top_10">
                        <View className="item_left">
                            <Text className="item_left_title">头像</Text>
                        </View>
                        <View className="item_right">
                            <AtAvatar circle className="item_avatar" image={(userDetails.avatar) ? (userDetails.avatar) : ""}></AtAvatar>
                        </View>
                        <View className="item_icon">
                        </View>
                    </View>
                    <View className="border" ></View>
                    <View className="item_view">
                        <AtInput
                            border={false}
                            editable={false}
                            name='nickName'
                            className="item_input_special"
                            title='昵称'
                            value={(userDetails.nickname) ? (userDetails.nickname) : ""}
                            type='text'
                            onChange={() => { }}
                        />
                        <View className="item_icon"></View>
                    </View>
                    <View className="border" ></View>
                    <View className="item_view">
                        <AtInput
                            error={this.state.showError && (userDetails.name == "")}
                            border={false}
                            name='userName'
                            className="item_input_special required"
                            title='真实姓名'
                            value={userDetails.name}
                            type='text'
                            placeholder='请输入您的真实姓名'
                            placeholderStyle={holderstyle}
                            onChange={this.onInputChange.bind(this)}
                        />
                        <View className="item_icon span_width_10"></View>
                    </View>
                    <View className="errorTip" style={'display:' + ((this.state.showError && (userDetails.name == "")) ? 'inline' : 'none')} >请输入您的真实姓名</View>
                    <View className="border" ></View>
                    <View className="item_view">
                        <AtInput
                            error={this.state.showError && (userDetails.phone == "")}
                            onClick={this.onChangePhone}
                            editable={false}
                            border={false}
                            name='phone'
                            value={userDetails.phone}
                            className="item_input_special required"
                            title='手机号'
                            type='text'
                            placeholder='请输入您的手机号码'
                            placeholderStyle={holderstyle}
                            onChange={this.onChangePhone.bind(this)}
                        />
                        <View className="item_icon span_width_10" onClick={this.onChangePhone}>
                            <AtIcon className="item_icon_style" value='chevron-right' size='20' color='#7A8499'></AtIcon>
                        </View>
                    </View>
                    <View className="errorTip" style={'display:' + ((this.state.showError && (userDetails.phone == "")) ? 'inline' : 'none')} >请输入您的手机号码</View>
                    <View className="border" ></View>
                    <View className="item_view">
                        <Picker className="item_input_special required" rangeKey={"name"} mode='selector' value={0} range={this.state.departments} onChange={this.onChangeDivision}>
                            <AtInput
                                editable={false}
                                border={false}
                                name='department'
                                title='所属部门'
                                type='text'
                                value={this.state.selectedDepartment ? this.state.selectedDepartment.name : ""}
                                placeholder='请选择您所在的部门'
                                placeholderStyle={holderstyle}
                                onChange={() => { }}
                            />
                        </Picker>
                        <View className="item_icon span_width_10">
                            <AtIcon className="item_icon_style" value='chevron-right' size='20' color='#7A8499'></AtIcon>
                        </View>
                    </View>
                    <View className="border" ></View>
                    <View className="item_view">
                        <AtInput
                            border={false}
                            editable={false}
                            name='nickName'
                            className="item_input_special"
                            title='行政区划'
                            type='text'
                            value={(this.state.division) ? (this.state.division.name) : ""}
                            placeholderStyle={holderstyle}
                            onChange={() => { }}
                        />
                        <View className="item_icon"></View>
                    </View>
                    <View className="border" ></View>
                </View>

                <View className="view_foot">
                    <View className="readDoc">
                        <Image className="checkedImage" src={this.state.checkImageUrl} onClick={this.onChangeCheckedState}></Image>
                        <Text className="doc_tip" onClick={this.onOpenDoc}>同意<Text className="doc_tip_blue">{doc}</Text></Text>
                    </View>
                    <AtButton loading={this.state.isLoading} className="view_foot_btn" type='primary' onClick={this.jumpToNext.bind(this)}>提交</AtButton>
                </View>
                <AtFloatLayout isOpened={this.state.isDocOpen} title="相关协议" onClose={this.onCloseDoc.bind(this)}>
                    用户同意遵守中华人民共和国法律法规，尤其是《中华人民共和国保守国家秘密法》、《中华人民共和国计算机信息系统安全保护条例》、《计算机软件保护条例》等有关计算机及互联网的法律法规和实施办法。在任何情况下，如果86写字楼网有 合理理由认为用户的行为可能违反上述法律、法规，可以在任何时候，不经事先通知终止向该用户提供服务。
    用户应了解国际互联网的无国界性，应特别注意遵守当地所有有关的法律和法规。
    用户同意遵守中华人民共和国法律法规，尤其是《中华人民共和国保守国家秘密法》、《中华人民共和国计算机信息系统安全保护条例》、《计算机软件保护条例》等有关计算机及互联网的法律法规和实施办法。在任何情况下，如果合理理由认为用户的行为可能违反上述法律、法规，可以在任何时候，不经事先通知终止向该用户提供服务。
    用户应了解国际互联网的无国界性，应特别注意遵守当地所有有关的法律和法规。
                </AtFloatLayout>
            </View>
        )
    }

} export default UserBaseInfo as ComponentType