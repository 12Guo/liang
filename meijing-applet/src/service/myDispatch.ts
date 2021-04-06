import Taro from '@tarojs/taro'

// 指派页面acceptDispatch
// 指派给我的事件列表
export async function getEventList(offset: number = 0, limit: number = 20){
    return Taro.request({
        url:`/meijing-inspect-server/api/v1/inspects/assign-and-at-me`,
        data: {
            offset: offset,
            limit: limit,
        }
    })
}

// 指派给我的专项行动列表
export async function getActionList(offset: number = 0, limit: number = 20){
    return Taro.request({
        url:`/meijing-control-server/api/v1/special-activities/my-list`,
        data: {
            offset: offset,
            limit: limit,
        }
    })
}

// 点赞分享的(share)页面,我的分享列表
export async function getShareList(offset: number = 0, limit: number = 20){
    return Taro.request({
        url:`/meijing-inspect-server/api/v1/inspects/my-share`,
        data: {
            offset: offset,
            limit: limit,
        }
    })
} 

// 点赞分享的(share)页面,我的点赞
export async function getGoodList(offset: number = 0, limit: number = 20){
    return Taro.request({
        url:`/meijing-inspect-server/api/v1/inspects/my-praise`,
        data: {
            offset: offset,
            limit: limit,
        }
    })
} 

// 我指派的(launch)页面列表
export async function getLaunchList(offset: number = 0, limit: number = 20){
    return Taro.request({
        url:`/meijing-inspect-server/api/v1/inspects/my-assign`,
        data: {
            offset: offset,
            limit: limit,
        }
    })
} 

export async function countByLabel(labelIds: number[]) {
    let params = labelIds.map(item => `labelId=${item}`).join('&');
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/inspects/count-by-label/special-activity?${params}`,
        method: 'GET'
    });
}
