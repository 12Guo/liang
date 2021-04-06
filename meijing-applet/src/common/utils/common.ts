import Taro from '@tarojs/taro'
import { InspectInfoType } from '../service/inspect'
import { rootSourceBaseUrl } from './requests'
import moment from 'moment';
import get from "lodash/get";
import find from "lodash/find";

//图标引用
export const checkedImage = `${rootSourceBaseUrl}/assets/common/radio/checked.png`;
export const uncheckedImage = `${rootSourceBaseUrl}/assets/common/radio/unchecked.png`;

//小程序对照关系
export const system_map = [
    { appKey: 'yimeijing-applet', appName: '易美境' },
    { appKey: 'mj-construction', appName: '美境绿色工地' },
    { appKey: 'meijing-dlyc', appName: '渣土车小程序' },
    { appKey: 'green-construct', appName: '绿色工地管家' }
]

// 风向级别
export const wind_map = [
    {
        name: "0级",
        max: 0.2
    },
    {
        name: "1级",
        max: 1.5
    },
    {
        name: "2级",
        max: 3.3
    },
    {
        name: "3级",
        max: 5.4
    },
    {
        name: "4级",
        max: 7.9
    },
    {
        name: "5级",
        max: 10.7
    },
    {
        name: "6级",
        max: 13.8
    },

    {
        name: "7级",
        max: 17.1
    },
    {
        name: "8级",
        max: 20.7
    },
    {
        name: "9级",
        max: 24.4
    },
    {
        name: "10级",
        max: 28.4
    },
    {
        name: "11级",
        max: 32.6
    },
    {
        name: "12级",
        max: 36.9
    }
];

// 天气情况 -> 图标
export const weather_map = [
    {
        "code": 0,
        "url": "/assets/task_dispatch_detail/qing.png",
        "name": "晴"
    },
    {
        "code": 1,
        "url": "/assets/task_dispatch_detail/duoyun.png",
        "name": "多云"
    },
    {
        "code": 2,
        "url": "/assets/task_dispatch_detail/yin.png",
        "name": "阴"
    },
    {
        "code": 3,
        "url": "/assets/task_dispatch_detail/zhenyu.png",
        "name": "阵雨"
    },
    {
        "code": 4,
        "url": "/assets/task_dispatch_detail/leizhenyu.png",
        "name": "雷阵雨"
    },
    {
        "code": 6,
        "url": "/assets/task_dispatch_detail/yujiaxue.png",
        "name": "雨夹雪"
    },
    {
        "code": 7,
        "url": "/assets/task_dispatch_detail/xiaoyu.png",
        "name": "小雨"
    },
    {
        "code": 8,
        "url": "/assets/task_dispatch_detail/zhongyu.png",
        "name": "中雨"
    },
    {
        "code": 9,
        "url": "/assets/task_dispatch_detail/dayu.png",
        "name": "大雨"
    },
    {
        "code": 10,
        "url": "/assets/task_dispatch_detail/baoyu.png",
        "name": "暴雨"
    },
    {
        "code": 11,
        "url": "/assets/task_dispatch_detail/dabaoyu.png",
        "name": "大暴雨"
    },
    {
        "code": 12,
        "url": "/assets/task_dispatch_detail/tedabaoyu.png",
        "name": "特大暴雨"
    },
    {
        "code": 14,
        "url": "/assets/task_dispatch_detail/xiaoxue.png",
        "name": "小雪"
    },
    {
        "code": 15,
        "url": "/assets/task_dispatch_detail/zhongxue.png",
        "name": "中雪"
    },
    {
        "code": 16,
        "url": "/assets/task_dispatch_detail/daxue.png",
        "name": "大雪"
    },
    {
        "code": 18,
        "url": "/assets/task_dispatch_detail/wu.png",
        "name": "雾"
    },
    {
        "code": 20,
        "url": "/assets/task_dispatch_detail/qiangshachenbao.png",
        "name": "强沙尘暴"
    },
    {
        "code": 29,
        "url": "/assets/task_dispatch_detail/fuchen.png",
        "name": "浮尘"
    },
    {
        "code": 30,
        "url": "/assets/task_dispatch_detail/yaochen.png",
        "name": "药尘"
    },
    {
        "code": 53,
        "url": "/assets/task_dispatch_detail/mai.png",
        "name": "霾"
    },
]

