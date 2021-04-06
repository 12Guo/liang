import Taro from '@tarojs/taro'
import cloneDeep from 'lodash/cloneDeep'

export interface PollutionType {
    id: number;
    name: string;
    code?: string;
}

export interface PollutionSource {
    id: string,
    name: string,
    address: string,
    distance: string,
    pollutionSourceTypeId: string
}

/**
 * 污染类型列表
 */
export async function list() {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/pollution-types`,
    });
}

/**
 * 污染源类型列表
 */
export async function getPollutionSourceTypeList() {
    return Taro.request({
        url: `/meijing-pollution-source-server/api/v1/pollution-source-types`,
    });
}

/**
 * 污染源企业列表
 */
export async function getPollutionSourcesList(params: any) {
    return Taro.request({
        url: `/meijing-pollution-source-server/api/v1/pollution-sources`,
        method: 'GET',
        data: params
    });
}

/**
 * 污染源状态
 */
export async function pollutionSourceTypeStatus() {
    return Taro.request({
        url: `/meijing-pollution-source-server/api/v1/pollution-source-type-status`,
    });
}

/**
 * 污染源上报
 * @param input 事件对象
 */
export async function addReporting(input: any) {
    return Taro.request({
        url: `/meijing-pollution-source-server/api/v1/pollution-sources/reporting`,
        data: input,
        method: 'POST',
    });
}

/**
 * 污染源详情
 * @param id 污染源编号
 */
export async function getPollutionDetail(id: number | string) {
    return Taro.request({
        url: `/meijing-pollution-source-server/api/v1/pollution-sources/${id}/detail`
    });
}

/**
 * 删除污染源
 * @param id 污染源编号
 */
export async function delPollutionDetail(id: number | string) {
    return Taro.request({
        url: `/meijing-pollution-source-server/api/v1/pollution-sources/${id}`,
        method: 'DELETE'
    });
}

/**
 * 获取污染源巡查次数
 * @param id 污染源编号
 */
export async function inspectsByPollutantCount(id: number | string) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/inspects/inspects-by-pollutant-count?pollutionSourceId=${id}`
    });
}

/**
 * 污染源企业巡查记录
 */
export async function inspectsByPollutant(myParam: any) {
    const params = cloneDeep(myParam)
    if (!params.startTime || !params.endTime) {
        delete params.startTime;
        delete params.endTime;
    }
    if (params.inspectType == '0') {
        delete params.inspectType;
    }
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/inspects/inspects-by-pollutant`,
        method: 'GET',
        data: params
    });
}

/**
 * 污染源编辑
 * @param input 事件对象
 */
export async function editpollutionPources(params: any) {
    const { id } = params
    return Taro.request({
        url: `/meijing-pollution-source-server/api/v1/pollution-sources/${id}`,
        data: params,
        method: 'POST',
    });
}


/**
 * 污染源状态变更记录
 */
export async function statusChangeLogs(id:number) {
    return Taro.request({
        url: `/meijing-pollution-source-server/api/v1/pollution-sources/${id}/status-change-logs`,
    });
}

/**
 * 巡查人员变更记录
 */
export async function staffChangeLogs(id:number) {
    return Taro.request({
        url: `/meijing-pollution-source-server/api/v1/pollution-sources/${id}/staff-change-logs`,
    });
}

