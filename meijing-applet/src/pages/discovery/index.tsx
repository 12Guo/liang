import Taro, { Config } from '@tarojs/taro'
import { ComponentType } from 'react'
import { View, Text, Image, ScrollView, Block } from '@tarojs/components'
import { AtIcon } from 'taro-ui'
import './index.scss'
import { rootSourceBaseUrl, isRelease, webSite } from '@common/utils/requests'
import { getDivisionMonitorData } from '../../service/pollutant'
import { inject, observer } from '@tarojs/mobx'
import { UserStore } from '@common/store/user'
import moment from 'moment'
import { DivisionMonitorData } from '../../model'
import { getHourLevel, getHourLevelTitle, getFactorNames } from '@common/utils/monitor'
import { getTypeDetail } from '../../service/department'
import { isTJVersion } from '@common/utils/common'
import isEmpty from 'lodash/isEmpty'
import get from 'lodash/get'
import { getLocation } from '../../service/userDivision'

interface PollutantCode {
    name: string,
    code: string
}

interface DiscoveryProps {
    userStore: UserStore
}

interface DiscoveryState {
    monitorData: DivisionMonitorData,
    showConstruction: boolean,
}

interface Discovery {
    props: DiscoveryProps,
    state: DiscoveryState
}

// //热点区域
// const redian = rootSourceBaseUrl + "/assets/discovery/redian.png";
// //对比分析
// const duibifenxi = rootSourceBaseUrl + "/assets/discovery/duibifenxi.png";
// //分析报告
// const fenxibaogao = rootSourceBaseUrl + "/assets/discovery/fenxibaogao.png";
// //监测排名
// const jiancepaiming = rootSourceBaseUrl + "/assets/discovery/jiancepaiming.png";
// //更多
// const more = rootSourceBaseUrl + "/assets/discovery/more.png"
// //目标管理
// const mubiao = rootSourceBaseUrl + "/assets/discovery/mubiao.png";
// //时序分析
// const shixu = rootSourceBaseUrl + "/assets/discovery/shixu.png";
// //通讯录
// const tongxun = rootSourceBaseUrl + "/assets/discovery/tongxun.png";
// //污染日历
// const wuran = rootSourceBaseUrl + "/assets/discovery/wuran.png";
//污染传输
const wuranchuanshu = rootSourceBaseUrl + "/assets/discovery/wuranchuanshu.png";
// //污染源
// const wuranyuan = rootSourceBaseUrl + "/assets/discovery/wuranyuan.png";
// //巡查指南
// const xunchazhinan = rootSourceBaseUrl + "/assets/discovery/xunchazhinan.png";
// //影响分析
const yingxiang = rootSourceBaseUrl + "/assets/discovery/yingxiang.png";


//热点区域
const redianGray = rootSourceBaseUrl + "/assets/discovery/redian_gray.png";
//对比分析
const duibifenxi = rootSourceBaseUrl + "/assets/discovery/duibifenxi.png";
//分析报告
const fenxibaogao = rootSourceBaseUrl + "/assets/discovery/fenxibaogao.png";
//统计分析
const tongjifenxi = rootSourceBaseUrl + "/assets/discovery/tongjifenxi.png";

//监测预警
const alarmUrl = rootSourceBaseUrl + "/assets/discovery/alarm.png";

//监测排名
const jiancepaiming = rootSourceBaseUrl + "/assets/discovery/jiancepaiming.png";
//更多
const moreGray = rootSourceBaseUrl + "/assets/discovery/more_gray.png"
//目标管理
const mubiaoGray = rootSourceBaseUrl + "/assets/discovery/mubiao_gray.png";
//时序分析
const shixu = rootSourceBaseUrl + "/assets/discovery/shixu.png";
//通讯录
const tongxunGray = rootSourceBaseUrl + "/assets/discovery/tongxun_gray.png";
//污染日历
const wuranGray = rootSourceBaseUrl + "/assets/discovery/wuran_gray.png";
//污染传输
const wuranchuanshuGray = rootSourceBaseUrl + "/assets/discovery/wuranchuanshu_gray.png";
//污染源
const wuranyuan = rootSourceBaseUrl + "/assets/discovery/wuranyuan.png";
//目标配置
const goalConfig = rootSourceBaseUrl + "/assets/discovery/goal_config.png";
//巡查指南
const xunchazhinanGray = rootSourceBaseUrl + "/assets/discovery/xunchazhinan_gray.png";
//工作日志
const worklog = rootSourceBaseUrl + "/assets/discovery/rizhi.png";

