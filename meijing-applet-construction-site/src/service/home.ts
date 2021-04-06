import Taro from '@tarojs/taro'

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
        url: `/meijing-inspect-server/api/v1/construction-site-manager/inspects-by-pollution-source-id`,
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
        url: `/meijing-inspect-server/api/v1/construction-site-manager/history-list`,
        method: 'GET',
        data: params
    });
}

/**
 * 异常问题记录查询
 */
export async function anomalyList(params: any) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-site-manager/anomaly-warning-list`,
        method: 'GET',
        data: {
            ...params,
            endTime: params.endTime + 1
        }
    });
}

/**
 * 异常预警中未完成的事件数
 */
export async function notDisposedCount(source: string="") {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-site-manager/not-disposed-count`,
        method: 'GET',
        data: {
            source
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
 * 工地管家首页任务列表
 */
export async function constructionToDoTasksList(offset:number=0, limit:number=10) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-site-manager/to-do-tasks-list`,
        method: 'GET',
        data: {
            offset,
            limit
        }
    });
}

/**
 * 判断当日是否有未上报巡查记录
 */
export async function checkRecordToday(userId) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-site-manager/check-record-today`,
        method: 'GET',
        header: {
            "X-Authenticated-Userid": userId
        }
    });
}