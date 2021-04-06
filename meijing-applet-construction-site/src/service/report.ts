import Taro from '@tarojs/taro'

/**
 * 报告详情
 */
export async function reportDetail(params: any) {
    return Taro.request({
        url: `/meijing-control-server/api/v1/reports/${params.id}/detail`,
        method: 'GET',
        data: params
    });
}