//站点溯源
const zhandiansuyuan = rootSourceBaseUrl + "/assets/discovery/zhandiansuyuan.png";

//专项行动
const zhuanxiang = rootSourceBaseUrl + "/assets/discovery/zhuanxiang.png"

//工作统计
const gongzuotongji = rootSourceBaseUrl + "/assets/discovery/gongzuotongji.png";

//工作统计
const gztj = rootSourceBaseUrl + "/assets/discovery/gztj.png";

//调度管理
const dispatchManage = rootSourceBaseUrl + "/assets/discovery/dispatchManage.png";

//工地扬尘
const gongdiyangcheng = rootSourceBaseUrl + "/assets/discovery/gongdiyangcheng.png";

//员工健康
const yuangongjiankang = rootSourceBaseUrl + "/assets/discovery/yuangongjiankang.png";

//健康统计
const jiankangtongji = rootSourceBaseUrl + "/assets/discovery/jiankangtongji.png";

//美境专车
const meijingCar = rootSourceBaseUrl + "/assets/discovery/meijing_car.png";

//事件审核
const eventReview = rootSourceBaseUrl + "/assets/discovery/event-review.png";

//事件排名
const inspectRank = rootSourceBaseUrl + "/assets/discovery/inspect_rank.png";

//保良分析
const baoliang = rootSourceBaseUrl + "/assets/discovery/baoliang.png";

//激光雷达
const radarPng = rootSourceBaseUrl + "/assets/discovery/radar.png";

//道路扬尘
const daoluyangchen = rootSourceBaseUrl + "/assets/discovery/daoluyangchen.png";

const pollutantCodes: PollutantCode[] = [
    {
        "code": "V_a34004",
        "name": "PM2.5"
    },
    {
        "code": "V_a34002",
        "name": "PM10"
    },
    {
        "code": "V_a05024",
        "name": "O₃"
    },
    {
        "code": "V_a21004",
        "name": "NO₂"
    },
    {
        "code": "V_a21026",
        "name": "SO₂"
    },
    {
        "code": "V_a21005",
        "name": "CO"
    }
];

@inject("userStore")
@observer
class Discovery extends Taro.Component {

    constructor() {
        super(...arguments)
        //@ts-ignore
        this.state = {
            showConstruction: false,
        }
    }

    config: Config = {
        navigationBarTitleText: '发现',
        enablePullDownRefresh: true,
        backgroundTextStyle: 'dark',
    }

    async componentDidMount() {
        await this.refreshData()
    }

    componentDidShow() {
        const { userStore } = this.props
        userStore.appletModules()
        this.getAuthority()
    }

    //获取工地授权
    getAuthority = () => {
        try {
            getTypeDetail().then(response => {
                this.setState({ showConstruction: !isEmpty(response.data.config) })
            })
        }
        catch (err) { }
    }

    //下拉刷新
    onPullDownRefresh() {
        getDivisionMonitorData().then(monitorData => {
            this.setState({
                monitorData
            });
        });
        Taro.stopPullDownRefresh();
    }


    onShareAppMessage() {
        return {
            title: `发现`,
            path: `/pages/discovery/index`
        }
    }

    async refreshData() {
        const monitorData = await getDivisionMonitorData();
        this.setState({
            monitorData
        });
    }

    //下拉加载
    async onScrollToLower() {
        await this.refreshData()
    }

    //通过监测值解析颜色
    parseColorByValue(value: number, factorDataKey: string) {
        let level = getHourLevel(factorDataKey, value);
        if (level <= 5) {
            return "six_pollutant_title .color_level_" + level
        } else {
            return "six_pollutant_title .color_level_5"
        }
    }

    //通过AQI监测值获取颜色
    parseTitleColorByValue(value: number) {
        let level = getHourLevel("aqi", value);
        if (level <= 5) {
            return ".title_color_level_" + level
        } else {
            return ".title_color_level_5"
        }
    }

    jumpToDataQuery = () => {
        let path = `dataQuery?title=${encodeURIComponent('数据查询')}`;
        Taro.navigateTo({
            url: '/common/pages/webview/index?url=' + encodeURIComponent(path)
        })
    }

    jumpToZhandiansuyuan = () => {
        const { userStore: { userDetails } } = this.props
        const path = `single-site-tracing?divisionCode=${userDetails.divisionCode}&title=${encodeURIComponent('站点溯源')}`

        Taro.navigateTo({
            url: '/common/pages/webview/index?url=' + encodeURIComponent(path)
        })
    }

