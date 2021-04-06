import Taro, { Config } from '@tarojs/taro'
import { ComponentType } from 'react'
import { SimpleRichCoverView } from '@common/components/rich-text'
import { AtBadge, AtAvatar, AtModal, AtModalContent, AtModalAction } from 'taro-ui'
import { View, Map, Text, Image, Button, CoverView, CoverImage, Camera } from '@tarojs/components'
import './index.scss'
import { DivisionMonitorData } from '../../model'
import moment from 'moment'
import { getAddressByLocationFromTencentMap } from '@common/utils/mapUtils'
import { getLocation } from '../../service/userDivision'
import { formatDateShort } from '@common/utils/common'
import { rootSourceBaseUrl, isRelease, getUserAvatarUrl } from '@common/utils/requests'
import { observer, inject } from '@tarojs/mobx';
import { getUnReadMessageCount } from '../../service/message'
import { UserStore } from '@common/store/user';
import { SystemInfoStore } from '@common/store/systeminfo'
import { list, getPollutionSourceTypeList } from '../../service/pollutionType';
import { Person, uploadPersionLocation, getUserInfo } from '@common/service/user'
import { getDivisionMonitorData, PollutantType, SiteType, getStationType } from '../../service/pollutant'
import StatisticsDetails from './StatisticsDetails'
import DispatchDrawer from './DispatchDrawer'
import { DispatchStore, RoutineDispatch, Remind } from '../../store/dispatch'
import { marker } from '@tarojs/components/types/Map'
import { FACTORS, formatValue, getValueColor } from '@common/utils/monitor'
import { Location, Inspect, Staff } from '../../model'
import { Region } from 'src/service/dispatch'
import { reportDetail } from '../../service/report'
import get from 'lodash/get'

interface TaskDispatchProps {
    userStore: UserStore;
    systemInfoStore: SystemInfoStore;
    dispatchStore: DispatchStore;
}

interface TaskDispatchState {
    isAtDrawerShow: boolean,
    timeout: any,
    pollutantTypes: PollutantType[],
    pollutantSourceTypes: PollutantType[],
    stationTypes: SiteType[],
    isShowAiMsg: boolean,
    isTurnDown: boolean,
    turnUpHeight: number,
    isRespondDispatchShow: boolean,
    messageUnReadCount: number,
    timer: any,
    isSendMsgBtnShow: boolean,
    dataUpdateTime: {
        lastupdateTime: number,
        monitorDataUpdateTime: number
    },
    selectedTypes: number[],
    selectedSourceTypes: number[],
    selectedSiteTypes: number[],
    hourMonitorData?: DivisionMonitorData,
    centerLocaltion: Location,
    mariginLeft: number,
    factorListHeight: number,
    isMapShadeShow: boolean,
    showCamera: boolean,
}

interface TaskDispatch {
    props: TaskDispatchProps,
    state: TaskDispatchState
}
const factorIcon = rootSourceBaseUrl + "/assets/task_dispatch/icon-switch.png";
const aiBackimage = rootSourceBaseUrl + "/assets/task_dispatch/ai_message.png";
const closed = rootSourceBaseUrl + "/assets/task_dispatch/closed.png";
const messageUrlPath = rootSourceBaseUrl + "/assets/task_dispatch/message.png";
const ai = rootSourceBaseUrl + "/assets/task_dispatch/ai.png";
const searchUrlPaht = rootSourceBaseUrl + "/assets/task_dispatch/search.png";
const layerUrlPath = rootSourceBaseUrl + "/assets/task_dispatch/layer.png";
const biaoJiUrlPath = rootSourceBaseUrl + "/assets/task_dispatch/biaoji.png";
const send_dispatch = rootSourceBaseUrl + "/assets/task_dispatch/send_dispatch.png";
const currentLocaltion = rootSourceBaseUrl + "/assets/task_dispatch/location_center.png";
const navigator = rootSourceBaseUrl + "/assets/task_dispatch/navigator.png";
const phone = rootSourceBaseUrl + "/assets/task_dispatch/phone.png";
const healthy = rootSourceBaseUrl + "/assets/task_dispatch/healthy.png";
const meijingCar = rootSourceBaseUrl + "/assets/task_dispatch/car-yuan.png";
//能够发送调度信息的角色
const canSendDispatchMsgRoles: string[] = ["leader", "dispatcher", "experter"];

