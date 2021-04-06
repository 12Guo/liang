import Taro, { Component, Config } from '@tarojs/taro';
import { AtBadge, AtCountdown } from 'taro-ui'
import { observer, inject } from '@tarojs/mobx';
import { View, Text, Image, Map, ScrollView, CoverView, CoverImage, Picker, Camera } from '@tarojs/components';
import { marker } from '@tarojs/components/types/Map'
import GoalItem from '@common/components/FbiItems/GoalItem/index';
import { getUnReadMessageCount } from '../../service/message'
import { rootSourceBaseUrl, isRelease } from '@common/utils/requests'
import { getLocation } from '../../service/userDivision'
import { Remind } from '../../store/dispatch'
import { reportDetail } from '../../service/report'
import { Location } from '../../model'
import { uploadPersionLocation } from "../../service/user"
import moment from 'moment'
import './index.scss'
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';

interface TaskDispatchNewProps {
    userStore: any;
    systemInfoStore: any;
    dispatchStore: any;
}

interface TaskDispatchNewState {
    messageUnReadCount: number;
    centerLocaltion: Location;
    factorCode: string;
    isSendMsgBtnShow: boolean;
}


const messageUrlPath = rootSourceBaseUrl + "/assets/task_dispatch/message.png";
const goal_edit = rootSourceBaseUrl + "/assets/task_dispatch/goal_edit.png";
const event = rootSourceBaseUrl + "/assets/task_dispatch/event.png";
const turn_right = rootSourceBaseUrl + "/assets/task_dispatch/turn_right.png";
const xuncha = rootSourceBaseUrl + "/assets/task_dispatch/xuncha.png";
const map_full = rootSourceBaseUrl + "/assets/task_dispatch_new/icon-full.png";
//站点溯源
const zhandiansuyuan = rootSourceBaseUrl + "/assets/discovery/zhandiansuyuan.png";
//影响分析
const yingxiang = rootSourceBaseUrl + "/assets/discovery/yingxiang.png";
//监测排名
const jiancepaiming = rootSourceBaseUrl + "/assets/discovery/jiancepaiming.png";
//监测预警
const alarmUrl = rootSourceBaseUrl + "/assets/discovery/alarm.png";
//对比分析
const duibifenxi = rootSourceBaseUrl + "/assets/discovery/duibifenxi.png";
const send_dispatch = rootSourceBaseUrl + "/assets/task_dispatch/send_dispatch.png";
const currentLocaltion = rootSourceBaseUrl + "/assets/task_dispatch/location_center.png";

//能够发送调度信息的角色
const canSendDispatchMsgRoles: string[] = ["leader", "dispatcher", "experter"];

const ANALYSIS_MENUS = [
    {
        image: zhandiansuyuan,
        code: 'zhandiansuyuan',
        title: '站点溯源'
    }, {
        image: yingxiang,
        code: 'analyse',
        title: '影响分析'
    }, {
        image: jiancepaiming,
        code: 'rank',
        title: '监测排名'
    },
    {
        image: duibifenxi,
        code: 'site-comparison',
        title: '对比分析'
    }, {
        image: alarmUrl,
        code: 'alarm',
        title: '监测预警'
    }
]
const Factors: any = [
    { label: 'PM2.5', value: 'a34004' },
    { label: 'PM10', value: 'a34002' }
]
//状态栏高度
let statusBarHeight = 20;
let timeout: any = null

@inject('userStore', 'systemInfoStore', 'dispatchStore')
@observer
class TaskDispatchNew extends Component<TaskDispatchNewProps, TaskDispatchNewState> {
    config: Config = {
        navigationBarTitleText: '濮阳县',
        navigationStyle: "custom"
    }

    static externalClasses = ['com-class']
    mapCtx: any;
    constructor(props) {
        super(props);

        this.state = {
            messageUnReadCount: 0,
            centerLocaltion: {
                longitude: 0,
                latitude: 0
            },
            isSendMsgBtnShow: false,
            factorCode: 'a34004',
        }
    }

