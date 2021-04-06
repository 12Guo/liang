import Taro from '@tarojs/taro'

export async function inspectRankList(params: any) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/inspect-ranks`,
        method: 'GET',
        data: params
    });
}

