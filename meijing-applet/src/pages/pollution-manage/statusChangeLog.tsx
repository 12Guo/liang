import Taro, { Component, Config } from '@tarojs/taro';
import { View, Text, ScrollView, } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import isEmpty from 'lodash/isEmpty'
import EmptyHolder from '@common/components/EmptyHolder'
import { statusChangeLogs } from '../../service/pollutionType';
import moment from 'moment';

import './statusChangeLog.scss'



interface StatusChangeLogProps {
    userStore: any;
}

interface StatusChangeLogState {
   datas: any[],
}


@inject('userStore')
@observer
class StatusChangeLogPage extends Component<StatusChangeLogProps, StatusChangeLogState> {
    config: Config = {
        navigationBarTitleText: '污染源状态变更记录'
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
        statusChangeLogs(id).then(resp=>{
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
                    <Text className='status'>{item.statusName || ''}</Text>
                    <Text className='txt'>{`变更人：${item.userName || ''}（${item.userDepartmentName}）`}</Text>
                    <Text className='txt'>{moment(item.createTime).format('YYYY-MM-DD HH:mm')}</Text>
                </View>    
            </View>
        ));

        return (
            <View className='status-change-log-page'>
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

export default StatusChangeLogPage;