    componentWillMount() {
        const { userStore } = this.props;
        this.setInitStatusHeight();
        let isShowSendMsg: boolean = false;
        let roles = userStore.userDetails.roles;
        if (roles != null) {
            roles.map((entry) => {
                if (canSendDispatchMsgRoles.indexOf(entry.code) != -1) {
                    isShowSendMsg = true;
                }
            })
        }
        this.setState({
            isSendMsgBtnShow: isShowSendMsg
        })
    }

    //地图移动到当前位置或行政区划中心点
    onMoveToCurentPosition() {
        const { centerLocaltion } = this.state;
        if (this.mapCtx == null) {
            this.mapCtx = Taro.createMapContext('map')
        }

        this.mapCtx.moveToLocation({
            longitude: centerLocaltion.longitude,
            latitude: centerLocaltion.latitude
        })
    }

    componentDidShow() {
        try {
            const { userStore: { userDetails }, dispatchStore } = this.props
            const { userStore: { userDetails: { divisionCenterLocation } } } = this.props;
            const { factorCode } = this.state
            timeout = setTimeout(function () {
                dispatchStore.loadRoutineDispatch()
                dispatchStore.loadInspect(userDetails.divisionCode)
                dispatchStore.loalCurrentDayData(userDetails.divisionCode, factorCode)
                dispatchStore.loadHourRankInfo(userDetails.divisionCode, factorCode)
                dispatchStore.loadDivisionGoalList(userDetails.divisionCode)
            }, 100)
            dispatchStore.loadLatestMonitorDatas(userDetails.divisionCode, true)
            dispatchStore.loadRecentGoalInfo(userDetails.divisionCode)
            this.getMsgUnReadCount();
            if (divisionCenterLocation) {
                this.setState({
                    centerLocaltion: divisionCenterLocation
                })
                getLocation().then(location => {
                    uploadPersionLocation(location.longitude, location.latitude);
                })
            } else {
                getLocation().then(location => {
                    this.setState({
                        centerLocaltion: location
                    })
                    uploadPersionLocation(location.longitude, location.latitude);
                })
            }
        }
        catch (error) {
            console.log(error);
            if (!isRelease) {
                Taro.showToast({
                    title: error,
                    mask: true,
                    icon: "none",
                    duration: 2000
                });
            }
        }
    }

    componentDidMount() {
        Taro.authorize({
            scope: 'scope.camera',
        })
    }

    componentWillUnmount() {
        clearTimeout(timeout);
    }

    onJumpMore = (tabIndex) => {
        let path = `analyst?tabIndex=${tabIndex}&title=${encodeURIComponent('统计分析')}`;
        Taro.navigateTo({
            url: '/pages/webview/index?url=' + encodeURIComponent(path)
        })
    }

    //跳转
    jumpToOther(res) {
        const { userStore: { userDetails } } = this.props
        let url = '/pages/default/index';
        let path = '';
        switch (res.code) {
            case "dataQuery":
                path = `dataQuery?title=${encodeURIComponent('数据查询')}`;
                url = '/pages/webview/index?url=' + encodeURIComponent(path)
                break;
            case "zhandiansuyuan":
                path = `single-site-tracing?divisionCode=${userDetails.divisionCode}&title=${encodeURIComponent('站点溯源')}`
                url = '/pages/webview/index?url=' + encodeURIComponent(path)
                break;
            case "analyse":
                url = '/pages/impact_analysis/index'
                break;
            case "rank":
                path = `rank?divisionCode=${userDetails.divisionCode}&title=${encodeURIComponent('排行榜')}`
                url = '/pages/webview/index?url=' + encodeURIComponent(path)
                break;
            case "site-comparison":
                path = `site-comparison?divisionCode=${userDetails.divisionCode}&title=${encodeURIComponent('对比分析')}`
                url = '/pages/webview/index?url=' + encodeURIComponent(path)
                break;
            case "alarm":
                url = '/pages/alarm/site_alarm'
                break;

            case "redBlackBillboard":
                url = `/pages/red_black_billboard/index`
                break;
            case "secure":
                url = `/pages/secure/index`
                break;
            case "inventory":
                url = `/pages/inventory/index`
                break;
            case "effectAnalysis":
                url = `/pages/discuss_analysis/index`
                break;
            case "more":
            default:
                url = `/pages/default/index`
                break;
        }
        Taro.navigateTo({
            url
        })
    }