// 风向转为角度
export const windy_map_angle = {
    '北风': 157.5,
    '东北风': 202.5,
    '东风': 247.5,
    '东南风': 292.5,
    '南风': -22.5,
    '西南风': 22.5,
    '西风': 67.5,
    '西北风': 112.5,
}

// 转换成导航仪坐标系
export function transformXY(data) {
    return data.map(site => {
        const y = Math.sin((90 - site.angle) * Math.PI / 180) * site.distance;
        const x = Math.cos((90 - site.angle) * Math.PI / 180) * site.distance;
        return { x, y }
    });
}

// 经纬度转换成三角函数中度分表形式
function rad(d) {
    return d * Math.PI / 180.0;
}

// 根据经纬度计算距离
function getDistance(postion1, postion2) {
    const { lat: lat1, lng: lng1 } = postion1
    const { lat: lat2, lng: lng2 } = postion2
    var radLat1 = rad(lat1);
    var radLat2 = rad(lat2);
    var a = radLat1 - radLat2;
    var b = rad(lng1) - rad(lng2);
    var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
        Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
    s = s * 6378.137;
    s = Math.round(s * 10000) / 10;
    return s;
}

// 根据经纬度计算角度
function getAngle(postion1, postion2) {
    const { lat: lat_a, lng: lng_a } = postion1
    const { lat: lat_b, lng: lng_b } = postion2
    var a = (90 - lat_b) * Math.PI / 180;
    var b = (90 - lat_a) * Math.PI / 180;
    var AOC_BOC = (lng_b - lng_a) * Math.PI / 180;
    var cosc = Math.cos(a) * Math.cos(b) + Math.sin(a) * Math.sin(b) * Math.cos(AOC_BOC);
    var sinc = Math.sqrt(1 - cosc * cosc);
    var sinA = Math.sin(a) * Math.sin(AOC_BOC) / sinc;
    var A = Math.asin(sinA) * 180 / Math.PI;
    var res = 0;
    if (lng_b > lng_a && lat_b > lat_a) res = A;
    else if (lng_b > lng_a && lat_b < lat_a) res = 180 - A;
    else if (lng_b < lng_a && lat_b < lat_a) res = 180 - A;
    else if (lng_b < lng_a && lat_b > lat_a) res = 360 + A;
    else if (lng_b > lng_a && lat_b == lat_a) res = 90;
    else if (lng_b < lng_a && lat_b == lat_a) res = 270;
    else if (lng_b == lng_a && lat_b > lat_a) res = 0;
    else if (lng_b == lng_a && lat_b < lat_a) res = 180;

    return {
        angle: res,
        distance: getDistance(postion1, postion2)
    }
}

// 计算角度和半径
export function calcDistance(center, examineSites) {
    const data = examineSites.map(site => {
        const position = {
            lat: get(site, "location.latitude", 0),
            lng: get(site, "location.longitude", 0)
        }
        return getAngle(center, position)
    })
    return data || []
}

/**
 * 回退到上一个页面，并传入参数
 * @param data 参数
 */
export function navBackWithData(data) {

    let pages = Taro.getCurrentPages();
    //上一页面
    let prevPage = pages[pages.length - 2];

    prevPage.setData(data);

    Taro.navigateBack();
}

/**
 * 获取当前page对象
 */
export function getCurrentPage() {
    let pages = Taro.getCurrentPages();
    return pages[pages.length - 1];
}
/**
 * 获取当前page中的data
 */
export function getPageData() {
    return getCurrentPage().data;
}

/**
 * 获取上一个页面page中的data
 */
export function getPrevPageData() {
    let pages = Taro.getCurrentPages();
    let prevPage = pages[pages.length - 2];
    return prevPage.data;
}

/**
 * 时间格式化
 */
