import Taro, { Component, Config } from '@tarojs/taro'
import { observer, inject } from "@tarojs/mobx";
import { AtAvatar, AtIcon } from 'taro-ui'
import { SimpleRichView } from '@common/components/rich-text'
import { View, Text, Image, ScrollView, Button, Picker, Map } from '@tarojs/components'
import moment from 'moment'
import { UserStore } from '@common/store/user'
import { marker } from '@tarojs/components/types/Map'
import { DispatchStore } from '../../store/dispatch'
import './site_alarm_detail.scss'
import { RecorderPlay } from '@common/components/recorder'
import EmptyHolder from '@common/components/EmptyHolder'
import { getComments, getForwardings, addForwardings } from '../../service/dispatch'
import { rootSourceBaseUrl, getUserAvatarUrl } from '@common/utils/requests'
import {
    getAlarmDetail, listPollutionSourcesInHotMap, listHourDataByTime, listMinuteDataByTime
    , getFactorName as getAirFactorName, getSites,
    getAlarmViewList, getAlarmRecipientList, getFillColor, getAlarmTimeoutRulesConfig,
    listDivisionHourDataByTime, editAlarmControlSuggest, getAlarmSourceName, getAlarmFactors,
    getSiteDetail
} from '../../service/alarm'
import { clearValueInPageData, getPageData, isExperter } from '@common/utils/common'
import isEmpty from 'lodash/isEmpty';
import LineChart from '@common/components/LineChart'
import FpiTextArea from '@common/components/FpiTextArea'
import get from 'lodash/get';


const bigMapIcon = `${rootSourceBaseUrl}/assets/works/bigmap.png`;
const factorIcon = rootSourceBaseUrl + "/assets/task_dispatch/icon-switch.png";
const empty = rootSourceBaseUrl + '/empty.png';
const share = `${rootSourceBaseUrl}/assets/works/share_white.png`;
const replyIcon = rootSourceBaseUrl + "/assets/works/reply_white.png";

const elapsedTimeIcon = rootSourceBaseUrl + "/assets/works/elapsed_time.png";
const elapsedTimeOutIcon = rootSourceBaseUrl + "/assets/works/elapsed_time_timeout.png";


const TargetType = 'alarms';

interface SiteAlarmDetailProps {
    userStore: UserStore;
    dispatchStore: DispatchStore;
}

interface SiteAlarmDetailState {
    tabSelected: "REPLY" | "RECIPIENT" | "VIEW",
    timeType: string,
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
    factorCode: string,
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
    /**
     * 是否展示热区
     */
    showHotMap: boolean,

    /**
     * 是否可以编辑管控建议
     */
    editControlSuggest: boolean,

    /**
     * 报警tag文本
     */
    tagText: string,

    /**
     * 管控建议内容
     */
    controlSuggestText: string,

    /**
     * 预测值列表
     */
    forecastList: number[],

    factors: any[],
}

@inject("userStore", 'dispatchStore')
@observer
export default class SiteAlarmDetailSuccess extends Component<SiteAlarmDetailProps, SiteAlarmDetailState> {
    config: Config = {
        navigationBarTitleText: '监测预警',
    }

    constructor(props) {
        super(props)
        this.state = {
            alarmDetail: {},
            timeType: "HOUR",
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
            factorCode: '',
            siteHourDataList: [],
            longitude: 0,
            latitude: 0,
            timeoutRulesConfig: {},
            showHotMap: false,
            editControlSuggest: false,
            tagText: '',
            controlSuggestText: '',
            forecastList: [],
            factors: [],
        }
    }

