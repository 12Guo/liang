import Taro, { Component, Config } from '@tarojs/taro';
import { View, Text, Button, Block } from '@tarojs/components'
import DepartmentSelect  from '../../components/DepartmentSelect/index'
import { UserStore } from '../../store/user'
import './index.scss'
import { inject, observer } from '@tarojs/mobx';
import { navBackWithData } from '@common/utils/common';

interface MyProps{
    userStore: UserStore
}

interface MyState{
    divisionCode: string;
    dataCode: string;
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
            divisionCode: '',
            dataCode: 'departmentChoosedData',
        }
    }

    componentWillMount() {
        let { dataCode, divisionCode } = this.$router.params;

        if(!divisionCode || divisionCode == ''){
            divisionCode = this.props.userStore.userDetails.divisionCode;
        }

        if(dataCode && dataCode != '') {
            this.setState({
                dataCode,
                divisionCode
            });
        }
        
    }    

    onOkHandle = (selected: any) => {
        const { dataCode } = this.state;
        navBackWithData({
            [dataCode]: selected,
        });
    }

    render() {
        const {divisionCode} = this.state;

        return (
            <View>
                <DepartmentSelect
                    onOkHandle = {this.onOkHandle}
                    divisionCode = {divisionCode}
                ></DepartmentSelect>
            </View>
        );
    }
}
export default Index
