import Taro, { Component, Config } from '@tarojs/taro'
import { observer, inject } from "@tarojs/mobx";
import { AtAvatar } from 'taro-ui'
import { SimpleRichView } from '@common/components/rich-text'
import { View, Text, Image, ScrollView, Button, Picker } from '@tarojs/components'
import moment from 'moment'
import { UserStore } from '../../store/user'
import { DispatchStore } from '../../store/dispatch'
import './site_alarm_detail.scss'
import { RecorderPlay } from '@common/components/recorder'
import EmptyHolder from '@common/components/EmptyHolder'
import { getComments, getForwardings, addForwardings } from '../../service/dispatch'
import { rootSourceBaseUrl, getUserAvatarUrl } from '@common/utils/requests'
import {
    getAlarmsDetail, listHourDataByTime, listMinuteDataByTimeNew, alarmsStatus,
    getFactorValueField, FactorCode, getFactorName, getSites, sitesFactors, alarmsView,
    getAlarmViewList, getAlarmRecipientList, listHourDataByTimeNew
} from '../../service/alarm'
import { clearValueInPageData, getPageData } from '@common/utils/common'
import isEmpty from 'lodash/isEmpty';
import LineChart from '@common/components/LineChart'
import get from 'lodash/get';

const factorIcon = rootSourceBaseUrl + "/assets/task_dispatch/icon-switch.png";
const empty = rootSourceBaseUrl + '/empty.png';
const share = `${rootSourceBaseUrl}/assets/works/share_white.png`;
const replyIcon = rootSourceBaseUrl + "/assets/works/reply_white.png";


const TargetType = 'alarms';

interface SiteAlarmDetailProps {
    userStore: UserStore;
    dispatchStore: DispatchStore;
}

interface SiteAlarmDetailState {
    tabSelected: "REPLY" | "RECIPIENT" | "VIEW",
    timeType: "hour" | "minute" | "realtime",
    alarmDetail: any,
    replyQueryParam: {
        offset: number,
        limit: number
    },
    shareQueryParam: {
        offset: number,
        limit: number
    },
    replyList: any[],
    shareList: any[],
    viewList: any[],
    recipientList: any[],
    /**
     * 热区内的污染源列表
     */
    psInHotMapList: any[],
    factorCode: FactorCode,
    /**
     * 站点小时数据
     */
    siteHourDataList: any[],
    longitude: number,
    latitude: number,
    /**
     * 超时规则
     */
    timeoutRulesConfig: any,
    factors: any,
    alarmId: string | number,
}

@inject("userStore", 'dispatchStore')
@observer
export default class SiteAlarmDetailSuccess extends Component<SiteAlarmDetailProps, SiteAlarmDetailState> {
    config: Config = {
        navigationBarTitleText: '预警详情',
    }

    constructor(props) {
        super(props)
        const { factorCode, data = '{}', alarmId = '102446' } = this.$router.params
        const alarmDetail = JSON.parse(data)
        this.state = {
            alarmId,
            alarmDetail,
            timeType: "hour",
            tabSelected: "REPLY",
            replyQueryParam: {
                offset: 0,
                limit: 200
            },
            shareQueryParam: {
                offset: 0,
                limit: 200
            },
            replyList: [],
            shareList: [],
            viewList: [],
            recipientList: [],
            psInHotMapList: [],
            //@ts-ignore
            factorCode,
            siteHourDataList: [],
            longitude: 0,
            latitude: 0,
            timeoutRulesConfig: {},
            factors: []
        }
    }

    componentDidMount() {
        const { alarmId, factorCode } = this.state;
        getAlarmsDetail(alarmId).then(res => {
            const alarmDetail = get(res, 'data', {})
            this.setState({ alarmDetail }, () => {
                this.setState({
                    timeType: get(alarmDetail, 'datas.factorItems[0].alarmConfig.datasource.code', 'hour'),
                    alarmDetail,
                    factors: get(alarmDetail, 'factors', []).map(factor => ({ label: factor.name, value: factor.code })),
                    factorCode: factorCode ? factorCode : get(alarmDetail, 'factors[0].code', factorCode),
                }, () => {
                    this.getReplyInfo();
                    this.getViewList();
                    this.getRecipientList();
                    if (this.state.timeType === 'hour') {
                        this.getSiteHourDataOfDay();
                    }
                    else {
                        this.getSiteMinuteDataOfDay()
                    }
                });
            })
        })
        alarmsView(alarmId)
    }

    refLineChart = (node) => this.lineChart = node