    async componentDidMount() {
        const { userStore: { userDetails }, dispatchStore } = this.props;
        let { timeType, longitude, latitude, showHotMap, editControlSuggest, tagText } = this.state;
        let experter = isExperter(userDetails.roles);

        dispatchStore.alarmPollutionSources = [];
        let alarmId: any = this.$router.params.alarmId;

        if (alarmId) {
            const alarmRes = await getAlarmDetail(Number(alarmId));
            const timeoutRulesResp: any = await getAlarmTimeoutRulesConfig();

            //报警详情
            let alarmDetail = alarmRes.data;

            if (alarmDetail.timeType == "MINUTE") {
                timeType = "MINUTE";
            }

            const dataTime = alarmDetail.alarmDataTime;
            const divisionCode = alarmDetail.tenantCode;
            const siteCode = alarmDetail.sourceCode;

            const siteDetail: any = await getSiteDetail(siteCode);
            const siteTypeCode: string = siteDetail && siteDetail.data && siteDetail.data.siteTypeCode || '';

            dispatchStore.currentAlarmFactor = alarmDetail.factorCode[0];
            const alarmType: string = alarmDetail.datas && alarmDetail.datas.factorItems
                && alarmDetail.datas.factorItems.length > 0 &&
                alarmDetail.datas.factorItems[0].alarmTypeCode || '';

            if ('a05024' == alarmDetail.factorCode[0]) {
                //臭氧预警管控建议 专家可编辑
                if (experter) {
                    editControlSuggest = true;
                }
            } else if (siteCode && siteCode.length > 0) {
                if (timeType == "HOUR") {
                    const hourTime = moment(dataTime).startOf('hour').valueOf();
                    dispatchStore.loadLatestAlarmSiteMonitorDatas(hourTime, siteCode, "HOUR")
                } else {
                    const hourTime = moment(dataTime).startOf('minute').valueOf();
                    dispatchStore.loadLatestAlarmSiteMonitorDatas(hourTime, siteCode, "MINUTE")
                }
            }

            if (siteTypeCode == 'state_station' || siteTypeCode == 'province_station'
                || siteTypeCode == 'county_station') {


                if ('a05024' == alarmDetail.factorCode[0] || alarmType == 'break_down_alarm') {
                    //臭氧报警、故障报警不展示热区
                    showHotMap = false;
                } else {
                    showHotMap = true;

                    const sitesResp = await getSites(divisionCode);

                    const features: any[] = sitesResp.data.features;

                    const filterFeatures: any[] = features.filter(feature => feature.properties.siteCode == siteCode);

                    let feature: any = filterFeatures.length > 0 ? filterFeatures[0] : features[0];
                    longitude = feature.geometry.coordinates[0];
                    latitude = feature.geometry.coordinates[1];
                }
            } else {
                //热区只展示大气监测类型
                showHotMap = false;
            }

            //故障报警分为超高、0值、负值和倒挂
            if (alarmType == 'break_down_alarm') {
                // let { a34002 : pm10Data , a34004: pm25Data  } = alarmDetail.factorData;
                // pm10Data = !pm10Data ? 0 : pm10Data;
                // pm25Data = !pm25Data ? 0 : pm25Data;
                const factorData = get(alarmDetail, 'datas.factorItems', [])
                let pm10Data = get(factorData.find(factor => factor.factorCode === 'a34002'), 'factorValue', 0)
                let pm25Data = get(factorData.find(factor => factor.factorCode === 'a34004'), 'factorValue', 0)

                if (pm10Data > 1000 || pm25Data > 1000) {
                    tagText = '超高';
                } else if (pm10Data < 0 || pm25Data < 0) {
                    tagText = '负值';
                } else if (pm10Data == 0 || pm25Data == 0) {
                    tagText = '0值';
                } else if (pm25Data > pm10Data) {
                    tagText = '倒挂';
                }
            }

            const controlSuggestText = alarmDetail.analysisReportContent
                && alarmDetail.analysisReportContent.controlSuggest
                && alarmDetail.analysisReportContent.controlSuggest.content || '';

            this.setState({
                timeType,
                alarmDetail,
                timeoutRulesConfig: timeoutRulesResp.data,
                factorCode: alarmDetail.factorCode[0],
                longitude,
                latitude,
                showHotMap,
                editControlSuggest,
                tagText,
                controlSuggestText,
                factors: alarmDetail.factors || [],
            }, () => {
                this.getReplyInfo();
                this.getViewList();
                this.getRecipientList();
                this.listPollutionSourcesInHotMap();

                if (2 == alarmDetail.sourceType) {
                    this.getDivisionDataOfDay();
                } else {
                    if (timeType == "HOUR") {
                        this.getSiteHourDataOfDay();
                    } else {
                        this.getSiteMinuteDataOfDay();
                    }
                }

            });
        }
    }