    jumpToLog = () => {
        Taro.navigateTo({
            url: '/pages/log/index'
        })
    }

    //影响分析
    jumpToAnalyse() {
        const { userStore: { userDetails } } = this.props;

        getLocation().then(location => {
            const longitude = location.longitude;
            const latitude = location.latitude;

            if (longitude && latitude) {
                const path = `impact-analysis?divisionCode=${userDetails.divisionCode}&latitude=${latitude}&longitude=${longitude}&title=${encodeURIComponent('影响分析')}`;
                Taro.navigateTo({
                    url: '/common/pages/webview/index?url=' + encodeURIComponent(path)
                });
            }
        });
    }

    // 专项行动
    onZxxdHandle = () => {
        Taro.navigateTo({
            url: '/pages/special-action/index'
        })
    }

    // 统计分析
    jumpToDataAnalyst = () => {
        let path = `analyst?title=${encodeURIComponent('统计分析')}`;
        Taro.navigateTo({
            url: '/common/pages/webview/index?url=' + encodeURIComponent(path)
        })
    }

    //监测预警
    jumpToAlarm = () => {
        Taro.navigateTo({
            url: '/pages/alarm/site_alarm'
        });
    }

    // 污染源
    jumpToDataPollution = () => {
        Taro.navigateTo({
            url: '/pages/pollution-manage/index'
        });
    }

    jumpToGoalConfig = () => {
        const { userStore: { userDetails } } = this.props
        let path = "";
        if (userDetails.divisionFree) {
            path = `division_goal/detail?title=${encodeURIComponent('目标达成分析研判')}&divisionCode=${userDetails.divisionCode}&divisionFree=true`;
        } else {
            path = `division_goal/detail?title=${encodeURIComponent('目标达成分析研判')}&divisionCode=${userDetails.divisionCode}`;
        }
        Taro.navigateTo({
            url: '/common/pages/webview/index?url=' + encodeURIComponent(path)
        })
    }

    // 排行榜
    jumpToDataRank = () => {
        const { userStore: { userDetails } } = this.props
        let path = `rank?divisionCode=${userDetails.divisionCode}&title=${encodeURIComponent('排行榜')}`;
        Taro.navigateTo({
            url: '/common/pages/webview/index?url=' + encodeURIComponent(path)
        })
    }

    // 对比分析
    jumpToDataComp = () => {
        const { userStore: { userDetails } } = this.props
        let path = `site-comparison?divisionCode=${userDetails.divisionCode}&title=${encodeURIComponent('对比分析')}`;
        Taro.navigateTo({
            url: '/common/pages/webview/index?url=' + encodeURIComponent(path)
        })
    }

    //污染传输
    jumpToWuranchuanshu = () => {
        const { userStore: { userDetails } } = this.props
        let path = `pollution-transmission?divisionCode=${userDetails.divisionCode}&title=${encodeURIComponent('污染传输')}`;
        Taro.navigateTo({
            url: '/common/pages/webview/index?url=' + encodeURIComponent(path)
        })
    }

    //保良分析
    jumpToBaoLiang = () => {
        const { userStore: { userDetails } } = this.props
        let path = `fine-analysis?divisionCode=${userDetails.divisionCode}&title=${encodeURIComponent('保良分析')}`;
        Taro.navigateTo({
            url: '/common/pages/webview/index?url=' + encodeURIComponent(path)
        })
    }
    //激光雷达
    jumpToRadar = () => {
        const { userStore: { userDetails } } = this.props
        let path = `radar?divisionCode=${userDetails.divisionCode}&title=${encodeURIComponent('激光雷达')}`;
        Taro.navigateTo({
            url: '/common/pages/webview/index?url=' + encodeURIComponent(path)
        })
    }

    // 统计分析
    jumpToTJFX = () => {
        const { userStore: { userDetails } } = this.props
        let path = `report?divisionCode=${userDetails.divisionCode}&title=${encodeURIComponent('分析报告')}`;
        Taro.navigateTo({
            url: '/common/pages/webview/index?url=' + encodeURIComponent(path)
        })
    }

    // 工作统计
    onGztjHandle = () => {
        const { userStore: { userDetails } } = this.props
        let path = `grid?divisionCode=${userDetails.divisionCode}&title=${encodeURIComponent('工作统计')}`;
        Taro.navigateTo({
            url: '/common/pages/webview/index?url=' + encodeURIComponent(path)
        })
    }