//状态栏高度
let statusBarHeight = 20;
let navBarHeight = 2 * statusBarHeight + 88;

@inject('userStore', 'systemInfoStore', 'dispatchStore')
@observer
class TaskDispatch extends Taro.Component {

    initOffsetHeight: number
    mapCtx: any;

    constructor(props) {
        super(props)
        this.state = {
            isAtDrawerShow: false,
            pollutantTypes: [],
            timeout: null,
            pollutantSourceTypes: [],
            stationTypes: [],
            isShowAiMsg: false,
            isTurnDown: true,
            turnUpHeight: 0,
            isRespondDispatchShow: false,
            messageUnReadCount: 0,
            timer: null,
            isSendMsgBtnShow: false,
            dataUpdateTime: {
                lastupdateTime: 0,
                monitorDataUpdateTime: 0
            },
            selectedTypes: [],
            selectedSourceTypes: [],
            selectedSiteTypes: [],
            centerLocaltion: {
                longitude: 0,
                latitude: 0
            },
            mariginLeft: 0,
            factorListHeight: 0,
            isMapShadeShow: false,
            showCamera: !Taro.getStorageSync('grantCamera')
        }
    }

    config: Config = {
        navigationBarTitleText: '调度',
        navigationStyle: "custom"
    }

    //点击地图
    onBindtap() {
        const { dispatchStore } = this.props
        dispatchStore.selectMarker(undefined)
        this.setState({
            isShowAiMsg: false,
            factorListHeight: 0
        })
    }

    onBindMarker(res) {
        const { isTurnDown } = this.state
        if (!isTurnDown) { return }
        const { dispatchStore } = this.props
        dispatchStore.selectMarker(res.markerId)
        this.setState({
            isShowAiMsg: false,
            factorListHeight: 0
        })
    }

