import Taro from '@tarojs/taro'

export interface PollutantType {
    id: number,
    name: string
}
export interface SiteType {
    id: number,
    name: string
}

/**
 * 获取污染源标记
 */
export async function getPollutantTags() {
    return [
        { id: 1, name: "道路" },
        { id: 2, name: "工地" },
        { id: 3, name: "机动车" },
        { id: 4, name: "非道路移动" },
        { id: 5, name: "沥青道路铺装" },
        { id: 6, name: "餐饮油烟" },
        { id: 7, name: "禽类养殖" },
        { id: 8, name: "种植" },
        { id: 9, name: "其他" },
    ]
}

export async function getDivisionMonitorData(divisionCode: string) {
    const response = await Taro.request({
        url: `/iot-data-server/api/v1/monitor-data/division/${divisionCode}/hour/latest`,
    });
    return response.data
}

/**
 * 获取专项行动类型列表
 */
export async function getSpecialActivityTypes() {
    return Taro.request({
        url: `/meijing-control-server/api/v1/special-activity-types`,
        method: 'GET'
    });
}

/**
 * 创建专项行动
 */
export async function createApecialActivities(params: any) {
    return Taro.request({
        url: `/meijing-control-server/api/v1/special-activities`,
        method: 'POST',
        data: params
    });
}

/**
 * 获取专项行动列表
 */
export async function getApecialActivities(params: any) {
    return Taro.request({
        url: `/meijing-control-server/api/v1/special-activities`,
        data: params,
        method: 'GET'
    });
}

/**
 * 获取专项行动详情
 */
export async function getApecialActivityById(id: string) {
    return Taro.request({
        url: `/meijing-control-server/api/v1/special-activities/${id}`,
        method: 'GET'
    });
}

/**
 * 获取站点类型
 */
export async function getStationType() {
    return Taro.request({
        url: `/iot-data-server/api/v1/site-types?offset=0&limit=100`,
        method: 'GET'
    });
}