    // 工作统计
    onWorkHandle = () => {
        // const { userStore: { userDetails } } = this.props
        // let path = `work?divisionCode=${userDetails.divisionCode}&title=${encodeURIComponent('工作统计')}`;
        // Taro.navigateTo({
        //     url: '/common/pages/webview/index?url=' + encodeURIComponent(path)
        // })
        Taro.navigateTo({
            url: '/pages/work_stats/index'
        })
    }

    //指挥调度
    jumpToDispatchManage = () => {
        Taro.navigateTo({
            url: '/pages/dispatchManage/index'
        })
    }

    //事件排名
    jumpToInspectRank = () => {
        Taro.navigateTo({
            url: '/pages/inspectRank/index'
        })
    }

    onConstructionHandle = () => {
        Taro.navigateToMiniProgram({
            appId: 'wx636ac919307ab7ba',
            path: 'pages/index/index',
            envVersion: isRelease ? 'release' : 'trial'
        })
    }

    onRoadHandle = () => {
        Taro.navigateToMiniProgram({
            appId: 'wx4ce336201fefaac6',
            path: 'pages/index/index',
            envVersion: isRelease ? 'release' : 'trial'
        })
    }

    // 员工健康
    jumpToYGJK = () => {
        let path = `healthy/edit?title=${encodeURIComponent('员工健康')}`;
        Taro.navigateTo({
            url: '/common/pages/webview/index?url=' + encodeURIComponent(path)
        })
    }

    // 健康统计
    jumpToJKTJ = () => {
        let path = `healthy/stats?title=${encodeURIComponent('健康统计')}`;
        Taro.navigateTo({
            url: '/common/pages/webview/index?url=' + encodeURIComponent(path)
        })
    }

    // 美境专车
    jumpToMJZC = () => {
        const { userStore: { userDetails, token } } = this.props
        let path = "";
        if (userDetails.hasOpenCar) {
            path = `/meijing-spcar-user-web/#/home?title=${encodeURIComponent('美境专车')}&areacode=${userDetails.divisionCode}&phone=${userDetails.phone}`;
        } else {
            path = `/meijing-spcar-user-web/#/introduce?title=${encodeURIComponent('美境专车')}`;
        }
        Taro.navigateTo({
            url: "/common/pages/webview/index?url=" + encodeURIComponent(path)
        });
    }

    jumpToEventReview = () => {
        const { userStore: { userDetails } } = this.props
        const path = `/meijing-ai-examine-web/#/index?title=${encodeURIComponent("事件审核")}&areaCode=${userDetails.divisionCode}`;

        Taro.navigateTo({
            url: "/common/pages/webview/index?url=" + encodeURIComponent(path)
        });
    }

    parseValue(value: number, type: string) {
        if (type == "V_a21005") {
            return value.toFixed(1);
        } else {
            return Math.floor(value);
        }
    }

    showDetail = () => {
        const title = encodeURIComponent('空气质量');
        let path = `air_quality?title=${title}`;
        Taro.navigateTo({
            url: '/common/pages/webview/index?url=' + encodeURIComponent(path)
        })
    }