    refLineChart = (node) => this.lineChart = node

    componentDidShow() {
        const { alarmDetail } = this.state;
        const { replyRefresh = false } = getPageData();

        if (alarmDetail && alarmDetail.alarmId > 0) {
            if (replyRefresh) {
                getAlarmDetail(alarmDetail.alarmId).then(resp => {
                    this.setState({
                        alarmDetail: resp.data
                    }, () => {
                        this.getReplyInfo();
                        clearValueInPageData(['replyRefresh', 'status']);
                    });
                });
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

    //获取热区内的污染源
    listPollutionSourcesInHotMap = async () => {
        const { alarmDetail, showHotMap } = this.state;

        if (!showHotMap) {
            return;
        }

        const { dispatchStore } = this.props;
        const hotmapAnalysisData = alarmDetail.hotmapAnalysisData;

        try {
            let coordinatesList: any[] = hotmapAnalysisData.features.map((fe: any) => fe.geometry.coordinates);

            if (coordinatesList.length > 0) {
                const psInHotMapListResp: any = await listPollutionSourcesInHotMap({ coordinatesList });
                this.setState({
                    psInHotMapList: psInHotMapListResp.data,
                });
                dispatchStore.alarmPollutionSources = psInHotMapListResp.data;
            }

        } catch (error) {
        }
    }

    onReplyClick() {
        const { alarmDetail } = this.state;

        const status: boolean = alarmDetail.status == 'ALREADY_DISPOSED';
        Taro.navigateTo({
            url: `/pages/alarm/reply?alarmId=${alarmDetail.alarmId}&status=${status}`
        });
    }

    onSelectTab(res) {
        this.setState({
            tabSelected: res,
        })
    }


    onShareAppMessage() {
        const { alarmDetail } = this.state;
        if (alarmDetail) {
            try {
                addForwardings(TargetType, alarmDetail.alarmId);
            } catch (error) {
            }

            const alarmId = alarmDetail.alarmId;
            const title = alarmDetail.content;

            return {
                title,
                path: `/pages/alarm/site_alarm_detail?alarmId=${alarmId}&share=true`,
            }
        }
        return {
            title: `监测预警`,
            path: `/pages/alarm/site_alarm`
        }
    }

    showBigImage(urls: string[]) {
        Taro.previewImage({
            urls: urls
        })
    }

    handleFactorChange = (res) => {
        const { factors } = this.state;
        const index = res.detail.value;

        this.setState({
            factorCode: factors[index].code,
        }, () => {
            this.showLineCharts();
        })
    }


    /**
     * 获取行政区小时数据（目前臭氧报警都是行政区数据报警）
     */
    getDivisionDataOfDay = () => {
        const { alarmDetail } = this.state;
        let alarmDataTime: number = alarmDetail.alarmDataTime;

        let forecastList = [];
        if (alarmDetail.analysisReportContent &&
            alarmDetail.analysisReportContent.controlSuggest
            && alarmDetail.analysisReportContent.controlSuggest.forecast) {
            forecastList = alarmDetail.analysisReportContent.controlSuggest.forecast;
        }

        //'2020-08-06 13:00'
        const now = moment().startOf('hour')

        let startTime;
        let endTime;
        if (moment(alarmDataTime).add(11, 'hour').isBefore(now)) {
            startTime = moment(alarmDataTime).subtract(12, 'hour').startOf('hour').valueOf();
            endTime = moment(alarmDataTime).add(12, 'hour').startOf('hour').valueOf();
        } else {
            startTime = moment(now).subtract(24, 'hour').startOf('hour').valueOf();
            endTime = moment(now).add(1, 'hour').startOf('hour').valueOf();
        }

        listDivisionHourDataByTime({
            divisionCode: alarmDetail.tenantCode,
            startTime: startTime,
            endTime: endTime,
        }).then(resp => {
            this.setState({
                siteHourDataList: resp.data,
                forecastList,
            }, () => {
                this.showLineCharts();
            });
        });
    }

    /**
     * 获取报警当天、站点小时数据
     */
    getSiteHourDataOfDay = () => {
        const { alarmDetail } = this.state;
        let alarmDataTime: number = alarmDetail.alarmDataTime;

        const now = moment().startOf('hour');
        let startTime;
        let endTime;
        if (moment(alarmDataTime).add(11, 'hour').isBefore(now)) {
            startTime = moment(alarmDataTime).subtract(12, 'hour').startOf('hour').valueOf();
            endTime = moment(alarmDataTime).add(12, 'hour').startOf('hour').valueOf();
        } else {
            startTime = moment(now).subtract(24, 'hour').startOf('hour').valueOf();
            endTime = moment(now).add(1, 'hour').startOf('hour').valueOf();
        }

        listHourDataByTime({
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

    /**
     * 获取报警当天、站点分钟数据
     */
    getSiteMinuteDataOfDay = () => {
        const { alarmDetail } = this.state;
        let alarmDataTime: number = alarmDetail.alarmDataTime;

        let startTime = moment(alarmDataTime).subtract(30, "minute").startOf('minute').valueOf();
        //不包含结束时间数据
        let endTime = moment(alarmDataTime).add(30, 'minute').startOf('minute').valueOf();

        listMinuteDataByTime({
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

    getFactorName(factorCode: any) {
        const { factors } = this.state;
        const filterFactors: any[] = factors.filter(f => (f.code == factorCode));
        if (filterFactors.length > 0) {
            return filterFactors[0].name;
        }
        return getAirFactorName(factorCode);
    }

    //渲染折线图
    showLineCharts = () => {
        const { siteHourDataList, factorCode, timeType,
            tagText, forecastList, alarmDetail } = this.state;

        let alarmDataTime: number = alarmDetail.alarmDataTime;  

        let xAxisData: any[] = [];
        let seriesData: any[] = [];
        let timeFormate: string = "HH";
        if (timeType == "MINUTE") {
            timeFormate = "HH:mm";
        }
        let echartsPointIndex = 0;

        for (let i = 0; i < siteHourDataList.length; i++) {
            const dataTime: number = siteHourDataList[i].time;
            xAxisData.push(moment(dataTime).format(timeFormate));
            let factorValue = siteHourDataList[i][factorCode];

            let symbol: boolean = false;
            if(dataTime == alarmDataTime){
                symbol = true;
                echartsPointIndex = i;
            }
            seriesData.push(symbol ? {
                value: factorValue,
                symbol: 'circle',
                symbolSize: 5
            } : factorValue);
        }

        let factorName = this.getFactorName(factorCode);

        let legendData = [factorName];

        let seriesArray = [
            {
                data: seriesData,
                type: 'line',
                name: factorName,
                itemStyle: {
                    normal: {
                        color: function (params) {

                            if (params.dataIndex == echartsPointIndex) {
                                return '#dd4a4a';
                            }else{
                                return '#414F70';
                            }
                        },
                        lineStyle: {
                            color: '#414F70'
                        }
                    }
                },
            }
        ];


        if (tagText == '倒挂') {
            //{"a34002": 4985, "a34004": 4985}
            let otherSeriesData: any[] = [];
            const otherFactorCode = factorCode == 'a34004' ? 'a34002' : 'a34004';

            for (let i = 0; i < siteHourDataList.length; i++) {
                let otherFactorValue = siteHourDataList[i][otherFactorCode];
                let symbol: boolean = false;
                if (i == echartsPointIndex) {
                    symbol = true;
                }
                otherSeriesData.push(symbol ? {
                    value: otherFactorValue,
                    symbol: 'circle',
                    symbolSize: 5
                } : otherFactorValue);
            }

            let otherFactorName = this.getFactorName(otherFactorCode);
            legendData.push(otherFactorName);

            seriesArray.push({
                data: otherSeriesData,
                type: 'line',
                name: otherFactorName,
                itemStyle: {
                    normal: {
                        color: function (params) {
                            if (params.dataIndex == echartsPointIndex) {
                                return '#dd4a4a';
                            }else{
                                return '#3FA7DC';
                            }
                        },
                        lineStyle: {
                            color: '#3FA7DC'
                        }
                    }
                },
            });
        }


        //有预测值
        if (forecastList.length > 0 && factorCode == 'a05024') {

            let alarmDataTime: number = alarmDetail.alarmDataTime;

            const now = moment().startOf('hour');

            let forecastSeriesData: any[] = [];

            if (moment(alarmDataTime).add(forecastList.length, 'hour').isAfter(now)) {

                let forecastHours: any[] = [];
                //这种情况 需要追加几个x轴的值
                for (let m = 0; m < forecastList.length; m++) {
                    if (moment(alarmDataTime).add((m + 1), 'hour').isAfter(now)) {
                        forecastHours.push(forecastList[m]);
                    }
                }

                for (let j = 0; j < seriesData.length; j++) {
                    forecastSeriesData.push(undefined);
                }

                for (let i = 0; i < forecastHours.length; i++) {
                    seriesData.push(undefined);

                    forecastSeriesData.push({
                        value: forecastHours[i],
                        symbol: 'circle',
                        symbolSize: 5
                    });

                    xAxisData.push(moment(alarmDataTime).add((i + 1), 'hour').format(timeFormate));
                }

            } else {
                const pointIndex: number = echartsPointIndex;
                for (let j = 0; j < seriesData.length; j++) {
                    if (j > pointIndex && j <= (pointIndex + forecastList.length)) {
                        forecastSeriesData.push({
                            value: forecastList[j - pointIndex - 1],
                            symbol: 'circle',
                            symbolSize: 5
                        });
                    } else {
                        forecastSeriesData.push(undefined);
                    }
                }
            }

            legendData.push('预测值');

            seriesArray.push({
                data: forecastSeriesData,
                type: 'line',
                name: '预测值',
                itemStyle: {
                    normal: {
                        color: function (params) {
                            return '#3FA7DC';
                        },
                        lineStyle: {
                            color: '#3FA7DC'
                        }
                    }
                },
            });
        }

        let option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            // legend: {
            //     data: legendData,
            // },
            color: ['#414F70'],
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: xAxisData,
            },
            yAxis: {
                type: 'value'
            },
            series: seriesArray,
        };

        setTimeout(() => {
            this.lineChart.refresh(option);
        }, 500);
    }

    //跳转到异常分析报告页面
    showReport = () => {
        const { alarmDetail } = this.state;
        const title = encodeURIComponent('异常分析报告');
        const path = `alarm-analysis?alarmId=${alarmDetail.alarmId}&title=${title}`
        Taro.navigateTo({
            url: '/common/pages/webview/index?url=' + encodeURIComponent(path)
        });
    }

    showPollutionSource = (id) => {
        Taro.navigateTo({
            url: `/pages/pollution-manage/detail?id=${id}`
        })
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


    getTimeParams() {
        const { alarmDetail, timeoutRulesConfig } = this.state;
        //处置完成
        if (alarmDetail.status == 'ALREADY_DISPOSED') {
            //处置时间(毫秒)
            const countdowmTime: number = (alarmDetail.disposalTime - alarmDetail.createTime);

            let runTime: number = Math.floor(countdowmTime / 1000);
            let day: number = Math.floor(runTime / 86400);
            runTime = runTime % 86400;
            let hour: number = Math.floor(runTime / 3600);
            runTime = runTime % 3600;
            let minute: number = Math.floor(runTime / 60);

            let timesStr = '处理共耗时';
            if (day > 0) {
                timesStr = timesStr + `${day}天`;
            }
            if (hour > 0) {
                timesStr = timesStr + `${hour}小时`;
            }
            if (minute > 0) {
                timesStr = timesStr + `${minute}分钟`;
            }

            //超时标记
            let timeout: boolean = false;
            if (!isEmpty(timeoutRulesConfig) && timeoutRulesConfig.config) {
                const { finishTime = 0, finishTimeUnit = 'MINUTE' } = timeoutRulesConfig.config;
                if (finishTime > 0) {
                    let finishTimeLimit: number = finishTimeUnit == 'MINUTE' ?
                        finishTime * 60 * 1000 :
                        (finishTimeUnit == 'HOUR' ? finishTime * 60 * 60 * 1000 : finishTime * 24 * 60 * 60 * 1000);
                    timeout = countdowmTime > finishTimeLimit;
                }
            }

            return {
                timesStr,
                timeout,
            }
        } else {
            return {
                timesStr: '',
                timeout: false,
            };
        }
    }


    /**
     * 保存信息
     */
    onSave = (txt: string) => {
        if (!txt || txt == '') {
            Taro.showToast({
                title: '管控建议不能为空',
                icon: 'none',
                duration: 1000
            })
            return;
        }
        this.setState({
            controlSuggestText: txt,
        }, () => {
            const { alarmDetail } = this.state;
            editAlarmControlSuggest(alarmDetail.alarmId, txt);
        });
    }

    render() {
        const {
            dispatchStore: {
                alarmSiteMarkers, alarmPollutionSourceMarkers
            }
        } = this.props;
        let markerList: marker[] = [...alarmPollutionSourceMarkers, ...alarmSiteMarkers]

        const { tabSelected, alarmDetail, replyList = [], psInHotMapList = [], factorCode,
            longitude, latitude, viewList = [], recipientList = [], showHotMap,
            tagText, editControlSuggest, controlSuggestText, factors } = this.state;

        const showEmpty = (<View className='empty'><EmptyHolder text='暂无数据' /></View>)
        const showEmpty1 = (<View className='empty'><EmptyHolder text='暂无数据' /></View>)
        const showEmpty2 = (<View className='empty'><EmptyHolder text='暂无数据' /></View>)

        const timeParams: any = this.getTimeParams();

        //分析热区数据
        const siteTracingPolygons = alarmDetail.hotmapAnalysisData && alarmDetail.hotmapAnalysisData.features ?
            alarmDetail.hotmapAnalysisData.features.map((feature, index) => ({
                points: feature.geometry.coordinates[0].map(item => {
                    return item[0] > item[1] ? { latitude: item[1], longitude: item[0] } : { latitude: item[0], longitude: item[1] }
                }),
                strokeWidth: 0.5,
                strokeColor: "#D1D1D1",
                fillColor: getFillColor(index, alarmDetail.hotmapAnalysisData.features.length)
            })) : [];

        const finishList: any[] = replyList.filter(item => item.appendDatas && item.appendDatas.alarmStatus == 1);
        const lastFinishReplyId: number = finishList && finishList.length > 0 ? finishList[0].id : 0;


        let factorList: string[] = getAlarmFactors(alarmDetail);

        return (
            <View className='root_view'>
                <View className="alarm_detail_content">
                    <ScrollView
                        className='scrollview'
                        scrollY
                        scrollWithAnimation>

                        <View className="body">
                            {
                                alarmDetail.alarmId > 0 &&
                                <View className="msg_body">
                                    <View className="contentView">
                                        <View className='titleAndStatus'>
                                            <Text className="title">【{getAlarmSourceName(alarmDetail.sourceType)}】{alarmDetail.sourceName}</Text>
                                            <View className={alarmDetail.status == 'ALREADY_DISPOSED' ? 'alarmStatus done' : 'alarmStatus'}>{alarmDetail.status == 'ALREADY_DISPOSED' ? '已处置' : '未处置'}</View>
                                        </View>
                                        <View className='timeView'>
                                            <Text className='time'>{moment(alarmDetail.createTime).format('YYYY/MM/DD HH:mm')}</Text>
                                        </View>
                                        <View className='content'>
                                            {
                                                tagText != '' ? <Text className='factorName'>{tagText}</Text> :
                                                    (
                                                        factorList && factorList.length > 0 &&
                                                        factorList.filter((factor: any) => factor.code && factor.name).map((factor: any) => {
                                                            return (
                                                                <Text className='factorName'>{factor.name}</Text>
                                                            );
                                                        })
                                                    )
                                            }

                                            {alarmDetail.content}
                                        </View>
                                        {
                                            alarmDetail.status == 'ALREADY_DISPOSED' &&
                                            <View className={timeParams.timeout ? 'timeView timeout' : 'timeView'}>
                                                <Image className='timeIcon' src={timeParams.timeout ? elapsedTimeOutIcon : elapsedTimeIcon}></Image>
                                                <Text className='txt'>{timeParams.timesStr}</Text>
                                                <Text className='timeOutIcon'>超时</Text>
                                            </View>
                                        }

                                    </View>
                                </View>
                            }

                            <View className='factorConcentrationDiv'>
                                <View className='titleAndFactors'>
                                    <View className='title'>因子浓度趋势</View>
                                    {
                                        tagText != '倒挂' &&
                                        <Picker mode='selector' value={0} range={factors} range-key='name' onChange={this.handleFactorChange.bind(this)}>
                                            <Text className='factorName'>{this.getFactorName(factorCode)}</Text>
                                            <Image className="icon" src={factorIcon}></Image>
                                        </Picker>
                                    }
                                </View>
                                <View className="fpi_chart__body">
                                    <LineChart ref={this.refLineChart} />
                                </View>
                            </View>

                            {
                                controlSuggestText && controlSuggestText != '' &&
                                <View className='analysisContent'>
                                    <View className='title'>管控建议</View>
                                    {
                                        <FpiTextArea
                                            com-class='item'
                                            text={controlSuggestText}
                                            onSave={this.onSave.bind(this)}
                                            isEdit={editControlSuggest}
                                        />
                                    }
                                </View>
                            }

                            {
                                showHotMap &&
                                <View className='mapView'>
                                    <View className='titleAndBigMap'>
                                        <Text className='title'>污染热区</Text>
                                        <View className='showBigMap' onClick={this.showReport}>
                                            <Text className='txt'>全屏地图</Text>
                                            <Image className='icon' src={bigMapIcon}></Image>
                                        </View>
                                    </View>

                                    <Map style={{ height: `424rpx`, width: `686rpx`, borderRadius: `12px`, marginTop: `26px` }}
                                        id='map'
                                        scale={12}
                                        show-location
                                        markers={markerList}
                                        polygons={siteTracingPolygons}
                                        className='map'
                                        longitude={longitude}
                                        latitude={latitude}
                                        enableZoom={false}
                                        enableScroll={false}
                                    >
                                    </Map>
                                </View>
                            }


                            {
                                showHotMap && psInHotMapList && psInHotMapList.length > 0 &&
                                <View className='pollutionSroucesInHotMap'>
                                    <View className='title'>污染热区内的污染源</View>
                                    <View className='pollutionSrouceList'>
                                        <View className='item titles'>
                                            <View className='index'>序号</View>
                                            <View className='name'>污染源企业名称</View>
                                            <View className='chevron_right'></View>
                                        </View>
                                        {
                                            psInHotMapList.map((item, index) => (
                                                <View className='item' key={item.id}>
                                                    <View className='index'>{index + 1}</View>
                                                    <View className='name'>{item.name}</View>
                                                    <AtIcon className='chevron_right' value='chevron-right' size='18' color='#7A8499' onClick={this.showPollutionSource.bind(this, item.id)} />
                                                </View>
                                            ))
                                        }
                                    </View>
                                </View>
                            }

                            <View className='splitView'></View>

                            <View className='operateTabView'>
                                <View onClick={this.onSelectTab.bind(this, "REPLY")} className={tabSelected == "REPLY" ? 'operateTab selected' : 'operateTab'}>
                                    <Text className='name'>回复</Text>
                                    <Text className='number'>({replyList.length})</Text>
                                </View>
                                <View onClick={this.onSelectTab.bind(this, "RECIPIENT")} className={tabSelected == "RECIPIENT" ? 'operateTab selected' : 'operateTab'}>
                                    <Text className='name'>接收人</Text>
                                    <Text className='number'>({recipientList.length})</Text>
                                </View>
                                <View onClick={this.onSelectTab.bind(this, "VIEW")} className={tabSelected == "VIEW" ? 'operateTab selected' : 'operateTab'}>
                                    <Text className='name'>浏览记录</Text>
                                    <Text className='number'>({viewList.length})</Text>
                                </View>
                            </View>
                            {tabSelected == "REPLY" ?
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
                                                                    <Text className={alarmDetail.status == 'ALREADY_DISPOSED' && item.id == lastFinishReplyId ? 'status' : 'status gray'} >
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
                                </View>
                                : ""}
                            {tabSelected == "RECIPIENT" ?
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
                                </View>
                                : ""}
                            {tabSelected == "VIEW" ?
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
                                </View>
                                : ""}

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
