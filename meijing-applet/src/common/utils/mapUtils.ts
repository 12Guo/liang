import md5 from "md5";
import Taro from '@tarojs/taro'

//腾讯地图根路径
const TENCENT_MAP_ROOT_URL = "https://apis.map.qq.com"
//腾讯地址逆解析地址
const TENCENT_MAP_LOCATION_TO_ADDRESS = "/ws/geocoder/v1/?";
//腾讯地图 key
const TENCENT_MAP_KEY = "VFRBZ-Q5PWX-H5I4N-ZRNTZ-6SJV6-DVBAE";
//腾讯地图签名秘钥
const TENCENT_MAP_SIGN_KEY = "Gn8R5azdyLQSiJokgiazRDnlUjSSA2TH";

/**
 * 根据经纬度从腾讯地图接口中获取地名信息
 * @param latitude 纬度
 * @param longitude 经度
 * @returns 地名信息
 */
export async function getAddressByLocationFromTencentMap(latitude: number, longitude: number) {

    let queryContent = TENCENT_MAP_LOCATION_TO_ADDRESS + "key=" + TENCENT_MAP_KEY
        + "&location=" + (latitude + "," + longitude);
    let signContent = queryContent + TENCENT_MAP_SIGN_KEY;

    let sign = md5(signContent);
    let queryUrl = TENCENT_MAP_ROOT_URL + queryContent + "&sig=" + sign;

    return await Taro.request({
        url: queryUrl,
    });
}


/**
 * 地址搜索 参考：https://lbs.qq.com/webservice_v1/guide-search.html
 * @param keyword 关键字
 * @param longitude 经度
 * @param latitude 纬度
 * @param pageIndex 页码
 */
export async function search(keyword: string, longitude: number,
    latitude: number, pageIndex: number = 1) {
    let boundary = `nearby(${latitude},${longitude},1000)`;

    let queryContent = `/ws/place/v1/search?boundary=${boundary}&key=${TENCENT_MAP_KEY}&keyword=${encodeURI(keyword)}
    &orderby=_distance&page_index=${pageIndex}&page_size=20`;

    let signContent = queryContent + TENCENT_MAP_SIGN_KEY;
    let sign = md5(signContent);
    let queryUrl = TENCENT_MAP_ROOT_URL + queryContent + "&sig=" + sign;

    return await Taro.request({
        url: queryUrl,
    });
}