import Taro from '@tarojs/taro'

/**
 * 调度列表
 */
export async function DispatchManageList(params: any) {
    return Taro.request({
        url: `/meijing-control-server/api/v1/reactive-dispatches`,
        method: 'GET',
        data: params
    });
}