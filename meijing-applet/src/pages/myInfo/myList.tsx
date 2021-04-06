import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, Image, Button } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import { AtModal, AtModalContent, AtModalAction } from 'taro-ui'
import { InspectInfoInList, myInspectList, deleteMyInspect, inspectReportType, inspectReportTypeLink, isToday } from '../../service/inspect'
import { SimpleRichView } from '@common/components/rich-text'
import DateSelect from '@common/components/DateSelect/index'
import EmptyHolder from '@common/components/EmptyHolder'
import ListView from '@common/components/ListView'
import isEmpty from 'lodash/isEmpty'
import moment from 'moment';
import { rootSourceBaseUrl } from '@common/utils/requests'

import './myList.scss'
import get from 'lodash/get';

const SiteType = {
    supervise: `${rootSourceBaseUrl}/assets/index/ducha.png`,   // 督查
    inspect: `${rootSourceBaseUrl}/assets/index/xuncha4.png`,    // 巡查事件
    work: `${rootSourceBaseUrl}/assets/index/xunchagongzuo.png`    // 巡查事件
}

interface WorksProps {
    userStore: any;
}

interface WorksState {
    queryParams: {
        type: string;
        startTime: number | string;
        endTime: number | string;
        offset: number;
        limit: number;
    };
    isInit: boolean;
    hasMore: boolean;
    isLoading: boolean;
    inspectList: InspectInfoInList[];
    showOperateInspectId: number;
    deleteModelShow: boolean;
    deletedInspectIds: number[];
    showPop: boolean;
    inspectTotal: number;
}

const EnumMapTypes = {
    PATROL: 'MY_PATROL',
    INCIDENT: 'MY_REPORT',
    INCIDENT_FINISHED: 'MY_DISPOSAL',
    'my-share': 'MY_SHARE',
    'assign-and-at-me': 'ASSIGN_AND_AT_ME',
    'my-assign': 'MY_ASSIGN',
    'my-praise': 'MY_PRAISE'
}

//定时器
let timer: any = null;
//轮询变量
let pollingTime: any = null;
//轮询时长:分钟
const pollingDuration = 3;
//文件下载地址
let fileLink = '';

@inject('userStore')
@observer
export default class Index extends Component<WorksProps, WorksState> {

    config: Config = {
        navigationBarTitleText: '我的事件',
        navigationBarBackgroundColor: '#FFFFFF',
        navigationBarTextStyle: 'black',
        backgroundColor: '#FFFFFF',
        backgroundTextStyle: 'dark',
        enablePullDownRefresh: false,
    }

