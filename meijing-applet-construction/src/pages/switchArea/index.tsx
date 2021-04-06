import Taro, { Component, Config } from '@tarojs/taro';
import { observer, inject } from '@tarojs/mobx';
import { View, Text, Picker } from '@tarojs/components';
import { AtIcon } from 'taro-ui'
import cn from 'classnames'
import isEmpty from 'lodash/isEmpty';
import { listDepartmentByDivision, switchDivision, listExpertDivisions } from '../../service/department'
import { Division } from "@common/utils/divisionUtils";
import { getPageData, isExperter, isSystemOperator } from "@common/utils/common";
import './index.scss'
import get from 'lodash/get';

interface SwitchAreaProps {
    userStore: any;
}

interface SwitchAreaState {
    departments: any[],
    expertDivisions: any[],
    selectedDepartment: any,
    //选择的行政区
    selectDivision: Division | null;
    //被邀请加入的行政区划
    divisionCode: string | null;
}

interface DepartmentInfo {
    id: number;
    name: string;
}

const defaultDepartment: DepartmentInfo = {
    id: -1,
    name: "其他"
};

@inject('userStore')
@observer
class SwitchAreaPage extends Component<SwitchAreaProps, SwitchAreaState> {
    config: Config = {
        navigationBarTitleText: '切换行政区'
    }

    static externalClasses = ['com-class']

    constructor(props) {
        super(props);

        this.state = {
            departments: [],
            expertDivisions: [],
            selectedDepartment: {},
            selectDivision: null,
            divisionCode: null,
        }
    }

    componentDidMount() {
        const { userStore: { userDetails } } = this.props
        let experter = isExperter(userDetails.roles);
        this.initDepartmentInfo(userDetails.divisionCode)
        if (experter) {
            this.initDivision();
        }
    }

    //行政区选择
    onExpertsChange = e => {
        let selectDivision = this.state.expertDivisions[e.detail.value];
        this.setState({
            selectDivision: selectDivision
        })
        this.initDepartment(selectDivision);
    }

    onDepartmentChange = e => {
        this.setState({
            selectedDepartment: this.state.departments[e.detail.value]
        })
    }

    onChangeHandle = () => {
        Taro.navigateTo({
            url: './choose'
        })
    }

    componentDidShow() {
        const { selectDivision } = getPageData();
        if (selectDivision) {
            this.initDepartment(selectDivision);
        }
    }

    initDepartment(selectDivision: any) {
        this.initDepartmentInfo(selectDivision.code);
        this.setState({
            selectDivision: selectDivision,
            divisionCode: selectDivision.code,
            selectedDepartment: {}
        });
    }

    initDivision() {
        let _this = this;
        let expertDivisionsResponse = listExpertDivisions();
        expertDivisionsResponse.then(res => {
            if (res.statusCode == 200) {
                _this.setState({
                    expertDivisions: res.data
                });
            }
        });
    }

    initDepartmentInfo(divisionCode: string) {
        let _this = this;
        let departmentResponse = listDepartmentByDivision(divisionCode);
        departmentResponse.then(res => {
            if (res.statusCode == 200) {
                let departemts: DepartmentInfo[] = [];
                for (let index = 0; index < res.data.length; index++) {
                    const element = res.data[index];
                    departemts.push(element);
                }
                // departemts.push(defaultDepartment);
                _this.setState({
                    departments: departemts
                });
            }
        });
    }

    onSwitch = async () => {
        const { selectedDepartment } = this.state
        if (isEmpty(selectedDepartment)) {
            Taro.showToast({
                title: '请选择所属部门',
                icon: 'none'
            })
            return
        }
        const result = await switchDivision({
            divisionCode: selectedDepartment.divisionCode,
            departmentId: selectedDepartment.id
        })
        if (get(result, 'data.success')) {
            Taro.showToast({
                title: '切换行政区成功',
                icon: 'success'
            })
            Taro.setStorageSync('inspection_report_cache', {});
            const { userStore } = this.props
            userStore.getUserDetails()
            // Taro.navigateBack()
            Taro.reLaunch({
                url: '/pages/my/index'
            })
        }
    }

    render() {
        const { departments, selectedDepartment, selectDivision, expertDivisions } = this.state
        const { userStore: { userDetails } } = this.props
        let systemOperator = isSystemOperator(userDetails.roles);
        let experter = isExperter(userDetails.roles) && !systemOperator;
        return (
            <View className='switch-page'>
                <View className='switch-page__header'>
                    <View className='left'>
                        <Text className='left-label'>我所在区域</Text>
                        <Text className='left-area'>{isEmpty(selectDivision) ? userDetails.divisionName : selectDivision.name}</Text>
                    </View>
                    {experter ?
                        <Picker className='switch' mode='selector' range={expertDivisions} rangeKey='name' onChange={this.onExpertsChange}>
                            <View className='right'>
                                <Text className='right-label'>更改行政区</Text>
                                <AtIcon className='chevron_right' value='chevron-right' size='16' color='#7A8499' />
                            </View>
                        </Picker> :
                        <View className='right' onClick={this.onChangeHandle}>
                            <Text className='right-label'>更改行政区</Text>
                            <AtIcon className='chevron_right' value='chevron-right' size='16' color='#7A8499' />
                        </View>}
                </View>
                <View className='switch-page__body'>
                    <Text className='label'>选择所属部门</Text>
                    <Picker className='switch' mode='selector' range={departments} rangeKey='name' onChange={this.onDepartmentChange}>
                        <View className='switch-item'>
                            <Text
                                className={cn('switch-item__area', { gray: isEmpty(selectedDepartment) })}>
                                {isEmpty(selectedDepartment) ? '请选择您所在的部门' : selectedDepartment.name}
                            </Text>
                            <AtIcon className='chevron_right' value='chevron-right' size='16' color='#7A8499' />
                        </View>
                    </Picker>
                </View>
                <View className='switch-page__footer'>
                    <Text className='btn' onClick={this.onSwitch}>确认</Text>
                </View>
            </View>
        );
    }
}

export default SwitchAreaPage;