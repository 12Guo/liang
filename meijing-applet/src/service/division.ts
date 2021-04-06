import Taro from '@tarojs/taro'
import { SUPER_DIVION_CODE } from '@common/utils/divisionUtils'

/**
 * 目标配置
 */
export interface GoalConfig {
    id: number,
    divisionCode: string,
    beginTime: number,
    endTime: number,
    type: string
}
/**
 * 排名目标信息
 */
export interface DivisionRankGoalInfo {
    name: string,
    goalValue: number,
    actualValue: number,
    unit: string,
    type: string,
    endTime: Date
}
/**
 * 浓度目标信息
 */
export interface ValueGoalInfo {
    name: string,
    goalValue: number,
    actualValue: number
    surplusControlValue: number,
    unit: string,
    probability: number,
    type: string,
    endTime: Date
}
/**
 * 因子排名
 */
export interface FactorRankInfo {
    currentRank: number,
    totalRank: number
}

export interface CalculateDayGoalValueInfo {
    actualValue: number,
    goalValue: number,
    probability: number,
    surplusControlValue: number,
    unit: string,
    decomposedGoalId: number
}

export interface CurrentPm25Value {
    V_34004: number
}

/**
 * 目标
 */
export interface DivisionGoal {
    beginTime: number,
    createTime: number,
    divisionCode: string,
    endTime: number,
    goals: {
        a34004: number
    },
    id: number,
    modifyTime: number,
    period: string
}

export interface DivisionDataAccess {
    id: number,
    divisionCode: string,
    applicantUserId: number,
    status: "CONFIRMING" | "PASS" | "REJECT"
}

/**
 * 获取所有的省级和市级行政区树
 * @returns 省市级行政区树
 */
export async function getProvincesAndCities() {
    return Taro.request({
        url: '/meijing-division-server/api/v1/divisions/provinces-and-cities-tree',
    });
}

/**
 * 获取下级行政区列表
 * @param divisionCode 行政区代码
 * @returns 下级行政区列表
 */
export async function getChildren(divisionCode: string) {
    divisionCode = divisionCode || SUPER_DIVION_CODE;
    return Taro.request({
        url: `/meijing-division-server/api/v1/divisions/${divisionCode}/children?opened=true`,
    });
}

/**
 * 获取省市县行政区划
 * @param divisionCode 行政区代码
 * @returns 下级行政区列表
 */
export async function getCityOrCountryChildren(divisionCode: string) {
    divisionCode = divisionCode || SUPER_DIVION_CODE;
    return Taro.request({
        url: `/meijing-division-server/api/v1/divisions/${divisionCode}/city-country-children`,
    });
}

/** 
 * 获取当前行政区
 * @param divisionCode 行政区代码
 */
export async function getDivision(divisionCode: string) {
    return Taro.request({
        url: `/meijing-division-server/api/v1/divisions/${divisionCode}`,
    });
}

/**
* 获取某个城市下面的区县和乡镇行政区
* @param cityCode 城市行政区代码
* @returns 区县乡镇行政区树
*/
export async function getCountiesAndTowns(cityCode: string) {
    return Taro.request({
        url: `/meijing-division-server/api/v1/divisions/cities/${cityCode}/counties-and-towns-tree`,
    });
}


/**
 * 所有父级行政区 从省开始
 * @param divisionCode 行政区编码
 */
export async function getParentDivisions(divisionCode: string) {
    return Taro.request({
        url: `/meijing-division-server/api/v1/divisions/${divisionCode}/parents`,
    });
}

/**
 * 激活指定的行政区编码
 * @param division 行政区编码
 */
export async function activeDivision(division: string) {
    return Taro.request({
        url: `/meijing-division-server/api/v1/divisions/${division}/active`,
        method: 'POST'
    });
}

/**
 * 取消激活申请
 * @param requestId 请求ID
 */
export async function cancelActiveDivision(requestId: number) {
    return Taro.request({
        url: `/meijing-division-server/api/v1/division-data-access-request/${requestId}/cancel`,
        method: 'DELETE'
    });
}

/**
 * 发送下级权限申请
 * @param dataAccess 请求信息
 */
export async function sendDataAccessToLower(dataAccess: DivisionDataAccess) {

    return Taro.request({
        url: `/meijing-division-server/api/v1/division-data-access-request`,
        data: {
            ...dataAccess
        },
        method: 'POST'
    });
}

/**
 * 获取行政区划数据访问请求
 * @param dataAccess 请求信息
 */
export async function selectDataAccessRequests(userId: number) {

    return Taro.request({
        url: `/meijing-division-server/api/v1/division-data-access-request?userId=${userId}&offset=0&limit=10`,
        method: 'GET'
    });
}

/**
 * 是否允许上级行政区访问
 * @param division 行政区编码
 */
export async function enableHigherAccess(active: boolean) {
    return Taro.request({
        url: `/meijing-division-server/api/v1/divisions/higher-access`,
        data: {
            active: active
        },
        method: 'POST'
    });
}

/**
 * 获取目标
 * WEEK: 周目标  
 * MONTH: 月目标
 * YEAR: 年目标
 * @param period 目标类型
 */
export async function getGoalsByPeriod(period: string) {
    let divisionGoal: DivisionGoal = {
        beginTime: 0,
        createTime: 0,
        divisionCode: "",
        endTime: 0,
        goals: {
            a34004: 0
        },
        id: 0,
        modifyTime: 0,
        period: ""
    }
    let response = await Taro.request({
        url: `/meijing-control-server/api/v1/division-goals/${period}/current`,
        method: 'GET'
    })
    if (response.statusCode == 200) {
        divisionGoal = response.data;
    }
    return divisionGoal;
}

/**
 * 获取有数据的事件来源列表
 */
export async function inspectSourceByDivision() {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/inspects/inspect-source-by-division`,
    });
}

export const EnumSourcList = {
    WEAPP: '巡查上报',
    MEIJING_CAMERA: '美境相机',
    MEIJING_CAR: '美境专车',
    MEIJING_SENTRY: '美境哨兵',
    MEIJING_CONSTRUCTION_SITE: '工地上报',
    SUPERIOR_MANAGE: '上级整改'
}