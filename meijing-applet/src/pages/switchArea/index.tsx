import Taro, { Component, Config } from '@tarojs/taro';
import { observer, inject } from '@tarojs/mobx';
import { View, Text, Picker } from '@tarojs/components';
import { AtIcon } from 'taro-ui'
import isEmpty from 'lodash/isEmpty';
import { switchDivision, listExpertDivisions } from '../../service/department'
import { Division } from '@common/utils/divisionUtils';
import { getPageData, isExperter, isSystemOperator } from '@common/utils/common';
import './index.scss' ;
import get from 'lodash/get';

interface SwitchAreaProps {
    userStore: any;
}

interface SwitchAreaState {
    expertDivisions: any[],
    superviseDepartment: any;
    //选择的行政区
    selectDivision: Division | null;
    //被邀请加入的行政区划
    divisionCode: string | null;
    
}

interface DepartmentInfo {
    id: number;
    name: String;
    divisionCode: String;
}

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
            expertDivisions: [],
            superviseDepartment: {},
            selectDivision: null,
            divisionCode: null,    
        }
    }

    componentDidMount() {
        const { userStore: { userDetails }} = this.props
        let experter = isExperter(userDetails.roles);
        if (experter) {
            this.initDivision();
        }
        this.setState({
            superviseDepartment:{
                id: userDetails.departmentInfo.id,
                name:userDetails.departmentInfo.name,
                divisionCode: userDetails.divisionCode,
            }
        });
    }

    //行政区选择
    onExpertsChange = e => {
        let selectDivision = this.state.expertDivisions[e.detail.value];
        this.setState({
            selectDivision: selectDivision
        })
        this.initDiviData(selectDivision);
    }

    /**
     * 修改监管部门
     * @param res 
     */ 
    onDepartmentChange(divisionCode: any) {
        Taro.navigateTo({
            url: `/pages/department_select/index?dataCode=selectDepartment&divisionCode=${divisionCode}`
        });
    } 

    onChangeHandle = () => {
        Taro.navigateTo({
            url: './choose'
        })
    }

    componentDidShow() {
        const { selectDivision, selectDepartment} = getPageData();
        if (selectDivision) {
            this.initDiviData(selectDivision);
            this.setState({
                superviseDepartment: {}
            });
        }
        if(selectDepartment){
            this.setState({
                superviseDepartment: selectDepartment
            });
        }
       
    }

    initDiviData(selectDivision: any) {
        this.setState({
            selectDivision: selectDivision,
            divisionCode: selectDivision.code,
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


    onSwitch = async () => {
        const { superviseDepartment } = this.state
        if (isEmpty(superviseDepartment)) {
            Taro.showToast({
                title: '请选择所属部门',
                icon: 'none'
            })
            return
        }
        const result = await switchDivision({
            divisionCode: superviseDepartment.divisionCode,
            departmentId: superviseDepartment.id
        })
        if (get(result, 'data.success')) {
            Taro.removeStorageSync('recentUsers')
            Taro.showToast({
                title: '切换行政区成功',
                icon: 'success'
            })
            const { userStore } = this.props
            userStore.getUserDetails()
            // Taro.navigateBack()
            Taro.reLaunch({
                url: '/pages/my_new/index'
            })
        }
    }

    render() {
        const { superviseDepartment, selectDivision, expertDivisions } = this.state
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
                    <View className='right' onClick={this.onDepartmentChange.bind(this,isEmpty(selectDivision)?userDetails.divisionCode:selectDivision.code)}>
                            <Text className='right-label'>
                                { isEmpty(superviseDepartment) ? '请选择您所在的部门' : superviseDepartment.name}
                            </Text>
                        <AtIcon className='chevron_right' value='chevron-right' size='20' color='#7A8499' />
                     </View>
                </View>
                <View className='switch-page__footer'>
                    <Text className='btn' onClick={this.onSwitch}>确认</Text>
                </View>
            </View>
        );
    }
}

export default SwitchAreaPage;