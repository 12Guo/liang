import Taro from '@tarojs/taro'
import { Location, PollutionSource, Inspect, Site, SiteMonitorData, ReactiveDispatchRequest } from '../model'
import moment from 'moment'
export interface Region {
    minLocation: Location,
    maxLocation: Location
}

/**
 * 获取所有用户坐标
 */
export async function getStaffs() {
    const response = await Taro.request({
        url: `/meijing-control-server/api/v1/user-locations`,
        method: 'GET'
    });

    if (response && response.data) {
        return response.data.map((staff => ({
            ...staff,
            id: staff.userId
        })))
    }
}


/**
 * 获取污染源信息
 */
export async function getPollutionSources(currentLocation: Location, region: Region): Promise<PollutionSource[]> {
    const response = await Taro.request({
        url: `/meijing-pollution-source-server/api/v1/pollution-sources/searchWithRegion?currentLongitude=${currentLocation.longitude}&currentLatitude=${currentLocation.latitude}&minLatitude=${region.minLocation.latitude}&minLongitude=${region.minLocation.longitude}&maxLatitude=${region.maxLocation.latitude}&maxLongitude=${region.maxLocation.longitude}&limit=10000`,
    });
    return response && response.data && response.data.entries;
}


/**
 * 地图中查询事件  累计未完成+今日上报
 */
export async function getInspects(): Promise<Inspect[]> {
    const response = await Taro.request({
        url: `/meijing-inspect-server/api/v1/inspects/inspects-in-map`,
    })
    return response && response.data && response.data.entries;
}

/**
 * 获取周累计数据
 */
export async function getWeekData() {
    const response = await Taro.request({
        url: `/iot-data-server/api/v1/monitor-data/division/aggregate-value/week/current`,
    })
    return response && response.data;
}


/**
 * 获取监测点位信息
 */
export async function getSites(divisionCode: string): Promise<Site[]> {
    const respons = await Taro.request({
        url: `/iot-data-server/api/v1/sites?offset=0&limit=10000&divisionCode=${divisionCode}`,
    });
    return respons.data && respons.data.entries
}

/**
 * 获取监测点位信息
 */
export async function getSitesByCode(siteCode: string): Promise<Site[]> {
    const respons = await Taro.request({
        url: `/iot-data-server/api/v1/sites?siteCode=${siteCode}&offset=0&limit=1`,
    });
    return respons.data && respons.data.entries
}

export async function getSiteMonitorDatas(divisionCode: string, isExamineSite: boolean = false): Promise<SiteMonitorData[]> {
    const response = await Taro.request({
        url: `/iot-data-server/api/v1/monitor-data/site/minute/latest?divisionCode=${divisionCode}${isExamineSite ? `&examineSite=true` : ''}`,
    });
    return response.data
}

/**
 * 获取指定站点小时数据
 */
export async function getSiteMonitorDatasByTime(dataTime: number,siteCode: string): Promise<SiteMonitorData[]> {
    let endTime = moment(dataTime).add(1,"hour").valueOf();
    const response = await Taro.request({
        url: `/iot-data-server/api/v1/monitor-data/site/hour-by-time/${siteCode}?startTime=${dataTime}&endTime=${endTime}`,
    });
    return response.data
}

/**
 * 获取指定站点分钟数据
 */
export async function getSiteMonitorMinuteDatasByTime(dataTime: number,siteCode: string): Promise<SiteMonitorData[]> {
    let endTime = moment(dataTime).add(1,"minute").valueOf();
    const response = await Taro.request({
        url: `/iot-data-server/api/v1/monitor-data/site/minute-by-time/${siteCode}?startTime=${dataTime}&endTime=${endTime}`,
    });
    return response.data
}

/**
 * 发送调度信息
 * @param dispatchMsg 调度信息
 */
export async function sendDispatchMsg(dispatchMsg: ReactiveDispatchRequest) {
    return Taro.request({
        url: `/meijing-control-server/api/v1/reactive-dispatches`,
        data: {
            ...dispatchMsg
        },
        method: 'POST'
    });
}

/**
 * 获取当前例行调度
 */
export async function getCurrentRoutineDispatch() {
    const response = await Taro.request({
        url: `/meijing-control-server/api/v1/remind/current`,
        method: 'GET'
    });
    return response.data
}

/**
 * 获取最新的目标配置信息
 */
export async function loadRecentGoalInfo(divisionCode: string) {
    const response = await Taro.request({
        url: `/meijing-goal-server/api/v1/division-goal/recent?divisionCode=${divisionCode}`,
        method: 'GET'
    });
    return response.data
}

/**
 * 获取最新的目标配置信息
 */