    onRegionchange() {
        try {
            const { dispatchStore, userStore: { userDetails } } = this.props;
            dispatchStore.drawerStatus.currentUserId = userDetails.id
            dispatchStore.updateDrawerStatus(dispatchStore.drawerStatus);

            if (this.mapCtx == null) {
                this.mapCtx = Taro.createMapContext('map')
            }
            this.mapCtx.getRegion({
                success: (res) => {
                    let region: Region = {
                        minLocation: {
                            latitude: res.southwest.latitude,
                            longitude: res.southwest.longitude
                        },
                        maxLocation: {
                            latitude: res.northeast.latitude,
                            longitude: res.northeast.longitude
                        }
                    }
                    dispatchStore.loadPollutionSources(region)
                }
            })
        } catch (error) {
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

    componentDidShow() {
        try {
            const { userStore: { userDetails }, dispatchStore } = this.props
            const { userStore: { userDetails: { divisionCenterLocation } } } = this.props;
            const monitorData = getDivisionMonitorData()
            this.state.timeout = setTimeout(function () {
                dispatchStore.loadRoutineDispatch()
                dispatchStore.loadInspect(userDetails.divisionCode)
                dispatchStore.loadStaffs()
                dispatchStore.loadCurrentPm25Value(userDetails.divisionCode)
                dispatchStore.loalPm25CurrentDayData(userDetails.divisionCode)
                dispatchStore.loadPm25HourRankInfo(userDetails.divisionCode)
            }, 4000)
            dispatchStore.loadRecentGoalInfo(userDetails.divisionCode)
            dispatchStore.loadLatestMonitorDatas(userDetails.divisionCode)
            dispatchStore.loadInspects()
            this.getMsgUnReadCount();
            if (divisionCenterLocation) {
                this.setState({
                    centerLocaltion: divisionCenterLocation,
                    hourMonitorData: monitorData
                })
                getLocation().then(location => {
                    uploadPersionLocation(location.longitude, location.latitude);
                })
            } else {
                getLocation().then(location => {
                    this.setState({
                        centerLocaltion: location,
                        hourMonitorData: monitorData
                    })
                    uploadPersionLocation(location.longitude, location.latitude);
                })
            }
        } catch (error) {
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

    loadData() {

    }

    componentWillMount() {
        try {
            const { userStore, dispatchStore } = this.props;
            let isShowSendMsg: boolean = false;
            dispatchStore.loadRecentGoalInfo(userStore.userDetails.divisionCode)
            this.setInitStatusHeight();
            let roles = userStore.userDetails.roles;
            if (roles != null) {
                roles.map((entry) => {
                    if (canSendDispatchMsgRoles.indexOf(entry.code) != -1) {
                        isShowSendMsg = true;
                    }
                })
            }
            //设置污染源类型
            let pollutants: PollutantType[] = [];
            let pollutantSourceTypes: PollutantType[] = [];
            let stationTypes: SiteType[] = [];
            getPollutionSourceTypeList().then((response) => {
                response.data.map((pollutantType: PollutantType) => {
                    pollutantSourceTypes.push(pollutantType)
                })
            })
            getStationType().then((response) => {
                response.data.entries.map((siteType: SiteType) => {
                    stationTypes.push(siteType)
                })
            })
            list().then((response) => {
                if (response.statusCode == 200) {
                    response.data.map((pollutantType: PollutantType) => {
                        pollutants.push(pollutantType)
                    })
                }
            })
            this.setState({
                pollutantTypes: pollutants,
                pollutantSourceTypes: pollutantSourceTypes,
                isSendMsgBtnShow: isShowSendMsg,
                stationTypes: stationTypes
            })

            //轮询请求未读消息数目
            this.state.timer = setInterval(() => {
                try {
                    getLocation().then((location: Location) => {
                        uploadPersionLocation(location.longitude, location.latitude);
                    });
                    this.getMsgUnReadCount();
                } catch (error) {
                }
            }, 1000 * 60 * 5)
        } catch (error) {
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

    getMsgUnReadCount() {
        let _this = this;
        let unReadCount = getUnReadMessageCount()
        unReadCount.then((res) => {
            _this.setState({
                messageUnReadCount: res.data.unreadCount
            })
        })
    }

    componentWillUnmount() {
        const { timer, timeout } = this.state;
        clearInterval(timer);
        clearInterval(timeout);
    }

    componentDidCatchError(error) {
        console.log("componentDidCatchError", error)
    }

    componentDidMount() {
        this.setState({ showCamera: false }, () => {
            Taro.setStorageSync('grantCamera', 1)
        })
    }

    //点击图层
    onClickLayer() {
        this.setState({
            isAtDrawerShow: true,
            mariginLeft: -600,
            factorListHeight: 0,
            isMapShadeShow: true
        })
    }

    //点击标签
    onClickTag() {
        Taro.navigateTo({
            url: `/pages/mark/index`
        })
    }

    //点击搜索
    onClickSearch() {
        Taro.navigateTo({
            url: `/pages/default/index`
        })
    }

    //显示管控建议
    showAiMsg() {
        const { isShowAiMsg } = this.state;
        this.setState({
            isShowAiMsg: !isShowAiMsg
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
    //发送管控建议
    sendMsg() {
        Taro.navigateTo({
            url: `/pages/send_notice/index`
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

    //状态栏上拉下滑操作
    translateUp = async (initOffsetHeight: number) => {
        const { isTurnDown } = this.state;
        const { userStore: { userDetails } } = this.props;
        let turnUpHeight = 0;
        if (isTurnDown) {
            if (userDetails.divisionFree) {
                turnUpHeight = 0;
            } else {
                turnUpHeight = 0;
            }
        } else {
            turnUpHeight = -initOffsetHeight;
        }
        this.setState({
            turnUpHeight: turnUpHeight
        }, () => {
            this.setState({
                isTurnDown: !isTurnDown,
                isShowAiMsg: false,
            })
        })
    }

    onShareAppMessage() {
        return {
            title: `调度`,
            path: `/pages/task_dispatch_new/index`
        }
    }

    //关闭侧边栏
    onClosedDrawer() {
        const { dispatchStore } = this.props
        dispatchStore.selectMarker(undefined)
        this.setState({
            mariginLeft: 0,
            isMapShadeShow: false,
        }, () => {
            this.setState({
                isAtDrawerShow: false,
                isShowAiMsg: false,
                isTurnDown: true,
                factorListHeight: 0
            })
        })
    }

    onClosedDetail() {
        this.props.dispatchStore.selectMarker(undefined)
    }

    //拨打电话
    async callPhone(userId: number) {
        const userInfo = await getUserInfo(userId);
        Taro.makePhoneCall({
            "phoneNumber": userInfo.data.phone
        })
    }

    onCloseRespondMsg() {
        const { isRespondDispatchShow } = this.state;
        this.setState({
            isRespondDispatchShow: !isRespondDispatchShow
        })
    }
    //跳转到消息列表
    showMsssageList() {
        this.getMsgUnReadCount()
        Taro.navigateTo({
            url: `/pages/task_dispatch_message/index`
        })
    }

    //跳转到管控建议详情
    showDispathcMsgDetail() {
        Taro.navigateTo({
            url: `/pages/dispatch_msg_detail/index`
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
                url = '/common/pages/webview/index?url=' + encodeURIComponent(path)
                break;
            case "zhandiansuyuan":
                path = `single-site-tracing?divisionCode=${userDetails.divisionCode}&title=${encodeURIComponent('站点溯源')}`
                url = '/common/pages/webview/index?url=' + encodeURIComponent(path)
                break;
            case "analyse":
                url = '/pages/impact_analysis/index'
                break;
            case "rank":
                path = `rank?divisionCode=${userDetails.divisionCode}&title=${encodeURIComponent('排行榜')}`
                url = '/common/pages/webview/index?url=' + encodeURIComponent(path)
                break;
            case "site-comparison":
                path = `site-comparison?divisionCode=${userDetails.divisionCode}&title=${encodeURIComponent('对比分析')}`
                url = '/common/pages/webview/index?url=' + encodeURIComponent(path)
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

    setHideAreaHeight = (height: number) => {
        this.initOffsetHeight = height
        this.setState({
            turnUpHeight: -height
        })
    }

    onStatusChange = (status) => {
        const { dispatchStore } = this.props
        dispatchStore.updateDrawerStatus(status)
    }

    parseDistance(distance: number) {
        return "(距离" + (distance / 1000) + "km" + ")";
    }

    //根据经纬度获取位置信息
    getAddressByLocation(person?: Person) {
        if (person == undefined) {
            return ""
        }

    }

    jumpToEventDetail(id: number) {
        Taro.navigateTo({
            url: `/pages/works/detail?inspectId=${id}`
        })
    }

    //导航
    go(longitude: number, latitude: number) {
        Taro.openLocation({
            longitude: longitude,
            latitude: latitude
        })
    }

    parseEventType(event?: Inspect) {
        if (event == undefined) {
            return ""
        }
        switch (event.type) {
            case "INCIDENT":
                return "[事件上报] "
            default:
                return "[例行巡查] "
        }
    }

    onPollutantTypeChange(types: number[]) {
        this.setState({
            selectedTypes: types
        })
    }

    onPollutantSourceTypeChange(types: number[]) {
        this.setState({
            selectedSourceTypes: types
        })
    }

    onSiteTypeChange(types: number[]) {
        this.setState({
            selectedSiteTypes: types
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

    getStaffAddress = (staff: Staff) => {
        getAddressByLocationFromTencentMap(staff.location.latitude, staff.location.longitude)
            .then((res) => {
                return res.data.result.address
            });
    }

    onShowFactorChange() {
        const { factorListHeight } = this.state;
        this.setState({
            factorListHeight: factorListHeight > 0 ? 0 : 480
        })
    }

    jumpToMeijingCar() {
        const { userStore: { userDetails, token } } = this.props
        let path = `/meijing-spcar-user-web/#/home?areacode=${userDetails.divisionCode}&phone=${userDetails.phone}`;
        Taro.navigateTo({
            url: "/pages/webview/index?url=" + encodeURIComponent(path)
        });
    }

    onChangeFactor(factorCode) {
        const { dispatchStore } = this.props;
        dispatchStore.drawerStatus.factorCode = factorCode;
        dispatchStore.updateDrawerStatus(dispatchStore.drawerStatus);
        this.setState({
            factorListHeight: 0
        })
    }

    onJumpToPollutionDetail = (item: any) => {
        Taro.navigateTo({
            url: `/pages/pollution-manage/detail?id=${item.id}`
        })
    }

    onHealthy = () => {
        let path = `healthy/edit?title=${encodeURIComponent('员工健康')}`;
        Taro.navigateTo({
            url: '/common/pages/webview/index?url=' + encodeURIComponent(path)
        })
    }

    render() {
        const {
            userStore: {
                userDetails: { divisionName, divisionFree, hasOpenCar, divisionCode }
            },
            dispatchStore: {
                remind, routineDispatch, controlAreas, inspectStatistics, drawerStatus,
                siteMarkers, inspectMarkers, pollutionSourceMarkers, staffMarkers,
                isMarkerSelected, isInspectSelected, isPollutionSourceSelected, isSiteSelected, isStaffSelected,
                selectedSite, selectedSiteMonitorData, selectedInspect, selectedPollutionSource, selectedStaff, currentStaffAddress,
                currentStaffDistance, targetWeekData, positionCurrentLocation, positionCurrentLocationMarker,
                rankGoalInfo, valueGoalInfo, factorRankInfo, dayGoalValueInfo, currentPm25Value, loadSuccess
            }
        } = this.props;
        let currentFactor = FACTORS.find(itemFactor => itemFactor.code == drawerStatus.factorCode);

        let routineDispatchContent = remind && remind.controlProposalSummary || "";

        if (routineDispatchContent.length > 40) {
            routineDispatchContent = routineDispatchContent.substring(0, 40);
            routineDispatchContent += "..."
        }
        let pollutantAddress = selectedPollutionSource && selectedPollutionSource.address || "";
        if (pollutantAddress.length > 19) {
            pollutantAddress = pollutantAddress.substring(0, 19);
            pollutantAddress += "..."
        }

        const { hourMonitorData, isSendMsgBtnShow, messageUnReadCount, isRespondDispatchShow, mariginLeft, isMapShadeShow, stationTypes,
            isAtDrawerShow, pollutantTypes, pollutantSourceTypes, isShowAiMsg, isTurnDown, turnUpHeight, centerLocaltion, factorListHeight, showCamera } = this.state;
        let markerList: marker[] = [...siteMarkers, ...inspectMarkers, ...pollutionSourceMarkers, ...staffMarkers, ...positionCurrentLocationMarker]
        return (
            <View className={`root_view  pd_${statusBarHeight}`}>
                <View className="top_message" style={{ paddingTop: `${statusBarHeight}px` }}>
                    <View className="message_container">
                        <Text className="title">
                            调度
                        </Text>
                    </View>
                    <View className="message_view" onClick={this.showMsssageList}>
                        <AtBadge className="message_badge" value={messageUnReadCount ? messageUnReadCount : ''} maxValue={99}>
                            <Image className="message_icon" src={messageUrlPath}></Image>
                        </AtBadge>
                    </View>
                </View>
                <View className="map_group" style={{ marginLeft: `${mariginLeft}rpx`, transition: `all 0.4s` }}>
                    <View className="map_content">
                        {isMapShadeShow && <CoverView className="map_shade" onClick={this.onClosedDrawer}></CoverView>}
                        <Map style={{ height: `calc(100% - ${navBarHeight}rpx)`, zIndex: 1, width: `100%` }}
                            id="map" onClick={this.onBindtap.bind(this)}
                            onCalloutTap={this.onBindMarker.bind(this)}
                            onMarkerTap={this.onBindMarker.bind(this)}
                            scale={13} enable-traffic={drawerStatus.roadCondition}
                            enable-3D={drawerStatus.mapType == "3D"}
                            enable-satellite={drawerStatus.mapType == "SATELLITE"}
                            markers={markerList}
                            show-location={true}
                            bindregionchange={this.onRegionchange.bind(this)}
                            polygons={controlAreas}
                            circles={positionCurrentLocation}
                            className="map" longitude={centerLocaltion.longitude}
                            latitude={centerLocaltion.latitude}
                        />
                        <View style={"display:none;"} onClick={this.onRegionchange.bind(this)}>
                            {showCamera && <Camera device-position="back" flash="auto" />}
                        </View>
                        {!isAtDrawerShow && isTurnDown && <CoverView className="division_name">{divisionName}</CoverView>}
                        {!isAtDrawerShow && isTurnDown &&
                            <CoverView className="switch_division">
                                <CoverView className='container' onClick={this.onShowFactorChange}>
                                    <CoverView className="factor_tag">
                                        <CoverView className="factor_tag__container">
                                            <CoverView className='text'>{currentFactor ? currentFactor.name : ''}</CoverView>
                                            <CoverImage className="icon" src={factorIcon}></CoverImage>
                                        </CoverView>
                                    </CoverView>
                                    <CoverView className="factor_list" style={{ height: `${factorListHeight}rpx` }}>
                                        {FACTORS.map((factor) => {
                                            return <CoverView key={factor.code} className="factor_item" onClick={this.onChangeFactor.bind(this, factor.code)}>{factor.name}</CoverView>
                                        })}
                                    </CoverView>
                                </CoverView>
                            </CoverView>}
                        {!isAtDrawerShow && isTurnDown &&
                            <CoverView className="dispatch_tool_group">
                                <CoverView className="dispatch_item" onClick={this.onClickLayer}>
                                    <CoverImage className="dispatch_icon" src={layerUrlPath}></CoverImage>
                                    <CoverView className="txt">图层</CoverView>
                                </CoverView>
                                <CoverView className="space_view"></CoverView>
                                <CoverView className="dispatch_item" onClick={this.onClickTag}>
                                    <CoverImage className="dispatch_icon" src={biaoJiUrlPath}></CoverImage>
                                    <CoverView className="txt">标记</CoverView>
                                </CoverView>
                                {/* <View className="space_view"></View>
                    <View className="dispatch_item">
                        <Image className="dispatch_icon" src={biaoJiUrlPath} onClick={this.onClickTag}></Image>
                        <Text className="txt">标记</Text>
                    </View>
                    <View className="space_view"></View>
                    <View className="dispatch_item">
                        <Image className="dispatch_icon" src={searchUrlPaht} onClick={this.onClickSearch}></Image>
                        <Text className="txt">搜索</Text>
                    </View> */}
                            </CoverView>}
                        {hasOpenCar && !isAtDrawerShow && isTurnDown &&
                            <CoverView className="car_group">
                                <CoverView className="dispatch_item" onClick={this.jumpToMeijingCar}>
                                    <CoverImage className="dispatch_icon" src={meijingCar}></CoverImage>
                                </CoverView>
                            </CoverView>}
                        {!isTurnDown && !isAtDrawerShow && <View className="shade" onTouchMove={(e) => e.stopPropagation()} onClick={() => this.translateUp(this.initOffsetHeight)}></View>}
                        {!isAtDrawerShow && !isMarkerSelected ?
                            <StatisticsDetails
                                dispatch={routineDispatch}
                                targetWeekData={targetWeekData}
                                factorRankInfo={factorRankInfo}
                                inspectStatistics={inspectStatistics}
                                divisionCode={divisionCode}
                                loadSuccess={loadSuccess}
                                currentPm25Value={currentPm25Value}
                                rankGoalInfo={rankGoalInfo}
                                dayGoalValueInfo={dayGoalValueInfo}
                                valueGoalInfo={valueGoalInfo}
                                divisionFree={divisionFree}
                                hourMonitorData={hourMonitorData}
                                onAnalysisMenuClick={this.jumpToOther.bind(this)}
                                onNeedHideBodyHeightChange={this.setHideAreaHeight}
                                isTurnDown={isTurnDown}
                                translateUp={this.translateUp}
                                style={{ bottom: turnUpHeight + 'px' }}
                            />
                            : ""
                        }
                        {!isAtDrawerShow && isTurnDown &&
                            <CoverView className="right_control_group">
                                <CoverView className="send_message" onClick={this.onMoveToCurentPosition}>
                                    <CoverImage className="image" src={currentLocaltion}></CoverImage>
                                </CoverView>
                                {(!isMarkerSelected && isSendMsgBtnShow) ?
                                    <CoverView className="send_dispatch" onClick={this.sendMsg}>
                                        <CoverImage className="image" src={send_dispatch}></CoverImage>
                                        <CoverView className="send_dispatch_msg">调度</CoverView>
                                    </CoverView> : ""}
                            </CoverView>}
                        {!isAtDrawerShow && isTurnDown && (!isMarkerSelected) ?
                            <CoverView className="ai" onClick={this.showAiMsg}>
                                <CoverImage className="image" src={ai}></CoverImage>
                            </CoverView> : ""}
                        {!isAtDrawerShow && isShowAiMsg && (!isMarkerSelected) ?
                            <CoverView className="ai_message">
                                <CoverImage src={aiBackimage} className="ai_backimage"></CoverImage>
                                <CoverView className="content">
                                    <CoverView className="tip_head">
                                        <CoverView className="message_title">管控建议</CoverView>
                                        <CoverImage className="message_icon" src={closed} onClick={this.showAiMsg}></CoverImage>
                                    </CoverView>
                                    <CoverView className="message_detail" onClick={this.onShowDetail.bind(this, remind)}>
                                        {routineDispatchContent}
                                    </CoverView>
                                </CoverView>
                            </CoverView> : ""}

                        {!isAtDrawerShow && isInspectSelected ? <CoverView className="event_group">
                            <CoverView className="event_head">
                                <CoverView className="title">{this.parseEventType(selectedInspect)}{selectedInspect!.pollutionTypeName || ""}</CoverView>
                                <CoverView className="navigation">
                                    <CoverView className="content" onClick={this.go.bind(this, selectedInspect!.longitude, selectedInspect!.latitude)}>
                                        <CoverImage className="image" src={navigator}></CoverImage>
                                        <CoverView className="tip">导航</CoverView>
                                    </CoverView>
                                </CoverView>
                            </CoverView>
                            <CoverView onClick={this.jumpToEventDetail.bind(this, selectedInspect!.id)}>
                                {selectedInspect!.content && <SimpleRichCoverView class-name='rich_view_content' content={selectedInspect!.content} />}
                                <CoverView className="image_list">
                                    {selectedInspect ? selectedInspect.pictureLinks.map((res, index) => {
                                        if (index <= 2) {
                                            return (
                                                <CoverImage key={res} className="image_item" src={res}></CoverImage>
                                            )
                                        }
                                    }) : null}
                                </CoverView>
                            </CoverView>
                            <CoverView className="foot">
                                <CoverView className="time">{formatDateShort(selectedInspect!.createTime)}</CoverView>
                                <CoverImage className="closed" src={closed} onClick={this.onClosedDetail.bind(this)}></CoverImage>
                            </CoverView>
                        </CoverView> : ""}
                        {!isAtDrawerShow && isSiteSelected ?
                            <CoverView className="common_group site_item">
                                <CoverView className="head">
                                    <CoverView className="title">{selectedSite!.name}</CoverView>
                                    <CoverView className="navigation">
                                        <CoverView className="content" onClick={this.go.bind(this, selectedSite!.location.longitude, selectedSite!.location.latitude)}>
                                            <CoverImage className="image" src={navigator}></CoverImage>
                                            <CoverView className="tip">导航</CoverView>
                                        </CoverView>
                                    </CoverView>
                                </CoverView>
                                <CoverView className="value_group">
                                    {
                                        FACTORS.map((factor) => {
                                            const value = selectedSiteMonitorData && selectedSiteMonitorData.datas && selectedSiteMonitorData.datas[factor.dataKey]
                                            const color = factor.code == 'aqi' ? getValueColor("aqi", value) : "#101F42";
                                            const titleColor = factor.code == 'aqi' ? getValueColor("aqi", value) : "#7A8499"
                                            return (
                                                <CoverView key={factor.code} className={`value_item ${factor.code}`}>
                                                    <CoverView className="value" style={`color: ${color}`}>
                                                        {formatValue(factor.code, value)}</CoverView>
                                                    <CoverView className="title" style={`color: ${titleColor}`}>{factor.name}</CoverView>
                                                </CoverView>
                                            )
                                        })
                                    }
                                </CoverView>
                                <CoverView className="foot">
                                    <CoverView className="time">{selectedSiteMonitorData == undefined ? "" : moment(selectedSiteMonitorData.dataTime).format("MM/DD HH:mm")}</CoverView>
                                    <CoverImage className="closed" src={closed} onClick={this.onClosedDetail.bind(this)}></CoverImage>
                                </CoverView>
                            </CoverView> : ""}
                        {!isAtDrawerShow && isPollutionSourceSelected ? <CoverView className="common_group">
                            <CoverView className="head">
                                <CoverView className="title" onClick={this.onJumpToPollutionDetail.bind(this, selectedPollutionSource)}>{selectedPollutionSource!.name}</CoverView>
                                <CoverView className="navigation">
                                    <CoverView className="content" onClick={this.go.bind(this, selectedPollutionSource!.longitude, selectedPollutionSource!.latitude)}>
                                        <CoverImage className="image" src={navigator}></CoverImage>
                                        <CoverView className="tip">导航</CoverView>
                                    </CoverView>
                                </CoverView>
                            </CoverView>
                            <CoverView className="localtion_detail">
                                {pollutantAddress}
                            </CoverView>
                            <CoverView className="foot">
                                <CoverView className="address">{this.parseDistance(selectedPollutionSource!.distance)}</CoverView>
                                <CoverImage className="closed" src={closed} onClick={this.onClosedDetail.bind(this)}></CoverImage>
                            </CoverView>
                        </CoverView> : ""}
                        {!isAtDrawerShow && isStaffSelected ?
                            <CoverView className="common_group">
                                <CoverView className="head_special">
                                    <CoverView className="left">
                                        <CoverImage className="avatar" src={`${getUserAvatarUrl(selectedStaff!.userId)}`}></CoverImage>
                                        <CoverView className="title_content">
                                            <CoverView className="name">{selectedStaff!.userName}</CoverView>
                                            {/* <CoverView className="phone">{selectedStaff!.phone}</CoverView> */}
                                        </CoverView>
                                    </CoverView>
                                    <CoverView className="navigation">
                                        <CoverView className="content" onClick={this.callPhone.bind(this, selectedStaff!.userId)}>
                                            <CoverImage className="phone" src={phone}></CoverImage>
                                            <CoverView className="tip">电话</CoverView>
                                        </CoverView>
                                        <CoverView className="content" onClick={this.go.bind(this, selectedStaff!.location.longitude, selectedStaff!.location.latitude)}>
                                            <CoverImage className="image" src={navigator}></CoverImage>
                                            <CoverView className="tip">导航</CoverView>
                                        </CoverView>
                                    </CoverView>
                                </CoverView>
                                <CoverView className="localtion_detail">
                                    {currentStaffAddress}
                                </CoverView>
                                <CoverView className="foot">
                                    <CoverView className="address">{currentStaffDistance}</CoverView>
                                    <CoverImage className="closed" src={closed} onClick={this.onClosedDetail.bind(this)}></CoverImage>
                                </CoverView>
                            </CoverView> : ""}
                        {!isAtDrawerShow && isTurnDown && isRespondDispatchShow ?
                            <View className="dispatch_group_head">
                                <View className="dispatch_message">
                                    <View className="dispatch_message_head">
                                        <View className="title">响应式调度</View>
                                        <Image className="closed" src={closed} onClick={this.onCloseRespondMsg.bind(this)}></Image>
                                    </View>
                                    <View className="dispatch_message_detail" onClick={this.showDispathcMsgDetail}>
                                        根据热区实时变化发现，今日郓城县西北方向出现污染概率较高，应重点巡查该方向有关区域
                                            </View>
                                </View>
                                <View className="dispatch_control_group"></View>
                            </View> : ""}
                    </View>
                    <View className="dispatch_content">
                        <DispatchDrawer
                            show={isAtDrawerShow}
                            onClose={this.onClosedDrawer.bind(this)}
                            stationTypes={stationTypes}
                            pollutionTypes={pollutantTypes}
                            pollutantSourceTypes={pollutantSourceTypes}
                            onPollutantTypeChange={this.onPollutantTypeChange.bind(this)}
                            onPollutantSourceTypeChange={this.onPollutantTypeChange.bind(this)}
                            onSiteTypeChange={this.onSiteTypeChange.bind(this)}
                            status={drawerStatus}
                            onStatusChange={this.onStatusChange}
                        />
                    </View>
                </View>
            </View>
        )
    }

} export default TaskDispatch as ComponentType