    constructor(props) {
        super(props)
        const { startTime = moment().startOf('day').valueOf(), endTime = moment().endOf('day').valueOf(),
            tabKey = 'PATROL', tabName = '我的事件' } = this.$router.params

        this.state = {
            queryParams: {
                type: tabKey,
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
            inspectList: [],
            inspectTotal: 0,
            showOperateInspectId: 0,
            deleteModelShow: false,
            deletedInspectIds: [],
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
        const { queryParams, isInit, inspectList } = this.state;
        myInspectList(queryParams).then(res => {
            const { data: { entries = [] } } = res;
            let newList = entries;
            if (!isInit) {
                newList = inspectList.concat(newList);
            }
            this.setState({
                inspectList: newList,
                isLoading: false,
                isInit: false,
                hasMore: entries.length == queryParams.limit,
                queryParams: {
                    ...queryParams,
                    offset: queryParams.offset + queryParams.limit
                },
                inspectTotal: get(res, 'data.total', 0)
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
            inspectList: []
        }, () => {
            this.fetchList();
        })
    }

    showOperateWindow(inspectId: number, event) {
        event.stopPropagation();
        this.setState({
            showOperateInspectId: inspectId,
            deleteModelShow: false,
        }, () => {

        });
    }

    delete(inspect: InspectInfoInList, event) {
        event.stopPropagation();
        this.setState({
            deleteModelShow: true,
        });
    }

    detail(inspctId: number) {
        this.setState({
            showOperateInspectId: 0,
            deleteModelShow: false,
        });
        Taro.navigateTo({
            url: `/pages/works/detail?inspectId=${inspctId}`,
        });
    }

    onMask() {
        this.setState({
            showOperateInspectId: 0,
            deleteModelShow: false,
        })
    }

    onDeleteTipCancel() {
        this.setState({
            showOperateInspectId: 0,
            deleteModelShow: false,
        }, () => {

        });
    }

    onDeleteTipConfirm() {
        const { showOperateInspectId, deletedInspectIds } = this.state;
        this.setState({
            deleteModelShow: false,
        }, () => {
            deleteMyInspect(showOperateInspectId).then(() => {
                deletedInspectIds.push(showOperateInspectId);
                this.setState({
                    showOperateInspectId: 0,
                    deletedInspectIds,
                }, this.onRefresh)
            });
        });
    }

    onCopy = () => {
        Taro.setClipboardData({
            data: fileLink
        }).then(() => {
            this.setState({ showPop: false })
        })
    }

    downLoadFile = (params: any) => {
        Taro.showLoading({ title: '文档下载中' })
        const newParams = {
            ...params,
            endTime: isToday(params.endTime) ? moment().valueOf() : params.endTime
        }
        try {
            inspectReportType(newParams).then((res) => {
                if (res.data.link) {
                    Taro.hideLoading();
                    this.setState({
                        showPop: true
                    })
                    fileLink = res.data.link;
                }
                else {
                    pollingTime = new Date().getTime();
                    this.polling(newParams);
                }
            })
        }
        catch (err) {
            Taro.hideLoading();
            console.log(err)
        }
    }

    onDownLoad = () => {
        const { queryParams: { startTime, endTime, type }, inspectList } = this.state;

        if (isEmpty(inspectList)) {
            Taro.showToast({
                title: '数据为空',
                icon: 'none',
                duration: 2000
            })
            return;
        }

        let params = {
            status: EnumMapTypes[type],
            startTime,
            endTime
        }
        this.downLoadFile(params)
    }

    // 轮询
    polling = (params: any) => {
        timer = setTimeout(() => {
            inspectReportTypeLink(params).then((res) => {
                let endPollingTime = new Date().getTime();
                if (res.data.link) {
                    clearTimeout(timer);
                    Taro.hideLoading();
                    this.setState({
                        showPop: true
                    })
                    fileLink = res.data.link;
                }
                else {
                    this.polling(params)
                }
                if (endPollingTime - pollingTime > pollingDuration * 60 * 1000) {
                    clearTimeout(timer)
                    Taro.hideLoading();
                }
            })
        }, 2000)
    }

    componentWillUnmount() {
        clearTimeout(timer);
    }

    render() {
        const { queryParams: { startTime, endTime, type }, inspectList, hasMore, isLoading, showOperateInspectId, deleteModelShow, showPop, inspectTotal } = this.state;
        const isEmptyData = !inspectList || inspectList.length == 0;

        const showEmpty = (<View className='empty'><EmptyHolder text='暂无数据' /></View>)
        const showInspectList = inspectList.map((inspect, index) => {
            let workType = 'work'
            if (inspect.type === 'INCIDENT') {
                if (inspect.supervise) { workType = 'supervise' }
                else { workType = 'inspect' }
            }
            return (
                <View className='workItem' onClick={this.detail.bind(this, inspect.id)}>
                    <View className='image'>
                        {
                            inspect.pictureLinks && inspect.pictureLinks.length > 0 &&
                            <Image key={inspect.pictureLinks[0]} className='imageItem' src={inspect.pictureLinks[0]} mode='aspectFill' />
                        }
                    </View>

                    <View className='contentAndTime'>
                        <View className='content'>
                            {inspect.type && <Image className='type-img' src={SiteType[workType]} />}
                            <SimpleRichView class-name='' content={inspect.content} />
                        </View>
                        <View className='timeAndOperate'>
                            <Text className='time'>
                                {moment(inspect.createTime).format('MM/DD HH:mm')}
                            </Text>
                            {inspect.status && <Text className='tag'>处置完成</Text>}
                            {(type === 'PATROL' || type === 'INCIDENT') &&
                                <View className='operate' onClick={this.showOperateWindow.bind(this, inspect.id)}>
                                    <View className={inspect.id == showOperateInspectId ? 'operateWindow' : 'operateWindow hidden'} >
                                        <View className='iconAndTxt' onClick={this.delete.bind(this, inspect)}>
                                            <View className='icon delete'></View>
                                            <Text className='txt'>删除</Text>
                                        </View>
                                    </View>
                                </View>
                            }
                        </View>
                    </View>
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
                        hasData={!isEmpty(inspectList)}
                        onEndReached={this.fetchList}
                        onRefresh={this.onRefresh}
                        showLoading={isLoading}
                    >
                        {isEmptyData ? showEmpty : showInspectList}
                        <View className={showOperateInspectId > 0 ? 'operateMask show' : 'operateMask'} onClick={this.onMask}></View>
                    </ListView>
                </View>
                <View className='my-list-bottom'>
                    <View className='info'>
                        <Text className='label'>事件总数</Text>
                        <Text className='label label--num'>{inspectTotal}</Text>
                    </View>
                    <View className='btn' onClick={this.onDownLoad}>
                        <View className='img'></View>
                        <Text className='txt'>下载文档</Text>
                    </View>
                </View>

                <AtModal isOpened={deleteModelShow} className='modelStyle'>
                    <AtModalContent>
                        <View className='model_body'>确认删除这条事件吗?</View>
                    </AtModalContent>
                    <AtModalAction>
                        <Button onClick={this.onDeleteTipCancel}>
                            <View className='model_cancel'>取消</View>
                        </Button>
                        <Button onClick={this.onDeleteTipConfirm}>
                            <View className='model_confirm'>确定</View>
                        </Button>
                    </AtModalAction>
                </AtModal>

                <AtModal
                    className='popUp'
                    isOpened={showPop}>
                    <AtModalContent>
                        <View className='popUp_body'>
                            <Text className='tip'>请点击下方复制链接按钮，</Text>
                            <Text className='tip'>粘贴到浏览器中下载</Text>
                            <Text className='sub'>（链接7天有效）</Text>
                        </View>
                    </AtModalContent>
                    <AtModalAction>
                        <View className='popUp_footer'>
                            <Text className='btn copy' onClick={this.onCopy}>复制链接</Text>
                        </View>
                    </AtModalAction>
                </AtModal>
            </View>
        )
    }
}