    componentDidShow() {
        const { alarmDetail } = this.state;
        const { replyRefresh = false } = getPageData();

        if (alarmDetail && alarmDetail.alarmId > 0) {
            if (replyRefresh) {
                this.getReplyInfo();
                clearValueInPageData(['replyRefresh', 'status']);
                alarmsStatus(alarmDetail.alarmId).then(res => {
                    this.setState({
                        alarmDetail: {
                            ...alarmDetail,
                            status: get(res, 'data', 'NOT_DISPOSED')
                        }
                    })
                })
            } else {
                this.getForwardingsInfo();
            }
        }
    }


    // 获取回复信息
    getReplyInfo = async () => {
        try {
            const { alarmDetail, replyQueryParam } = this.state;
            const res = await getComments(TargetType, alarmDetail.alarmId, replyQueryParam);
            const { statusCode, data: { entries = [] } } = res;
            if (statusCode == 200) {
                this.setState({
                    replyList: entries
                })
            }
        }
        catch (error) {
        }
    }

    // 获取分享信息
    getForwardingsInfo = async () => {
        try {
            const { alarmDetail, shareQueryParam } = this.state;
            const res = await getForwardings(TargetType, alarmDetail.alarmId, shareQueryParam);
            const { statusCode, data: { entries = [] } } = res;

            if (statusCode == 200) {
                this.setState({
                    shareList: entries
                });
            }
        }
        catch (error) {
        }
    }

    getViewList = async () => {
        try {
            const { alarmDetail } = this.state;
            const res = await getAlarmViewList(alarmDetail.alarmId);
            const { data: { entries = [] } } = res;
            this.setState({
                viewList: entries
            })
        }
        catch (error) {
        }
    }

    getRecipientList = async () => {
        try {
            const { alarmDetail } = this.state;
            const res = await getAlarmRecipientList(alarmDetail.alarmId);
            const { data: { entries = [] } } = res;
            this.setState({
                recipientList: entries
            })
        }
        catch (error) {
        }
    }

    onReplyClick() {
        const { alarmDetail } = this.state;
        Taro.navigateTo({
            url: `/pages/alarm/reply?alarmId=${alarmDetail.alarmId}&status=${alarmDetail.alarmStatus}`
        });
    }

    onSelectTab(res) {
        this.setState({
            tabSelected: res,
        })
    }


    onShareAppMessage() {
        const { alarmDetail, factorCode } = this.state;
        if (alarmDetail) {
            try {
                addForwardings(TargetType, alarmDetail.alarmId);
            } catch (error) {
            }

            const alarmId = alarmDetail.alarmId;
            const title = alarmDetail.content;

            return {
                title,
                path: `/pages/alarm/site_alarm_detail?alarmId=${alarmId}&factorCode=${factorCode}&share=true`,
            }
        }
        return {
            title: `监测预警`,
            path: `/pages/device/warn`
        }
    }

    showBigImage(urls: string[]) {
        Taro.previewImage({
            urls: urls
        })
    }

    handleFactorChange = (res) => {
        const index = res.detail.value;
        const { factors } = this.state
        this.setState({
            factorCode: factors[index].value,
        }, () => {
            this.showLineCharts();
        })
    }


    /**
     * 获取报警当天、站点小时数据
     */
    getSiteHourDataOfDay = () => {
        const { alarmDetail } = this.state;
        let dataStartTime: number = alarmDetail.alarmDataTime;

        let startTime = moment(dataStartTime).subtract(24, 'hour').startOf('hour').valueOf();
        //不包含结束时间数据
        let endTime = moment(dataStartTime).add(1, 'hour').startOf('hour').valueOf();
        if (alarmDetail.sourceCode) {
            listHourDataByTimeNew({
                siteCode: alarmDetail.sourceCode,
                startTime: startTime,
                endTime: endTime,
            }).then(resp => {
                this.setState({
                    siteHourDataList: resp.data,
                }, () => {
                    this.showLineCharts();
                });
            });
        }
    }

    /**
     * 获取报警当天、站点分钟数据
     */
    getSiteMinuteDataOfDay = () => {
        const { alarmDetail } = this.state;
        let dataStartTime: number = alarmDetail.alarmDataTime;

        let startTime = moment(dataStartTime).subtract(20, 'minute').startOf('minute').valueOf();
        //不包含结束时间数据
        let endTime = moment(dataStartTime).add(20, 'minute').startOf('minute').valueOf();
        listMinuteDataByTimeNew({
            siteCode: alarmDetail.sourceCode,
            startTime: startTime,
            endTime: endTime,
        }).then(resp => {
            this.setState({
                siteHourDataList: resp.data,
            }, () => {
                this.showLineCharts();
            });
        });
    }

