import Taro from '@tarojs/taro'

/**
 * 问题类型统计
 */
export async function labelIncident(params: any) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-site-stats/label-incident`,
        method: 'GET',
        data: {
            ...params,
            endTime: params.endTime + 1
        }
    });
}

/**
 * 治理措施统计
 */
export async function treatmentMeasure(params: any) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-site-stats/treatment-measure`,
        method: 'GET',
        data: {
            ...params,
            endTime: params.endTime + 1
        }
    });
}

// 问题工地
export async function siteProblem(params: any) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-site-stats/problem-construction-sites`,
        method: 'GET',
        data: {
            startTime: params.startTime,
            endTime: params.endTime + 1,
            order: params.order || 'PROBLEM_NUM_DESC',
            departmentIds: params.departmentIds || ''
        }
    });
}

// 部门管辖
export async function department(params: any) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-site-stats/department`,
        method: 'GET',
        data: {
            startTime: params.startTime,
            endTime: params.endTime + 1,
            departmentIds: params.departmentIds || ''
        }
    });
}

// 工地进度状态统计
export async function constructionSiteProgressStat() {
    return Taro.request({
        url: `/meijing-pollution-source-server/api/v1/pollution-sources/construction-site-progress-stat`,
        method: 'GET'
    });
}