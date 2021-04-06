import Taro, { Component, Config } from '@tarojs/taro'
import { View, Button } from '@tarojs/components'
import { AtCheckbox } from 'taro-ui'
import {Role, listAllRoles, listAllTenantRoles} from '../../../service/role'
import {navBackWithData} from '../../utils/common'

import './roleEdit.scss'


interface RoleEditProps {
}


export interface Option {
    value: string,
    label: string
}

interface RoleEditState {
     /**
     * 加载中
     */
    isLoading: boolean;

    /**
     * 已选择的角色编码
     */
    checkedList: string[];

    /**
     * 角色列表  value: code  label: name
     */
    roleOptionList: Option[];
}

export default class RoleEdit extends Component<RoleEditProps, RoleEditState> {

    config: Config = {
        navigationBarTitleText: '选择角色',
        navigationBarBackgroundColor: '#FFFFFF',
        navigationBarTextStyle: 'black',
        backgroundColor: '#FFFFFF',
    }

    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            roleOptionList: [],
            checkedList: [],
        }
    }

    async componentWillMount() {
        let {roleCodes, tenantCode} = this.$router.params;

        const resRoles = await listAllTenantRoles(tenantCode);

        let roleList = resRoles.data || [];


        let checkedList:string[] = [];
        let roleOptionList:Option[] =[];

        if(roleCodes && roleList.length>0){
            checkedList = roleCodes.split('|');
        }
        for(let i=0;i<roleList.length;i++){
            let role = roleList[i];
            roleOptionList.push({
                value: role.code,
                label: role.name,
            });
        }
        this.setState({ checkedList:checkedList, isLoading:false, roleOptionList: roleOptionList});
    }

    componentDidMount() {
    }

    roleChange(value) {
        this.setState({
            checkedList: value
        });
    }

    ok(){
        const { roleOptionList,checkedList } = this.state;

        let roles:Role[] = [];
        for(let i=0;i<roleOptionList.length;i++){
            let roleOption = roleOptionList[i];

            for(let j=0;j<checkedList.length;j++){
                if(roleOption.value == checkedList[j]){
                    roles.push({
                        code: roleOption.value,
                        name: roleOption.label,
                    });
                    break;
                }
            }
        }

        navBackWithData({
            roles_edit: roles
        });
    }


    render() {
        const { checkedList, roleOptionList, isLoading } = this.state;

        if (isLoading) {
            return <View className='roleEdit'></View>
        }

        return (
            <View className='roleEdit'>
                <View className='top_back'></View>
                <AtCheckbox
                    options={roleOptionList}
                    selectedList={checkedList}
                    onChange={this.roleChange.bind(this)}
                />
                <View className='button_panel'>
                    <Button className='eidt_button' onClick={this.ok.bind(this)}>确定</Button>      
                </View>
            </View>
        )
    }
}
