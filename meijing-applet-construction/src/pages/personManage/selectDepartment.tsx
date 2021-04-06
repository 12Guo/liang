import Taro, { Component, Config } from '@tarojs/taro'
import { View, Button } from '@tarojs/components'
import { AtCheckbox } from 'taro-ui'
import {Department,listDepartmentByDivision} from '../../service/department'
import {navBackWithData} from '@common/utils/common'
import { observer, inject } from '@tarojs/mobx'

import './selectDepartment.scss'


interface DepartmentEditProps {
}


export interface Option {
    value: string,
    label: string
}

interface DepartmentEditState {
     /**
     * 加载中
     */
    isLoading: boolean;

    /**
     * 已选择的部门id
     */
    checkedList: string[];

    /**
     * 部门列表  value: id  label: name
     */
    departmentOptionList: Option[];
}

@inject('userStore')
@observer
export default class DepartmentEdit extends Component<DepartmentEditProps, DepartmentEditState> {

    config: Config = {
        navigationBarTitleText: '选择转移到的部门',
        navigationBarBackgroundColor: '#FFFFFF',
        navigationBarTextStyle: 'black',
        backgroundColor: '#FFFFFF',
    }

    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            departmentOptionList: [],
            checkedList: [],
        }
    }

    async componentWillMount() {
        let {departmentIds} = this.$router.params;
        const { userStore: {userDetails}} = this.props;

        const resDepartments = await listDepartmentByDivision(userDetails.divisionCode);

        let departmentList = resDepartments.data && resDepartments.data.entries || [];

        let checkedList:string[] = [];
        let departmentOptionList:Option[] =[];

        if(departmentIds && departmentIds.length>0){
            checkedList = departmentIds.split('|');
        }

        for(let i=0;i<departmentList.length;i++){
            let department = departmentList[i];
            departmentOptionList.push({
                value: department.id,
                label: department.name,
            });
        }
        this.setState({ checkedList:checkedList, isLoading:false, departmentOptionList: departmentOptionList});
    }

    componentDidMount() {
    }

    departmentChange(value) {
        this.setState({
            checkedList: value
        });
    }

    ok(){
        const { departmentOptionList,checkedList } = this.state;

        let departments:Department[] = [];
        for(let i=0;i<departmentOptionList.length;i++){
            let departmentOption = departmentOptionList[i];

            for(let j=0;j<checkedList.length;j++){
                if(departmentOption.value == checkedList[j]){
                    departments.push({
                        id: parseInt(departmentOption.value),
                        name: departmentOption.label,
                    });
                    break;
                }
            }
        }

        navBackWithData({
            departments_edit: departments
        });
    }


    render() {
        const { checkedList, departmentOptionList, isLoading } = this.state;

        if (isLoading) {
            return <View className='departmentEdit'></View>
        }

        return (
            <View className='departmentEdit'>
                <View className='top_back'></View>
                <AtCheckbox
                    options={departmentOptionList}
                    selectedList={checkedList}
                    onChange={this.departmentChange.bind(this)}
                />
                <View className='button_panel'>
                    <Button className='eidt_button' onClick={this.ok.bind(this)}>确定</Button>      
                </View>
            </View>
        )
    }
}