    //渲染折线图
    showLineCharts = () => {
        const { siteHourDataList, factorCode, timeType, alarmDetail } = this.state;

        let xAxisData: any[] = [];
        let seriesData: any[] = [];
        let timeFormate: string = "HH:mm";
        if (timeType === 'hour') {
            timeFormate = "HH";
        }
        for (let i = 0; i < siteHourDataList.length; i++) {
            const dataTime: number = siteHourDataList[i].time;
            xAxisData.push(moment(dataTime).format(timeFormate));
            let factorValue = get(siteHourDataList, `[${i}].${factorCode}`)
            seriesData.push(factorValue);

        }
        let symbolIndex = siteHourDataList.findIndex(monitor => monitor.time === alarmDetail.alarmDataTime)

        let option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            color: ['#414F70'],
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: xAxisData,
            },
            yAxis: {
                type: 'value'
            },
            series: [{
                data: seriesData,
                type: 'line',
                name: getFactorName(factorCode),
                itemStyle: {
                    normal: {
                        // label: {
                        //     show: true,
                        // }, 
                        color: function (params) {
                            if (params.dataIndex === symbolIndex) {
                                return '#E03434';
                            }
                            return '#414F70';
                        },
                        lineStyle: {
                            color: '#414F70'
                        }
                    }
                },
            }]
        };
        setTimeout(() => {
            this.lineChart.refresh(option);
        }, 500);
    }

    recipientViewd(item: any, viewList: any[]): boolean {
        const userId: any = item.recipientUserId;
        let result: boolean = false;
        viewList.forEach(v => {
            if (v.viewedUserId == userId) {
                result = true;
                return result;
            }
        });
        return result;
    }

    render() {
        const { tabSelected, alarmDetail, replyList = [], factorCode, viewList = [], recipientList = [], factors } = this.state;

        const showEmpty = (<View className='empty'><EmptyHolder text='暂无数据' /></View>)
        const showEmpty1 = (<View className='empty'><EmptyHolder text='暂无数据' /></View>)
        const showEmpty2 = (<View className='empty'><EmptyHolder text='暂无数据' /></View>)

        const finishList: any[] = replyList.filter(item => item.appendDatas && item.appendDatas.alarmStatus == 1);
        const lastFinishReplyId: number = finishList && finishList.length > 0 ? finishList[0].id : 0;

        return (
            <View className='root_view'>
                <View className="alarm_detail_content">
                    <ScrollView
                        className='scrollview'
                        scrollY
                        scrollWithAnimation>

                        <View className="body">
                            {
                                !isEmpty(alarmDetail) &&
                                <View className="msg_body">
                                    <View className="contentView">
                                        <View className='titleAndStatus'>
                                            <Text className="title">{alarmDetail.sourceName}</Text>
                                            <View className={alarmDetail.status === 'ALREADY_DISPOSED' ? 'alarmStatus done' : 'alarmStatus'}>{alarmDetail.status === 'ALREADY_DISPOSED' ? '已处置' : '未处置'}</View>
                                        </View>
                                        <View className='timeView'>
                                            <Text className='time'>{moment(alarmDetail.alarmDataTime).format('YYYY/MM/DD HH:mm')}</Text>
                                        </View>
                                        <View className='content'>
                                            {alarmDetail.content}
                                        </View>
                                    </View>
                                </View>
                            }

                            <View className='factorConcentrationDiv'>
                                <View className='titleAndFactors'>
                                    <View className='title'>因子浓度趋势</View>
                                    <Picker mode='selector' value={0} range={factors} range-key='label' onChange={this.handleFactorChange.bind(this)}>
                                        <Text className='factorName'>{get(factors.find(factor => factor.value === factorCode), 'label', '')}</Text>
                                        <Image className="icon" src={factorIcon}></Image>
                                    </Picker>
                                </View>
                                <View className="fpi_chart__body">
                                    <LineChart ref={this.refLineChart} />
                                </View>
                            </View>

                            <View className='splitView'></View>

                            <View className='operateTabView'>
                                <View onClick={this.onSelectTab.bind(this, "REPLY")} className={tabSelected == "REPLY" ? 'operateTab selected' : 'operateTab'}>
                                    <Text className='name'>回复</Text>
                                    <Text className='number'>({replyList.length})</Text>
                                </View>
                                <View onClick={this.onSelectTab.bind(this, "RECIPIENT")} className={tabSelected == "RECIPIENT" ? 'operateTab selected' : 'operateTab'}>
                                    <Text className='name'>预警接收人</Text>
                                    <Text className='number'>({recipientList.length})</Text>
                                </View>
                                <View onClick={this.onSelectTab.bind(this, "VIEW")} className={tabSelected == "VIEW" ? 'operateTab selected' : 'operateTab'}>
                                    <Text className='name'>浏览记录</Text>
                                    <Text className='number'>({viewList.length})</Text>
                                </View>
                            </View>

                            {tabSelected == "REPLY" &&
                                <View className="msg_detail">
                                    {replyList.length > 0 ?
                                        replyList.map((item) => {
                                            return (
                                                <View key={item} className="reply_item">
                                                    <AtAvatar circle image={`${getUserAvatarUrl(item.commentUserId)}`} />
                                                    <View className="item_detail">
                                                        <View className="item_head">
                                                            <View className='titleAndStatus'>
                                                                <Text className='title'>
                                                                    {item.commentUserName}
                                                                </Text>
                                                                {
                                                                    item.appendDatas && item.appendDatas.alarmStatus == 1 &&
                                                                    <Text className={alarmDetail.alarmStatus && item.id == lastFinishReplyId ? 'status' : 'status'} >
                                                                        完成处置
                                                               </Text>
                                                                }
                                                            </View>
                                                            <Text className="time">{moment(item.createTime).format('MM/DD HH:mm')}</Text>
                                                        </View>
                                                        <View className="item_body">
                                                            <SimpleRichView class-name='' content={item.content} onAtClick={() => { }} onTagClick={() => { }} />
                                                        </View>
                                                        <View className='voiceView'>
                                                            {item.voiceLink && item.voiceLink.length > 0 &&
                                                                <RecorderPlay class-name="voice" duration={item.voiceDuration || 0} path={item.voiceLink} />
                                                            }
                                                        </View>
                                                        <View className='images'>
                                                            {
                                                                item.pictureLinks && item.pictureLinks.length > 0
                                                                && item.pictureLinks.map(link => {
                                                                    return <Image key={link} className='img' src={link} mode='aspectFill' onClick={this.showBigImage.bind(this, item.pictureLinks)} />
                                                                })
                                                            }
                                                        </View>
                                                    </View>
                                                </View>
                                            )
                                        }) : showEmpty}
                                </View>}

                            {tabSelected == "RECIPIENT" &&
                                <View className='msg_detail'>
                                    {recipientList.length > 0 ?
                                        recipientList.map((item) => {
                                            return (
                                                <View key={item.id} className="reply_item">
                                                    <AtAvatar circle image={`${getUserAvatarUrl(item.recipientUserId)}`} />
                                                    <View className="item_detail">
                                                        <View className="item_head">
                                                            <Text className="title">{item.recipientUserName}</Text>

                                                            {
                                                                this.recipientViewd(item, viewList) ?
                                                                    <Text className='time readed'>已查阅</Text>
                                                                    :
                                                                    <Text className='time'>未查阅</Text>
                                                            }

                                                        </View>
                                                        <View className="item_body">
                                                        </View>
                                                    </View>
                                                </View>
                                            )
                                        }) : showEmpty1}
                                </View>}

                            {tabSelected == "VIEW" &&
                                <View className="msg_detail">
                                    {viewList.length > 0 ?
                                        viewList.map((item) => {
                                            return (
                                                <View key={item.id} className="reply_item">
                                                    <AtAvatar circle image={`${getUserAvatarUrl(item.viewedUserId)}`} />
                                                    <View className="item_detail">
                                                        <View className="item_head">
                                                            <Text className="title">{item.viewedUserName}</Text>
                                                            <Text className="time">{moment(item.createTime).format('MM/DD HH:mm')}</Text>
                                                        </View>
                                                        <View className="item_body">
                                                            {item.viewedDepartmentName == null ? "" : item.viewedDepartmentName}
                                                        </View>
                                                    </View>
                                                </View>
                                            )
                                        }) : showEmpty2}
                                </View>}
                        </View>
                    </ScrollView>
                    <View className="control_group">
                        <Button plain={true} className='group' open-type="share">
                            <Image className='content_image' src={share} />
                            <Text className='tip'>分享</Text>
                        </Button>
                        <View className="group replyButton" onClick={this.onReplyClick.bind(this)}>
                            <Image className="content_image" src={replyIcon}></Image>
                            <Text className="tip">立即处置</Text>
                        </View>
                    </View>

                </View>
            </View>
        )
    }
}
