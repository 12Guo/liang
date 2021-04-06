import Taro, { Component, Config } from '@tarojs/taro';
import { observer, inject } from '@tarojs/mobx';
import { View, Text, Picker, Image, Input } from '@tarojs/components';
import cn from 'classnames'
import isEmpty from 'lodash/isEmpty';
import { getPageData } from '@common/utils/common';
import { listDepartmentByDivision } from '../../service/department'
import { viewUserDetails, passByAdministrator } from '@common/service/user'
import { getUserAvatarUrl, rootSourceBaseUrl } from '@common/utils/requests'
import './agree.scss'
import get from 'lodash/get';

interface AgreeProps {
    userStore: any;
}

interface AgreeState {
    departments: any[],
    id: number;
    userId: number;
    userInfo: any;
}

const iconRight = `${rootSourceBaseUrl}/assets/common/icon-right.png`
@inject('userStore')
@observer
class AgreePage extends Component<AgreeProps, AgreeState> {
    config: Config = {
        navigationBarTitleText: '同意加入申请'
    }

    static externalClasses = ['com-class']

    constructor(props) {
        super(props);
        const { id, userId } = this.$router.params

        this.state = {
            id: parseInt(id),
            userId: parseInt(userId),
            userInfo: {},
            departments: [],
        }
    }

    componentDidShow() {
        const { roles_edit } = getPageData();
        const { userInfo } = this.state
        userInfo.roles = roles_edit
        this.setState({
            userInfo
        })
    }

    componentDidMount() {
        this.getUserDetails()
    }

    getUserDetails = async () => {
        const { userInfo } = this.$router.params
        this.setState({
            userInfo: JSON.parse(userInfo)
        }, this.getDepartment)
    }

    // 部门
    getDepartment = async () => {
        const { userInfo } = this.state;
        const res = await listDepartmentByDivision(userInfo.divisionCode);
        const { data } = res;
        this.setState({
            departments: data
        })
    }

    onDepartmentChange = e => {
        const { userInfo, departments } = this.state
        userInfo.departmentId = departments[e.detail.value].id
        userInfo.departmentName = departments[e.detail.value].name
        this.setState({
            userInfo
        })
    }

    onChangeHandle = () => {
        Taro.navigateTo({
            url: './choose'
        })
    }

    onInputChange = (key, e) => {
        const { userInfo } = this.state
        switch (key) {
            case 'userName':
                userInfo.userName = e.detail.value
                break;
        }
        this.setState({ userInfo })
    }

    onRole = () => {
        const { userInfo: { roles = [] } } = this.state;
        let roleCodes: string[] = [];
        roles.forEach(role => roleCodes.push(role.code));
        Taro.navigateTo({
            url: `/pages/personalInfo/roleEdit?roleCodes=${roleCodes.join('|')}`
        })
    }

    // 验证输入信息
    checkInput = () => {
        const { userInfo: { departmentId, roles = [], userName } } = this.state
        let result = true
        let message = ''
        if (!userName) {
            message = '请填写姓名'
            result = false
        }
        else if (!departmentId) {
            message = '请选择部门'
            result = false
        }
        else if (roles.length === 0) {
            message = '请选择角色'
            result = false
        }
        if (!result) {
            Taro.showToast({
                title: message,
                icon: 'none'
            })
        }
        return result
    }

    onSubmit = async () => {
        if (!this.checkInput()) { return }
        const { userInfo: { departmentId, roles, id, userName } } = this.state
        await passByAdministrator({
            id,
            name: userName,
            departmentId: departmentId,
            roleCodes: roles.map(role => role.code)
        })
        Taro.navigateBack()
    }

    render() {
        const { departments, userInfo } = this.state
        if (isEmpty(userInfo)) {
            return
        }

        return (
            <View className='agree-page'>
                <View className='agree-page__header'></View>
                <View className='agree-page__body'>
                    <View className='list-item'>
                        <Text className='label'>头像</Text>
                        <View className='content pr'>
                            <Image className='img' src={userInfo.userId ? `${getUserAvatarUrl(userInfo.userId)}` : ''} />
                        </View>
                    </View>
                    {/* <View className='list-item'>
                        <Text className='label'>昵称</Text>
                        <View className='content pr'>
                            <Text className='txt gray'>{userInfo.nickname}</Text>
                        </View>
                    </View> */}
                    <View className='list-item'>
                        <Text className='label'>真实姓名</Text>
                        <View className='content pr'>
                            <Input
                                value={userInfo.userName}
                                className='txt'
                                placeholderClass='gray'
                                placeholder='请输入'
                                onInput={this.onInputChange.bind(this, 'userName')}
                            />
                        </View>
                    </View>
                    <View className='list-item'>
                        <Text className='label'>所在区域</Text>
                        <View className='content pr'>
                            <Text className='txt gray'>{userInfo.divisionName}</Text>
                        </View>
                    </View>
                    <View className='list-item'>
                        <Text className='label'>所在部门</Text>
                        <Picker className='content' mode='selector' range={departments} rangeKey='name' onChange={this.onDepartmentChange}>
                            <View className='switch-item'>
                                <Text
                                    className={cn('switch-item__area', { gray: get(userInfo, 'departmentId') == null })}>
                                    {get(userInfo, 'departmentId') == null ? '请选择您所在的部门' : userInfo.departmentName}
                                </Text>
                                <Image className='switch-item__img' src={iconRight} />
                            </View>
                        </Picker>
                    </View>
                    <View className='list-item'>
                        <Text className='label'>角色</Text>
                        <View className='content'>
                            <View className='switch-item' onClick={this.onRole}>
                                <Text
                                    className={cn('switch-item__area', { gray: isEmpty(userInfo.roles) })}>
                                    {isEmpty(userInfo.roles) ? '请选择角色' : userInfo.roles.map(role => role.name).join('、')}
                                </Text>
                                <Image className='switch-item__img' src={iconRight} />
                            </View>
                        </View>
                    </View>
                </View>
                <View className='agree-page__footer'>
                    <Text className='btn' onClick={this.onSubmit}>确认</Text>
                </View>
            </View>
        );
    }
}

export default AgreePage;