import Taro, { Component, Config } from '@tarojs/taro'
import { View, Button, Text, Input, Textarea, Picker } from '@tarojs/components'
import { AtIcon } from 'taro-ui'
import { observer, inject } from '@tarojs/mobx';
import { clearValueInPageData, getCurrentPage } from '@common/utils/common'
import { ActionType, SpecialActionType, createApecialActivities, getSpecialActivityTypes } from '../../service/spectionAction'
import './edit.scss'
import moment from 'moment';

interface SpecialActionEditProps {
    userStore: any;
}

interface SpecialActionEditState {
    specialAction: SpecialActionType,
    specialActionType: ActionType[]
}

@inject('userStore')
@observer
export default class Index extends Component<SpecialActionEditProps, SpecialActionEditState> {

    config: Config = {
        navigationBarTitleText: '新增专项行动'
    }

    constructor(props) {
        super(props)
        this.state = {
            specialAction: {
                divisionCode: '',
                divisionName: '',
                name: '',
                content: '',
                participants: [],
                beginTime: moment().startOf('day').valueOf(),
                endTime: moment().add(1, 'days').endOf('day').valueOf()
            },
            specialActionType: []
        }
    }

    componentWillMount() {
        const { userStore: { userDetails } } = this.props;
        const { specialAction } = this.state;
        this.setState({
            specialAction: {
                ...specialAction,
                divisionCode: userDetails.divisionCode,
                divisionName: userDetails.divisionName,
            }
        })
    }

    componentDidShow() {
        let currentPage = getCurrentPage();
        const { specialAction } = this.state;
        const { togethers } = currentPage.data;
        if (togethers && togethers.choosedUsers.length > 0) {
            this.setState({
                specialAction: {
                    ...specialAction,
                    participants: togethers.choosedUsers.map(item => ({
                        participantUserId: item.id,
                        participantUserName: item.name
                    }))
                }
            })
        }
        clearValueInPageData(['togethers']);
    }

    componentDidMount() {
        this.getActivityTypes();
    }

    // 获取专项行动类型
    getActivityTypes = async () => {
        try {
            const res = await getSpecialActivityTypes();
            const { statusCode, data = [] } = res;
            if (statusCode == 200) {
                this.setState({
                    specialActionType: data.map((item) => ({ id: item.id, name: item.name }))
                })
            }
        }
        catch (error) { }
    }

    onActionTypeChange = e => {
        const { specialAction, specialActionType } = this.state;
        this.setState({
            specialAction: {
                ...specialAction,
                typeId: specialActionType[e.detail.value].id
            }
        })
    }

    onDateStartChange = e => {
        const { specialAction } = this.state;
        this.setState({
            specialAction: {
                ...specialAction,
                beginTime: moment(new Date(e.detail.value)).startOf('day').valueOf()
            }
        })
    }

    onDateEndChange = e => {
        const { specialAction } = this.state;
        this.setState({
            specialAction: {
                ...specialAction,
                endTime: moment(new Date(e.detail.value)).endOf('day').valueOf() - 999
            }
        })
    }

    // 提交
    onSubmitHandle = async () => {
        const { specialAction } = this.state;
        const { userStore: { userDetails } } = this.props;

        if (!specialAction.divisionCode || !specialAction.divisionName) {
            //如果未获取到上报位置所在的行政区
            specialAction.divisionCode = userDetails.divisionCode;
            specialAction.divisionName = userDetails.divisionName;
        }

        if (!this.specialActionCheck(specialAction)) {
            return;
        }
        try {
            const res = await createApecialActivities(specialAction);
            const { statusCode, errMsg } = res;
            if (statusCode == 200) {
                Taro.navigateBack({});
            }
            else {
                Taro.showToast({
                    title: errMsg,
                    mask: true,
                    icon: 'none',
                    duration: 2000
                });
            }
        }
        catch (error) {

        }
    }

    // 行动名称输入变化
    onNameInput = (e: any) => {
        const { specialAction } = this.state;
        this.setState({
            specialAction: {
                ...specialAction,
                name: e.detail.value
            }
        })
    }

    // 行动内容
    onContentInput = (e: any) => {
        const { specialAction } = this.state;
        this.setState({
            specialAction: {
                ...specialAction,
                content: e.detail.value
            }
        })
    }