    render() {
        const { monitorData, showConstruction } = this.state;
        const { userStore: { userDetails, moduleAuthority } } = this.props
        const isDivisionFree: boolean = userDetails.divisionFree == undefined ? false : userDetails.divisionFree;
        const isOpenCar: boolean = userDetails.hasOpenCar == undefined ? false : userDetails.hasOpenCar;
        const isTianJin = isTJVersion(userDetails)
        const hasMonitorData = monitorData && monitorData.datas;
        const airQualityAuthority = get(moduleAuthority, 'discovery.airQuality', true)
        const judgeToolsAuthority = get(moduleAuthority, 'discovery.judgeTools', true)
        const specialGovernanceAuthority = get(moduleAuthority, 'discovery.specialGovernance', true)
        //@ts-ignore
        const isShaoXing = userDetails.divisionCode === '330600000000'
        let aqiValueStyle: string = this.parseTitleColorByValue(hasMonitorData ? hasMonitorData.aqi : 0);

        return (
            <View className="root">
                <ScrollView
                    className='workListView'
                    scrollY
                    scrollWithAnimation
                    lowerThreshold={50}
                    onScrollToLower={this.onScrollToLower}
                >
                    {!isTianJin && <Block>
                        {airQualityAuthority && (
                            <Block>
                                <View className="head" onClick={this.showDetail.bind(this)}>
                                    <View className="air_quality">
                                        <Text className="localtion">
                                            {userDetails.divisionName}空气质量
                                    </Text>
                                        <View className='showDetailView'>
                                            <Text className='txt'>查看详情</Text>
                                            <AtIcon className='chevron_right' value='chevron-right' size='18' color='#7A8499' />
                                        </View>
                                    </View>
                                    <View className="aqi_view">
                                        <View className="aqi_view_left">
                                            <Text className={`aqi_value ${aqiValueStyle}`}>{hasMonitorData ? hasMonitorData.aqi : "--"}</Text>
                                            <Text className="aqi_tip">AQI</Text>
                                        </View>
                                        <View className="aqi_view_right">
                                            <Text className={`pollutant_value ${aqiValueStyle}`}>{hasMonitorData ? getHourLevelTitle(hasMonitorData.aqi) : "--"}</Text>
                                            <Text className="primary_pollutant">首污: {hasMonitorData && hasMonitorData.main_pollutants && hasMonitorData.main_pollutants.length > 0 && getFactorNames(hasMonitorData.main_pollutants).join(",") || "--"}</Text>
                                        </View>
                                    </View>
                                    <View className="aqi_value_view">
                                        {
                                            pollutantCodes.map((res: PollutantCode) => {
                                                let colorStyle: string = this.parseColorByValue(hasMonitorData && monitorData.datas[res.code] ? monitorData.datas[res.code] : 0, res.code)
                                                return (
                                                    <View key={res.code} className="value_iteam">
                                                        <Text className="six_pollutant_vale">{hasMonitorData && monitorData.datas[res.code] ? this.parseValue(monitorData.datas[res.code], res.code) : '--'}</Text>
                                                        <Text className={colorStyle}>{res.name}</Text>
                                                    </View>
                                                )
                                            })
                                        }
                                    </View>
                                    <View className="update_time">
                                        更新时间: {monitorData ? moment(monitorData.dataTime).format("YYYY-MM-DD HH") : "--"}
                                    </View>
                                </View>
                                <View className="space"></View>
                            </Block>
                        )}
                        {!isShaoXing && (
                            <View className="tool">
                                <View className="title">专项治理</View>
                                <View className="tool_group">
                                    <View className="tool_item" onClick={this.onConstructionHandle}>
                                        <Image className="image" src={gongdiyangcheng}></Image>
                                        <Text className="name">工地扬尘</Text>
                                    </View>
                                    <View className="tool_item" onClick={this.onRoadHandle}>
                                        <Image className="image" src={daoluyangchen}></Image>
                                        <Text className="name">道路扬尘</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {judgeToolsAuthority && (
                            <View className="tool">
                                <View className="title">研判工具</View>
                                <View className="tool_group">
                                    <View className="tool_item" onClick={this.jumpToDataQuery}>
                                        <Image className="image" src={shixu}></Image>
                                        <Text className="name">数据查询</Text>
                                    </View>

                                    {!isDivisionFree && <View className="tool_item" onClick={this.jumpToZhandiansuyuan}>
                                        <Image className="image" src={zhandiansuyuan}></Image>
                                        <Text className="name">站点溯源</Text>
                                    </View>}

                                    {!isDivisionFree && <View className="tool_item" onClick={this.jumpToAnalyse}>
                                        <Image className="image" src={yingxiang}></Image>
                                        <Text className="name">影响分析</Text>
                                    </View>}
                                    <View className="tool_item" onClick={this.jumpToDataRank}>
                                        <Image className="image" src={jiancepaiming}></Image>
                                        <Text className="name">监测排名</Text>
                                    </View>
                                    <View className="tool_item" onClick={this.jumpToDataComp}>
                                        <Image className="image" src={duibifenxi}></Image>
                                        <Text className="name">对比分析</Text>
                                    </View>
                                    {!isDivisionFree && <View className="tool_item" onClick={this.jumpToWuranchuanshu}>
                                        <Image className="image" src={wuranchuanshu}></Image>
                                        <Text className="name">污染传输</Text>
                                    </View>}
                                    <View className="tool_item" onClick={this.jumpToBaoLiang}>
                                        <Image className="image" src={baoliang}></Image>
                                        <Text className="name">保良分析</Text>
                                    </View>
                                    <View className="tool_item" onClick={this.jumpToRadar}>
                                        <Image className="image" src={radarPng}></Image>
                                        <Text className="name">激光雷达</Text>
                                    </View>
                                    {/* <View className="tool_item">
                                <Image className="image" src={wuranGray}></Image>
                                <Text className="name">污染日历</Text>
                            </View>
                            <View className="tool_item">
                                <Image className="image" src={moreGray}></Image>
                                <Text className="name">更多</Text>
                            </View> */}
                                </View>
                            </View>
                        )}
                    </Block>}

                    <View className="tool">
                        <View className="title">常用工具</View>
                        <View className="tool_group">
                            {judgeToolsAuthority && (
                                <View className="tool_item" onClick={this.jumpToTJFX}>
                                    <Image className="image" src={tongjifenxi}></Image>
                                    <Text className="name">专家报告</Text>
                                </View>
                            )}
                            {/* <View className="tool_item" onClick={this.jumpToLog}>
                                <Image className="image" src={worklog}></Image>
                                <Text className="name">日志导出</Text>
                            </View> */}
                            {/* <View className="tool_item" onClick={this.onGztjHandle}>
                                <Image className="image" src={gongzuotongji}></Image>
                                <Text className="name">巡查统计</Text>
                            </View> */}
                            {!isShaoXing && (
                                <View className="tool_item" onClick={this.onZxxdHandle}>
                                    <Image className="image" src={zhuanxiang}></Image>
                                    <Text className="name">专项行动</Text>
                                </View>
                            )}
                            <View className="tool_item" onClick={this.jumpToAlarm}>
                                <Image className="image" src={alarmUrl}></Image>
                                <Text className="name">监测预警</Text>
                            </View>
                            {/* <View className="tool_item" onClick={this.jumpToDataAnalyst}>
                                <Image className="image" src={fenxibaogao}></Image>
                                <Text className="name">统计分析</Text>
                            </View> */}
                            <View className="tool_item" onClick={this.jumpToDataPollution}>
                                <Image className="image" src={wuranyuan}></Image>
                                <Text className="name">污染源</Text>
                            </View>
                            {judgeToolsAuthority && (
                                <View className="tool_item" onClick={this.jumpToGoalConfig}>
                                    <Image className="image" src={goalConfig}></Image>
                                    <Text className="name">目标配置</Text>
                                </View>
                            )}
                            <View className="tool_item" onClick={this.onWorkHandle}>
                                <Image className="image" src={gztj}></Image>
                                <Text className="name">工作统计</Text>
                            </View>
                            <View className="tool_item" onClick={this.jumpToDispatchManage}>
                                <Image className="image" src={dispatchManage}></Image>
                                <Text className="name">调度管理</Text>
                            </View>

                            {!isShaoXing && (
                                <View className="tool_item" onClick={this.jumpToInspectRank}>
                                    <Image className="image" src={inspectRank}></Image>
                                    <Text className="name">先锋榜</Text>
                                </View>
                            )}

                            {/* <View className="tool_item" onClick={this.jumpToYGJK}>
                                <Image className="image" src={yuangongjiankang}></Image>
                                <Text className="name">员工健康</Text>
                            </View> */}
                            {/* <View className="tool_item" onClick={this.jumpToJKTJ}>
                                <Image className="image" src={jiankangtongji}></Image>
                                <Text className="name">健康统计</Text>
                            </View> */}
                            {!isShaoXing && (
                                <View className="tool_item" onClick={this.jumpToMJZC}>
                                    <Image className="image" src={meijingCar}></Image>
                                    <Text className="name">美境专车</Text>
                                </View>
                            )}

                            {/* <View className="tool_item">
                                <Image className="image" src={mubiaoGray}></Image>
                                <Text className="name">目标管理</Text>
                            </View>
                            <View className="tool_item">
                                <Image className="image" src={xunchazhinanGray}></Image>
                                <Text className="name">巡查指南</Text>
                            </View>
                            <View className="tool_item">
                                <Image className="image" src={tongxunGray}></Image>
                                <Text className="name">通讯录</Text>
                            </View> */}
                            {
                                get(userDetails, 'roles', []).find((role: any) => role.code === 'system_operator') && !isShaoXing && (
                                    <View className="tool_item" onClick={this.jumpToEventReview}>
                                        <Image className="image" src={eventReview}></Image>
                                        <Text className="name">事件审核</Text>
                                    </View>
                                )
                            }
                        </View>
                    </View>
                    <View className="other_tool">

                    </View>
                </ScrollView>
            </View>
        )
    }

} export default Discovery as ComponentType
