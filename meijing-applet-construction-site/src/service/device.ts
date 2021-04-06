import Taro from '@tarojs/taro'

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
export async function listConstructionVideos(tenantCode: string){
    return Taro.request({
        url: `/iot-manager-server/api/v1/video`,
        method: 'GET',
        data: {
            tenantCode,
            limit: 100,
            offset: 0
        }
    });
}

/**
 * 视频事件列表
 */
export async function listConstructionVideoInspects(params: any) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-site-manager/list-from-sentry`,
        method: 'GET',
        data: params
    });
}