    // 通过id获取行动类型
    getActionTypeName = (id: number | string) => {
        const { specialActionType } = this.state;
        if (!id || specialActionType.length == 0) {
            return;
        }
        const selectAction = specialActionType.find(item => item.id == id);
        return selectAction ? selectAction.name : '';
    }

    // 人员选择
    onPersonChoose = () => {
        Taro.navigateTo({
            url: '../person/index?dataCode=togethers&type=4&only=true'
        });
    }

    // 数据提交校验
    specialActionCheck = (input: SpecialActionType) => {
        let result: boolean = true;
        let notice: string = '';
        if (!input.name) {
            result = false;
            notice = '请输入行动名称';
        }
        else if (/\s/.test(input.name)) {
            result = false;
            notice = '行动名称不能包含空白字符';
        }
        else if (!input.typeId) {
            result = false;
            notice = '请选择行动类型';
        }
        else if (input.beginTime > input.endTime) {
            result = false;
            notice = '开始时间不能大于结束时间';
        }
        else if (input.participants.length == 0) {
            result = false;
            notice = '请选择参与人员';
        }
        else if (!input.content) {
            result = false;
            notice = '请输入行动内容';
        }

        if (!result) {
            Taro.showToast({
                title: notice,
                mask: true,
                icon: 'none',
                duration: 2000
            });
        }
        return result;
    }

    render() {
        const { specialAction, specialActionType } = this.state;
        return (
            <View className='action-edit-page'>
                <View className='action-form'>
                    <View className='item'>
                        <Text className='item_label'>名称</Text>
                        <Input className='item_input' onInput={this.onNameInput.bind(this)} value={specialAction.name} placeholder='输入专项行动名称' placeholderClass='input-placeholder' style={{ textAlign: 'right' }}></Input>
                    </View>
                    <View className='item'>
                        <Text className='item_label'>行动类型</Text>
                        <Picker mode='selector' value={0} range={specialActionType} range-key='name' onChange={this.onActionTypeChange}>
                            <Text className={`text_right ${specialAction.typeId ? '' : ' gray'}`}>{specialAction.typeId ? this.getActionTypeName(specialAction.typeId) : '请选择'}</Text>
                            <AtIcon className='chevron_right' value='chevron-right' size='20' color='#7A8499' />
                        </Picker>
                    </View>
                    <View className='item'>
                        <Text className='item_label'>开始时间</Text>
                        <Picker mode='date' value={''} onChange={this.onDateStartChange}>
                            <Text className={`text_right ${specialAction.beginTime ? '' : ' gray'}`}>{specialAction.beginTime ? moment(specialAction.beginTime).format("YYYY-MM-DD") : '请选择开始时间'}</Text>
                            <AtIcon className='chevron_right' value='chevron-right' size='20' color='#7A8499' />
                        </Picker>
                    </View>
                    <View className='item'>
                        <Text className='item_label'>结束时间</Text>
                        <Picker mode='date' value={''} onChange={this.onDateEndChange}>
                            <Text className={`text_right ${specialAction.endTime ? '' : ' gray'}`}>{specialAction.endTime ? moment(specialAction.endTime).format("YYYY-MM-DD") : '请选择结束时间'}</Text>
                            <AtIcon className='chevron_right' value='chevron-right' size='20' color='#7A8499' />
                        </Picker>
                    </View>
                    <View className='item'>
                        <Text className='item_label'>参与人员</Text>
                        <View className='item_right' onClick={this.onPersonChoose.bind(this)}>
                            <Text className='text_right'>{specialAction.participants.length > 0 ? `共${specialAction.participants.length}人` : ''}</Text>
                            <AtIcon className='chevron_right' value='chevron-right' size='20' color='#7A8499' />
                        </View>
                    </View>
                    <View className='item muti'>
                        <Text className='item_label'>行动内容</Text>
                        <Textarea className='item_input' onInput={this.onContentInput.bind(this)} value={specialAction.content} placeholder='请输入相关内容' placeholderClass='input-placeholder' />
                    </View>
                </View>
                <View className='submit-btn'>
                    <Button className='btn' type='primary' onClick={this.onSubmitHandle}>提交</Button>
                </View>
            </View>
        )
    }
}