export function formatDate(time: number) {
    //三目运算符
    const Dates = new Date(time);

    //年份
    const Year: number = Dates.getFullYear();

    //月份下标是0-11
    const Months: any = (Dates.getMonth() + 1) < 10 ? '0' + (Dates.getMonth() + 1) : (Dates.getMonth() + 1);

    //具体的天数
    const Day: any = Dates.getDate() < 10 ? '0' + Dates.getDate() : Dates.getDate();

    //小时
    const Hours = Dates.getHours() < 10 ? '0' + Dates.getHours() : Dates.getHours();

    //分钟
    const Minutes = Dates.getMinutes() < 10 ? '0' + Dates.getMinutes() : Dates.getMinutes();

    //秒
    const Seconds = Dates.getSeconds() < 10 ? '0' + Dates.getSeconds() : Dates.getSeconds();

    //返回数据格式
    return Year + '-' + Months + '-' + Day + ' ' + Hours + ':' + Minutes + ':' + Seconds;
}

/**
 * 时间格式化_
 */
export function formatDateShort(time: number) {
    //三目运算符
    const Dates = new Date(time);

    //年份
    const Year: number = Dates.getFullYear();

    //月份下标是0-11
    const Months: any = (Dates.getMonth() + 1) < 10 ? '0' + (Dates.getMonth() + 1) : (Dates.getMonth() + 1);

    //具体的天数
    const Day: any = Dates.getDate() < 10 ? '0' + Dates.getDate() : Dates.getDate();

    //小时
    const Hours = Dates.getHours() < 10 ? '0' + Dates.getHours() : Dates.getHours();

    //分钟
    const Minutes = Dates.getMinutes() < 10 ? '0' + Dates.getMinutes() : Dates.getMinutes();

    //秒
    const Seconds = Dates.getSeconds() < 10 ? '0' + Dates.getSeconds() : Dates.getSeconds();

    //返回数据格式
    return Months + '-' + Day + ' ' + Hours + ':' + Minutes;
}

/**
 * 清除page中的参数数据
 * @param paramNames 参数名
 */
export function clearValueInPageData(paramNames: string[]) {
    if (!paramNames || paramNames.length == 0) {
        return;
    }

    let page = getCurrentPage();
    let pageData = page.data;
    for (let i = 0; i < paramNames.length; i++) {
        if (paramNames[i] && pageData[paramNames[i]]) {
            pageData[paramNames[i]] = undefined;
        }
    }

    page.setData(pageData);
}

//督查员
export const SUPERVISOR = "supervisor";
// 管理员
export const ADMINISTRATOR = "administrator";
//系统运营人员
export const SYSTEM_OPERATOR = "system_operator";
export const LEADER = "leader";
//巡查员
export const INSPECTOR = "inspector";
//销售人员
export const SALESPERSON = "salesperson";
//专家
export const EXPERTER = "experter";



/**
 * 判断是否只是巡查员角色
 * @param roles 角色数组
 */
export function isOnlyInspector(
    roles: {
        code: string;
        name?: string;
    }[]): boolean {
    //首先判断是否只是巡查员角色,如果是才不允许指派他人
    if (roles.length > 1) {
        return false;
    }
    return isSomeRole(roles, INSPECTOR);
}

/**
 * 判断是否是管理员角色
 * @param roles 角色数组
 */
export function isAdministrator(
    roles: {
        code: string;
        name?: string;
    }[]): boolean {
    return isSomeRole(roles, ADMINISTRATOR);
}

/**
 * 判断是否是系统运营人员
 * @param roles 角色数组
 */
export function isSystemOperator(
    roles: {
        code: string;
        name?: string;
    }[]): boolean {
    return isSomeRole(roles, SYSTEM_OPERATOR);
}

/**
 * 判断是否是销售人员角色
 * @param roles 角色数组
 */
export function isSalesperson(
    roles: {
        code: string;
        name?: string;
    }[]): boolean {
    return isSomeRole(roles, SALESPERSON);
}

/**
 * 判断是否是专家角色
 * @param roles 角色数组
 */
