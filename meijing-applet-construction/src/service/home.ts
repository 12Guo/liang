import Taro from '@tarojs/taro'
import get from 'lodash/get';

/**
 * 首页数据统计-人员统计、视频哨兵预警、我的今日工作
 */
export async function indexData(params: any) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-site-stats/index-data`,
        method: 'GET',
        data: {
            ...params,
            endTime: params.endTime + 1
        }
    });
}

/**
 * 首页数据统计-查询行政区下工地监测站点状态数量
 */
export async function monitorSiteStatus() {
    return Taro.request({
        url: `/meijing-pollution-source-server/api/v1/pollution-source-site/site-status`,
        method: 'GET'
    });
}

/**
 * 今日工地实况列表
 */
export async function listByTimeRange(params: any) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-sites/list-by-time-range`,
        method: 'GET',
        data: {
            ...params,
            endTime: params.endTime + 1
        }
    });
}

/**
 * 视频哨兵列表
 */
export async function listFromSentry(params: any) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-sites/list-from-sentry`,
        method: 'GET',
        data: {
            ...params,
            endTime: params.endTime + 1
        }
    });
}

/**
 * 获取视频哨兵数据(上报数,处置数)
 */
export async function sentryNumber(params: any) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-site-stats/sentry-number`,
        method: 'GET',
        data: {
            ...params,
            endTime: params.endTime + 1
        }
    });
}

/**
 * 今日工作详情
 */
export async function listAssignToMe(params: any) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-sites/list-assign-to-me`,
        method: 'GET',
        data: {
            ...params,
            endTime: params.endTime + 1
        }
    });
}

/**
 * 人员监管列表
 */
export async function constructionSites(params: any) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-sites`,
        method: 'GET',
        data: {
            ...params,
            endTime: params.endTime + 1
        }
    });
}


/**
 * 历史记录列表
 */
export async function historyPatrolList(params: any) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-sites/history-patrol-list`,
        method: 'GET',
        data: {
            ...params,
            endTime: params.endTime + 1
        }
    });
}

/**
 * 异常问题记录查询
 */
export async function anomalyList(params: any) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-sites/anomaly-list`,
        method: 'GET',
        data: {
            ...params,
            endTime: params.endTime + 1
        }
    });
}

/**
 * 敏感工地列表查询
 */
export async function sensitiveList(params: any) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-sites/sensitive-list`,
        method: 'GET',
        data: {
            ...params
        }
    });
}

/**
 * 视频状态列表查询
 */
export async function constructionSiteVideoStatusList() {
    return Taro.request({
        url: `/meijing-pollution-source-server/api/v1/pollution-source-videos/construction-site-video-status-list`,
        method: 'GET'
    });
}


/**
 * 视频接入统计数据
 */
export async function constructionSiteVideoReport() {
    return Taro.request({
        url: `/meijing-pollution-source-server/api/v1/pollution-source-videos/construction-site-video-report`,
        method: 'GET'
    });
}

/**
 * 视频接入设备数
 */
export async function constructionSiteSentryCount(divisionCode: string) {
    return Taro.request({
        url: `/meijing-pollution-source-server/api/v1/pollution-source-videos/${divisionCode}/construction-site-sentry-count`,
        method: 'GET'
    });
}

/**
 * 视频播放详情
 */
export async function videoPlayDetail(deviceCode: string) {
    return Taro.request({
        url: `/iot-manager-server/api/v1/video/detail?videoCode=${deviceCode}`,
        method: 'GET'
    });
}

/**
 * 获取污染源工地视频列表
 */
export async function listConstructionVideos(pollutantSourceId: string) {
    return Taro.request({
        url: `/meijing-pollution-source-server/api/v1/pollution-source-videos/${pollutantSourceId}`,
        method: 'GET'
    });
}

/**
 * 视频事件列表
 */
export async function listConstructionVideoInspects(params: any) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-sites/list-from-sentry/${params.pollutionSourceId}`,
        method: 'GET',
        data: {
            ...params
        }
    });
}


/**
 * 事件审核列表
 */
export async function sentryInspects(params: any) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/sentry-inspects`,
        method: 'GET',
        data: params
    });
}

/**
 * 事件审核列表
 */
export async function delSentryInspects(id: number) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/sentry-inspects/${id}`,
        method: 'DELETE'
    });
}

/**
 * 事件审核详情
 */
export async function sentryInspectsDetail(id: number) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/sentry-inspects/detail/${id}`,
        method: 'GET'
    });
}

/**
 * 事件审核编辑
 */
export async function updateSentryInspects(params: any, userDetails: any) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/sentry-inspects/${params.id}?userId=${userDetails.id}&userName=${userDetails.name}&departmentId=${get(userDetails, 'departmentInfo.id')}&departmentCode=${get(userDetails, 'departmentInfo.code')}&departmentName=${get(userDetails, 'departmentInfo.name')}`,
        method: 'POST',
        data: params
    });
}

/**
 * 根据租户编码统计工地污染源数量
 */
export async function constructionCount() {
    return Taro.request({
        url: `/meijing-pollution-source-server/api/v1/pollution-source-site/construction-count`,
        method: 'GET'
    });
}

/**
 * 根据工地名称查询监测站点在线状态列表
 */
export async function listSiteStatus() {
    return Taro.request({
        url: `/meijing-pollution-source-server/api/v1/pollution-source-site/list-site-status`,
        method: 'GET'
    });
}

/**
 * 统计工地设备预警数量
 */
export async function alarmsStatistics(params: any) {
    const { queryBeginTime, ...otherParams } = params
    return Taro.request({
        url: `/meijing-pollution-source-server/api/v1/pollution-sources/${queryBeginTime}/alarms-statistics`,
        method: 'GET',
        data: otherParams
    });
}