    onEditGoal = (value) => {
        if (isNaN(value) || value == -1) {
            return;
        }
        const { userStore: { userDetails: { divisionCode } }, dispatchStore: { dayGoalValueInfo } } = this.props;
        const { factorCode } = this.state
        let path = `division_goal/current_goal_edit?title=${encodeURIComponent('目标达成分析研判')}&divisionCode=${divisionCode}&divisionGoalId=${dayGoalValueInfo.decomposedGoalId}&factor=${factorCode}&pm25Value=${dayGoalValueInfo.goalValue}`;
        Taro.navigateTo({
            url: '/pages/webview/index?url=' + encodeURIComponent(path)
        })
    }

    getMsgUnReadCount() {
        let _this = this;
        let unReadCount = getUnReadMessageCount()
        unReadCount.then((res) => {
            _this.setState({
                messageUnReadCount: res.data.unreadCount
            })
        })
    }

    //跳转到消息列表
    showMsssageList() {
        this.getMsgUnReadCount()
        Taro.navigateTo({
            url: `/pages/task_dispatch_message/index`
        })
    }

    // 获取(设置)初始化偏移量
    setInitStatusHeight = () => {
        const { systemInfoStore } = this.props;
        statusBarHeight = systemInfoStore.systemInfo.statusBarHeight;
        if (systemInfoStore.systemInfo.model === "iPhone 5") {
            statusBarHeight = 22;
        }
    }

    showDivisionGoalList = () => {
        const { userStore: { userDetails: { divisionCode, divisionFree } } } = this.props;
        let path = "";
        if (divisionFree) {
            path = `division_goal/analyse?title=${encodeURIComponent('目标达成分析研判')}&divisionCode=${divisionCode}&divisionFree=${divisionFree}`;
        } else {
            path = `division_goal/analyse?title=${encodeURIComponent('目标达成分析研判')}&divisionCode=${divisionCode}`;
        }
        Taro.navigateTo({
            url: '/pages/webview/goal_webview?url=' + encodeURIComponent(path)
        })
    }

    onFullMap = () => {
        Taro.navigateTo({
            url: '/pages/task_dispatch/index'
        })
    }

    handleFactorChange = (res) => {
        const index = res.detail.value;
        this.setState({
            factorCode: Factors[index].value
        }, () => {
            const { userStore: { userDetails }, dispatchStore } = this.props
            const { factorCode } = this.state
            dispatchStore.loalCurrentDayData(userDetails.divisionCode, factorCode)
            dispatchStore.loadHourRankInfo(userDetails.divisionCode, factorCode)
        })
    }

    onJumpGoalEdit = () => {
        const { userStore: { userDetails: { divisionCode, divisionFree } } } = this.props;
        let path = "";
        if (divisionFree) {
            path = `division_goal/edit?title=${encodeURIComponent('设置年目标')}&divisionCode=${divisionCode}&flag=applet&divisionFree=${divisionFree}`;
        } else {
            path = `division_goal/edit?title=${encodeURIComponent('设置年目标')}&divisionCode=${divisionCode}&flag=applet`;
        }
        Taro.navigateTo({
            url: '/pages/webview/index?url=' + encodeURIComponent(path)
        })
    }

    //发送管控建议
    sendMsg() {
        Taro.navigateTo({
            url: `/pages/send_notice/index`
        })
    }

    //点击查看更多
    async onShowDetail(remind: Remind) {
        if (remind) {
            const result = await reportDetail({ id: remind.id })
            const data = get(result, 'data', {})
            Taro.navigateTo({
                url: `/pages/report/index?reportId=${remind.id}&reportType=${data.reportType}&reportCategory=${data.reportCategory}&title=${encodeURIComponent(data.name)}`
            })
        }
    }

