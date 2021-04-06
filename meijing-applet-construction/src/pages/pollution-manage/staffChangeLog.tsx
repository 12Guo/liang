import Taro, { Component, Config } from '@tarojs/taro';
import { View, Text, ScrollView, } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import isEmpty from 'lodash/isEmpty'
import EmptyHolder from '@common/components/EmptyHolder'
import { staffChangeLogs } from '../../service/pollutionType';
import moment from 'moment';

import './staffChangeLog.scss'



interface StaffChangeLogProps {
    userStore: any;
}

interface StaffChangeLogState {
   datas: any[],
}


@inject('userStore')
@observer
class StaffChangeLogPage extends Component<StaffChangeLogProps, StaffChangeLogState> {
    config: Config = {
        navigationBarTitleText: '巡查人员变更记录'
    }

    static externalClasses = ['com-class']

    constructor(props) {
        super(props);
        this.state = {
            datas: [],
        }
    }

    componentDidMount() {
        const { id } = this.$router.params;
        this.loadData(id);
    }

    loadData(id:any){
        staffChangeLogs(id).then(resp=>{
            this.setState({
                datas: resp.data,
            });
        }).catch(error=>{
            Taro.showToast({
                title: "数据加载失败，请重试！",
                icon: 'none'
            })
        });
    }

    render() {
        const { datas } = this.state;

        const isEmptyData = !datas || datas.length == 0;

        const showEmpty = (<View className='empty'><EmptyHolder text='暂无数据' /></View>)

        const showList = datas.map((item:any, index:number) => (
            <View className={`data-item ${index==0 ? 'bold':'' }`}>
                <View className='icon_out'>
                    <View className='icon_in'></View>
                </View>
                <View className='data-content'>
                    <View className='staffList'>
                        <Text className='staff'>{`巡查员：${item.inspectorName || ''}`}</Text>
                        <Text className='staff'>{`督查员：${item.supervisorName || ''}`}</Text>
                        <Text className='staff'>{`组长：${item.leaderName || ''}`}</Text>
                    </View>

                    <Text className='txt'>{`变更人：${item.userName || ''}（${item.userDepartmentName}）`}</Text>
                    <Text className='txt'>{moment(item.createTime).format('YYYY-MM-DD HH:mm')}</Text>
                </View>    
            </View>
        ));

        return (
            <View className='staff-change-log-page'>
                <View className='splitView'></View>
                <ScrollView
                    className='data-list'
                    scrollY
                    scrollWithAnimation
                >
                    {isEmptyData ? showEmpty : showList}
                </ScrollView>
            </View>
        );
    }
}

export default StaffChangeLogPage;