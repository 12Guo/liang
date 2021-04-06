import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import { SimpleRichView } from '@common/components/rich-text'
import { DispatchManageList } from '../../service/dispatchManage'
import DateSelect from '@common/components/DateSelect/index'
import EmptyHolder from '@common/components/EmptyHolder'
import ListView from '@common/components/ListView'
import isEmpty from 'lodash/isEmpty'
import moment from 'moment';

import "./index.scss";
import get from 'lodash/get';


interface DispatchManageProps {
    userStore: any;
}

interface DispatchManageState {
    queryParams: {
        startTime: number | string;
        endTime: number | string;
        offset: number;
        limit: number;
    };
    isInit: boolean;
    hasMore: boolean;
    isLoading: boolean;
    dispatchManageList: DispatchManageList[];
    showOperateInspectId: number;
    deleteModelShow: boolean;
    showPop: boolean;
    disTotal: number;
}

interface DispatchManageList {
    id: number,
    dispatchUserName: String,
    content: string;
    createTime: number;
}


@inject('userStore')
@observer
export default class Index extends Component<DispatchManageProps, DispatchManageState> {

    config: Config = {
        navigationBarTitleText: '调度管理',
        navigationBarBackgroundColor: '#FFFFFF',
        navigationBarTextStyle: 'black',
        backgroundColor: '#FFFFFF',
        backgroundTextStyle: 'dark',
        enablePullDownRefresh: false,
    }

    constructor(props) {
        super(props)
        const { startTime = moment().startOf('day').valueOf(), endTime = moment().endOf('day').valueOf(),
            tabName = '调度管理' } = this.$router.params

        this.state = {
            queryParams: {
                //@ts-ignore
                startTime: parseInt(startTime),
                //@ts-ignore
                endTime: parseInt(endTime),
                offset: 0,
                limit: 10
            },
            isInit: true,
            hasMore: true,
            isLoading: true,
            dispatchManageList: [],
            disTotal: 0,
            showOperateInspectId: 0,
            deleteModelShow: false,
            showPop: false,
        }
        Taro.setNavigationBarTitle({ title: tabName })
    }

    componentDidMount() {
        this.fetchList()
    }

    onConfirm = (startTime, endTime) => {
        const { queryParams } = this.state
        this.setState({
            queryParams: {
                ...queryParams,
                startTime,
                endTime
            }
        }, this.onRefresh)
    }

    fetchList = (callback?: any) => {
        const { queryParams, isInit, dispatchManageList } = this.state;
        DispatchManageList(queryParams).then(res => {
            const { data: { entries = [] } } = res;
            let newList = entries;
            if (!isInit) {
                newList = dispatchManageList.concat(newList);
            }
            this.setState({
                dispatchManageList: newList,
                isLoading: false,
                isInit: false,
                hasMore: entries.length == queryParams.limit,
                queryParams: {
                    ...queryParams,
                    offset: queryParams.offset + queryParams.limit
                },
                disTotal: get(res, 'data.total', 0)
            }, () => {
                if (callback) {
                    callback();
                }
            });
        }).catch(res => {
            console.log(res)
        });
    }

    onRefresh = () => {
        const { queryParams } = this.state;
        this.setState({
            queryParams: {
                ...queryParams,
                offset: 0
            },
            dispatchManageList: []
        }, () => {
            this.fetchList();
        })
    }


     /**
     * 调度详情
     * @param dispatchId  调度id
     */
    detail(dispatchId: number) {
        this.setState({
            showOperateInspectId: 0,
            deleteModelShow: false,
        });
        Taro.navigateTo({
            url: `/pages/dispatch_msg_detail/index?dispatchId=${dispatchId}&inner=true`
          });
    }

    onMask() {
        this.setState({
            showOperateInspectId: 0,
            deleteModelShow: false,
        })
    }



    render() {
        const { queryParams: { startTime, endTime }, dispatchManageList, hasMore, isLoading, showOperateInspectId } = this.state;
        const isEmptyData = !dispatchManageList || dispatchManageList.length == 0;

        const showEmpty = (<View className='empty'><EmptyHolder text='暂无数据' /></View>)
        const showDispatchManageList = dispatchManageList.map((dispatchManage) => {
            return (
                <View key={dispatchManage.id} className='workItem' onClick={this.detail.bind(this, dispatchManage.id)}>
                    <View className='dispatchUserName'>{dispatchManage.dispatchUserName}发起调度</View>
                    <View className="content">
                        <SimpleRichView class-name='simple-rich-view' content={dispatchManage.content} />
                    </View>
                    <Text className='time'>
                        {moment(dispatchManage.createTime).format('YYYY/MM/DD HH:mm')}
                    </Text>
                </View>
            );
        });

        return (
            <View className='my-list'>
                <View className='my-list-top'>
                    <DateSelect
                        startDate={startTime}
                        endDate={endTime}
                        onConfirm={this.onConfirm.bind(this)}
                    ></DateSelect>
                </View>
                <View className='segment'></View>
                <View className='my-list-center'>
                    <ListView
                        com-class='myListView'
                        hasMore={hasMore}
                        hasData={!isEmpty(dispatchManageList)}
                        onEndReached={this.fetchList}
                        onRefresh={this.onRefresh}
                        showLoading={isLoading}
                    >
                        {isEmptyData ? showEmpty : showDispatchManageList}
                        <View className={showOperateInspectId > 0 ? 'operateMask show' : 'operateMask'} onClick={this.onMask}></View>
                    </ListView>
                </View>

            </View>
        )
    }
}