    render() {
        const { userStore: { userDetails },
            dispatchStore: { remind, factorRankInfo, dayGoalValueInfo, inspectStatistics, divisionGoalInfo, examSiteMarkers, controlAreas } } = this.props;
        const { messageUnReadCount, centerLocaltion, factorCode, isSendMsgBtnShow } = this.state
        const currentFactor = Factors.find(factor => factor.value === factorCode)
        const intervalSeconds = moment(moment().endOf('day')).diff(moment(), "second")
        const divisionFree = userDetails.divisionFree
        let dayGoalReach = !dayGoalValueInfo || dayGoalValueInfo.goalValue == -1 ? true : dayGoalValueInfo.actualValue < dayGoalValueInfo.goalValue
        let markerList: marker[] = [...examSiteMarkers]
        let routineDispatchContent = remind && `【管控建议】${remind.controlProposalSummary}` || "";
        return (
            <View className={`dispatch-page pd_${statusBarHeight}`}>
                {/* 状态栏 */}
                <View className="dispatch-page_message" style={{ paddingTop: `${statusBarHeight}px` }}>
                    <View className="message_container">
                        <Text className="title">{userDetails.divisionName}</Text>
                    </View>
                    <View className="message_view" onClick={this.showMsssageList}>
                        <AtBadge className="message_badge" value={messageUnReadCount ? messageUnReadCount : ''} maxValue={99}>
                            <Image className="message_icon" src={messageUrlPath}></Image>
                        </AtBadge>
                    </View>
                </View>

                {/* 地图 */}
                <View className='dispatch-page_map'>
                    <View className='today'>
                        <View className="today_clock"></View>
                        <View className="today_label">今日调度剩余</View>
                        <AtCountdown
                            className="today_count_down"
                            seconds={intervalSeconds}
                        />
                    </View>
                    <Map
                        id='map'
                        className='map'
                        longitude={centerLocaltion.longitude}
                        latitude={centerLocaltion.latitude}
                        markers={markerList}
                        polygons={controlAreas}
                        scale={11}
                        show-location={true}
                    >

                        <CoverImage className='map_full' src={map_full} onClick={this.onFullMap} />

                        <CoverView className="send_message" onClick={this.onMoveToCurentPosition}>
                            <CoverImage className="map_point" src={currentLocaltion}></CoverImage>
                        </CoverView>

                    </Map>
                </View>

                <ScrollView
                    scrollY
                    scrollWithAnimation
                    className='scroll-view'
                >
                    {/* 早晚间提醒 */}
                    {routineDispatchContent && (
                        <View className='dispatch-page_remind'>
                            <View className='img'></View>
                            <View className='txt' onClick={this.onShowDetail.bind(this, remind)}>
                                <Text className='txt_inner'>{routineDispatchContent}</Text>
                            </View>
                        </View>
                    )}
                    {/* 今日数据情况 */}
                    <View className='dispatch-page_today'>
                        {dayGoalValueInfo && <View className="pm25_goal">
                            <View className='today'>
                                <View className="totay_value">今日实时数据</View>
                                <Picker mode='selector' value={0} range={Factors} range-key='label' onChange={this.handleFactorChange.bind(this)}>
                                    <Text className='factorName'>{currentFactor.label}</Text>
                                </Picker>
                            </View>
                            <View className="detail_data">
                                <View className="goalValueInfo value_info_background">
                                    <View className="title">{currentFactor.label}累计值</View>
                                    <View className="value">
                                        {dayGoalReach && <Text className="actual_value_reach">{dayGoalValueInfo.actualValue != -1 ? dayGoalValueInfo.actualValue : "--"}</Text>}
                                        {!dayGoalReach && <Text className="actual_value">{dayGoalValueInfo.actualValue != -1 ? dayGoalValueInfo.actualValue : "--"}</Text>}
                                        <Text className="simple_tip">({dayGoalValueInfo.unit})</Text>
                                    </View>
                                </View>
                                <View className="goalRankInfo value_info_background">
                                    <View className="title">本日实时排名</View>
                                    <View className="value">
                                        <Text className="current_rank">{factorRankInfo ? factorRankInfo.currentRank : '--'}</Text>
                                        <Text className="simple_tip">/{factorRankInfo ? factorRankInfo.totalRank : '--'}</Text>
                                    </View>
                                </View>
                            </View>
                            {dayGoalValueInfo && dayGoalValueInfo.goalValue != -1 && <View className="control_content">
                                <View className="goal_value">
                                    <Text>目标浓度 {dayGoalValueInfo.goalValue}</Text>
                                    <Image className="goal_edit_icon" src={goal_edit} onClick={this.onEditGoal.bind(this, dayGoalValueInfo.goalValue)}></Image>
                                </View>
                                <View className="control_value">
                                    达成概率  {dayGoalValueInfo.probability != -1 ? (dayGoalValueInfo.probability * 100).toFixed(2) : '--'}%<Text className='split_hr'>|</Text>
                                    {dayGoalValueInfo.surplusControlValue < 0 ? `无法达成` : '剩余控制 ' + (dayGoalValueInfo.surplusControlValue != -1 ? dayGoalValueInfo.surplusControlValue : "--")}
                                </View>
                            </View>}
                        </View>}
                        <View className="event" onClick={this.onJumpMore.bind(this, 0)}>
                            <View className="title">
                                <Image className="image" src={event}></Image>
                                <Text className="tip">事件数</Text>
                            </View>
                            <View className="value">
                                <Text className="tip">上报</Text>
                                <Text className="num">{inspectStatistics.totalEvents == 0 ? "--" : inspectStatistics.totalEvents}</Text>
                            </View>
                            <View className="value_right">
                                <View>
                                    <Text className="tip">处理</Text>
                                    <Text className="num">{inspectStatistics.disposedEvents == 0 ? "--" : inspectStatistics.disposedEvents}</Text>
                                </View>
                                <Image className="jump_more" src={turn_right}></Image>
                            </View>
                        </View>
                        <View className="event" onClick={this.onJumpMore.bind(this, 1)}>
                            <View className="title">
                                <Image className="image" src={xuncha}></Image>
                                <Text className="tip">巡查数</Text>
                            </View>
                            <View className="value">
                                <Text className="tip">累计</Text>
                                <Text className="num">{inspectStatistics.totalWorks == 0 ? "--" : inspectStatistics.totalWorks}</Text>
                            </View>
                            <View className="value_right">
                                <View>
                                    <Text className="tip">洒水</Text>
                                    <Text className="num">{inspectStatistics.watering == 0 ? "--" : inspectStatistics.watering}</Text>
                                </View>
                                <Image className="jump_more" src={turn_right}></Image>
                            </View>
                        </View>
                    </View>

                    {/* 目标达成分析 */}
                    <View className='dispatch-page_goal'>
                        <View className='header'>
                            <Text className='header_title'>目标达成分析</Text>
                            {!isEmpty(divisionGoalInfo) && (
                                <View className='header_detail' onClick={this.showDivisionGoalList}>
                                    <Text className='txt'>查看全部</Text>
                                    <View className='img'></View>
                                </View>
                            )}
                        </View>
                        <GoalItem data={divisionGoalInfo} onAdd={this.onJumpGoalEdit} />
                    </View>

                    <View className="gap"></View>

                    {/* 其他菜单 */}
                    <View className="dispatch-page_menu">
                        <View className="icon_group" style={{ display: `${divisionFree ? "none" : ""}` }}>
                            {
                                ANALYSIS_MENUS.map((menu, index) => (
                                    <View key={menu.code + index} className="item" onClick={() => { this.jumpToOther(menu) }}>
                                        <Image className="image" src={menu.image}></Image>
                                        <Text className="title">{menu.title}</Text>
                                    </View>
                                ))
                            }
                        </View>
                    </View>
                    {isSendMsgBtnShow && <View className="dispatch-page_bottom"></View>}
                </ScrollView>
                {isSendMsgBtnShow && <View className="dispatch-page_send_dispatch" onClick={this.sendMsg}>
                    <Image className="image" src={send_dispatch}></Image>
                    <View className="send_dispatch_msg">调度</View>
                </View>}
            </View>
        );
    }
}

export default TaskDispatchNew;