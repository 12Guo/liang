import Taro from '@tarojs/taro'


export async function inspectReport(pollutionSourceId: number) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-site-patrol/latest`,
        method: 'GET',
        data:{
            pollutionSourceId
        }
    });
}

export async function inspectDetails(Id: number) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-site-patrol/detail/${Id}`,
        method: 'GET'
    });
}

// 巡查内容提交
export async function inspectContentSumbit(param:any){
    return Taro.request({
        url: '/meijing-inspect-server/api/v1/construction-site-patrol/special-item-patrol',
        method: 'POST',
        data: {
            ...param
        }
    })
}
// 巡查上报提交
export async function inspectSumbit(param:any){
    return Taro.request({
        url: '/meijing-inspect-server/api/v1/construction-site-patrol/report',
        method: 'POST',
        data: {
            ...param
        }
    })
}

// 通过经纬度获取最近的工地
export async function getSiteId(param:any, keywords: string = ''){
    return Taro.request({
        url: `/meijing-pollution-source-server/api/v1/pollution-sources/near-construction-site-list`,
        method: 'GET',
        data: {
            offset: 0,
            limit: 20,
            keywords: keywords,
            ...param
        }
    })
}

// 当地方案
export async function getSiteRecords(param: any) {
    return Taro.request({
        url: `/meijing-pollution-source-server/api/v1/pollution-sources/construction-site-records`,
        method: 'GET',
        data: {
            ...param,
        }

    });
}

// 查询上传内容的详细
export async function getUpdatedItem(id: number) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-site-patrol/itemDetail/${id}`,
        method: 'GET'
    });
}

// 查询上传内容的详细
export async function getUpdate(params: any) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-site-patrol/updateSpecialPatrolItem/${params.id}`,
        method: 'POST',
        data: {
            ...params
        }
    });
}