export async function loadDivisionDayData(divisionCode: string, beginTime: number, endTime: number) {
    const response = await Taro.request({
        url: `/iot-data-server/api/v1/division/ranking/hour-data-accumulate?divisionCode=${divisionCode}&startTime=${beginTime}&endTime=${endTime}`,
        method: 'GET'
    });
    return response.data
}

/**
 * 按照因子进行小时数据累积排名
 */
export async function calculateFactorRank(divisionCode: string, factor: string) {
    const dataTime = Date.now();
    const response = await Taro.request({
        url: `/iot-data-server/api/v1/division/ranking/calculate-hour-rank-by-factor?divisionCode=${divisionCode}&dataTime=${dataTime}&divisionQueryRange=PROVINCE&factor=${factor}`,
        method: 'GET'
    });
    return response.data
}

/**
 * 计算指定配置当天目标数据
 */
export async function calculateDayDivisionGoalInfo(divisionGoal: any) {
    const dataTime = Date.now();
    const response = await Taro.request({
        url: `/meijing-goal-server/api/v1/division-goal/calculate-day-goal-value-info/${divisionGoal.id}?dataTime=${dataTime}`,
        method: 'GET'
    });
    return response.data
}

/**
 * 按照因子进行小时数据累积排名
 */
export async function loadPm25YearGoal(divisionCode: string) {
    const dataTime = moment()
        .startOf('year')
        .toDate()
        .getTime();
    const response = await Taro.request({
        url: `/meijing-goal-server/api/v1/division-goal/query-goal-by-time?divisionCode=${divisionCode}&factor=a34004&period=YEAR&dataTime=${dataTime}&type=VALUE_GOAL`,
        method: 'GET'
    });
    return response.data
}

/**
 * 按照因子进行小时数据累积排名
 */
export async function loadYearGoal(divisionCode: string, factorCode: string) {
    const dataTime = moment()
        .startOf('year')
        .toDate()
        .getTime();
    const response = await Taro.request({
        url: `/meijing-goal-server/api/v1/division-goal/query-goal-by-time?divisionCode=${divisionCode}&factor=${factorCode}&period=YEAR&dataTime=${dataTime}&type=VALUE_GOAL`,
        method: 'GET'
    });
    return response.data
}

/**
 * 计算浓度目标信息
 */
export async function calculateValueGoalInfo(id: number) {
    const response = await Taro.request({
        url: `/meijing-goal-server/api/v1/division-goal/calculate-goal-value-info/${id}`,
        method: 'GET'
    });
    return response.data
}

/**
 * 获取最新的目标配置信息
 */
export async function calculateRankGoalInfo(id: number) {
    const response = await Taro.request({
        url: `/meijing-goal-server/api/v1/division-goal/calculate-goal-rank-info/${id}`,
        method: 'GET'
    });
    return response.data
}

/**
 * 获取指定响应式调度详情
 */
export async function getDispatchDetailById(id: number) {
    return Taro.request({
        url: `/meijing-control-server/api/v1/reactive-dispatches/${id}`,
        method: 'GET'
    });
}

/**
 * 目标达成列表
 */
export async function getDivisionGoal(params: any) {
    const { divisionCode, offset = 0, limit = 1 } = params
    return Taro.request({
        url: `/meijing-goal-server/api/v1/division-goal?divisionCode=${divisionCode}&offset=${offset}&limit=${limit}`,
        method: 'GET'
    });
}

/**
 * 获取回复信息
 */
export async function getComments(targetType: string, targetId: string | number, queryParam: any) {
    return Taro.request({
        url: `/meijing-control-server/api/v1/${targetType}/${targetId}/comments`,
        method: 'GET',
        data: queryParam
    });
}

/**
 * 添加回复信息
 */
export async function addComments(targetType: string, targetId: string | number, param: any) {
    return Taro.request({
        url: `/meijing-control-server/api/v1/${targetType}/${targetId}/comments`,
        method: 'POST',
        data: param
    });
}

/**
 * 获取转发列表
 */
export async function getForwardings(targetType: string, targetId: string, queryParam: any) {
    return Taro.request({
        url: `/meijing-control-server/api/v1/${targetType}/${targetId}/forwardings`,
        method: 'GET',
        data: queryParam
    });
}

/**
 * 分享
 * @param id 事件id
 */
export async function addForwardings(targetType: string, targetId: string) {
    return Taro.request({
        url: `/meijing-control-server/api/v1/${targetType}/${targetId}/forwardings`,
        method: 'POST'
    });
}

export type DispatchType = 'REACTIVE_DISPATCH' | 'ALARM';

/**
 * 关联事件
 */
export async function getReactiveDispatchRelated(dispatchId: string | number, dispatchType: DispatchType = 'REACTIVE_DISPATCH') {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/inspects/reactive-dispatch-related/${dispatchId}?dispatchType=${dispatchType}`,
        method: 'GET'
    });
}