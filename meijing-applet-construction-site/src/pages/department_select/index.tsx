import Taro, { Component, Config } from '@tarojs/taro';
import { View } from '@tarojs/components'
import DepartmentSelect  from '@common/components/DepartmentSelect/index'
import { UserStore } from '../../common/store/user'
import './index.scss'
import { inject, observer } from '@tarojs/mobx';
import { navBackWithData } from '@common/utils/common';

interface MyProps{
    userStore: UserStore
}

interface MyState{
    tenantCode: string
}

@inject('userStore')
@observer
class Index extends Component<MyProps, MyState>{
    config: Config = {
        navigationBarTitleText: '部门选择',
    }

    constructor(props){
        super(props);
        this.state = {
            tenantCode: ""
        }
    }

    componentWillMount() {
        let { divisionCode } = this.$router.params;
        if(divisionCode && divisionCode != '') {
            this.setState({
                tenantCode: divisionCode,
            });
        }
        
    }    

    onOkHandle = (selected: any) => {
        navBackWithData({
            departmentCode: selected.code,
            departmentName: selected.name
        });
    }

    render() {
        const { tenantCode } = this.state;
        return (
            <View>
                <DepartmentSelect
                    onOkHandle = {this.onOkHandle}
                    divisionCode = {tenantCode}
                    otherDepartment={true}
                ></DepartmentSelect>
            </View>
        );
    }
}
export default Index