export function isExperter(
    roles: {
        code: string;
        name?: string;
    }[]): boolean {
    return isSomeRole(roles, EXPERTER);
}

/**
 * 判断是否拥有某个角色
 * @param roles 角色数组
 */
export function isSomeRole(
    roles: {
        code: string;
        name?: string;
    }[], roleCode: string): boolean {
    let isRole: boolean = false;
    if (roles && roles.length > 0) {
        for (let i = 0; i < roles.length; i++) {
            if (roles[i].code == roleCode) {
                isRole = true;
                break;
            }
        }
    }
    return isRole;
}

/**
 * 判断用户是否是某些角色中的一个
 * @param roles 用户角色列表
 * @param roleCodes 角色编码列表
 */
export function isAnyRole(
    roles: {
        code: string;
        name?: string;
    }[], roleCodes: string[]): boolean {
    if (roles && roles.length > 0) {
        for (let i = 0; i < roles.length; i++) {
            for (let j = 0; j < roleCodes.length; j++) {
                if (roles[i].code == roleCodes[j]) {
                    return true;
                }
            }
        }
    }
    return false;
}


/**
 * 获取事件显示文字
 * @param type 事件类型
 * @param supervise 是否是督查事件
 */
export function inspectTypeText(type: InspectInfoType, supervise?: boolean): string {
    let inspectTypeStr = '';
    if (type == InspectInfoType.INCIDENT) {
        if (supervise) {
            inspectTypeStr = '督查事件';
        } else {
            inspectTypeStr = '巡查事件';
        }
    } else {
        inspectTypeStr = '巡查工作';
    }
    return inspectTypeStr;
}

/**
 * 序列化对象
 * @param param 
 */
export function serializeObject(param: object) {
    return Object.entries(param).map(item => {
        return `${item[0]}=${item[1]}`
    }).join('&')
}

/**
 * 过滤掉url中的token
 * @param url url地址
 */
export function filterToken(url: string) {
    return url.replace(/token=([0-9a-zA-Z._-]+)(&?)/, '')
}

/**
 * 过滤掉url中的时间戳
 * @param url url地址
 */
export function filterStamp(url: string) {
    return url.replace(/timeStamp=([\w]+)(&?)/, '')
}

/**
 * 获取uuid
 */
export function uuid() {
    var s: string[] = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
    s[8] = s[13] = s[18] = s[23] = "";

    return s.join("");
}

/**
 * 获取文件后缀
 * @param filePath 文件路径
 */
export function getFileNameExtension(filePath: string) {
    const dot: number = filePath.lastIndexOf('.');
    if (dot > -1 && dot < (filePath.length - 1)) {
        return filePath.substring(dot + 1);
    }
    return '';
}

/**
 * 重命名上传文件
 * @param filePath 文件路径
 */
export function getNewFileName(filePath: string) {
    const extension: string = getFileNameExtension(filePath);
    let newfileName: string = uuid();
    if (extension.length > 0) {
        newfileName = newfileName + '.' + extension;
    }
    return newfileName;
}

/**
 * 是否是天津版本
 * @param userDetails 用户信息
 */
export function isTJVersion(userDetails: any) {
    const isTianJin = userDetails.divisionCode === '120116000000'
    const isRole = get(userDetails, 'roles', []).every(role => ['inspector', 'disposer', 'administrator'].includes(role.code))
    return isTianJin && isRole
}

/**
 * 
 * @param string 原字符串
 * @param intercept 截取长度
 */
export function formatSplitString(originStr: string, intercept: number) {
    if (originStr.length <= intercept) {
        return originStr
    }
    return originStr.substr(0, intercept) + '...'
}

/**
 * 获取小程序名称
 * @param appKey 小程序编号
 */
export function getSystemName(appKey?: string) {
    return get(find(system_map, { appKey: appKey || Taro.getStorageSync('appKey') }), 'appName', '未命名小程序')
}

/**
 * 判断当前是否是老的版本
 */
export function isOldVersion() {
    return ['yimeijing-applet','mj-construction'].includes(Taro.getStorageSync('appKey'))
}