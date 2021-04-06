import Taro from '@tarojs/taro'


const AlarmTypes = [
    { code: "OTHER", name: '站点报警' },
    { code: "SOLITUDE_ALARM", name: '离群报警' },
    { code: "EXCEEDING_ALARM", name: '超标报警' },
    { code: "TREND_ALARM", name: '趋势报警' },
    { code: "SUDDEN_ALARM", name: '突高报警' },
];

const AlarmTypesId = [
    { id: 0, name: '站点报警' },
    { id: 1, name: '离群报警' },
    { id: 2, name: '超标报警' },
    { id: 3, name: '趋势报警' },
    { id: 4, name: '突高报警' },
];

export function getAlarmTypeCode(typeCode: string): string {
    const types: any[] = AlarmTypes.filter(type => type.code == typeCode);
    return types.length > 0 ? types[0].name : '';
}

export function getAlarmTypeName(typeCode: number): string {
    const types: any[] = AlarmTypesId.filter(type => type.id == typeCode);
    return types.length > 0 ? types[0].name : '';
}




/**
 * 查询报警列表
 * @param siteCode 站点编码
 * @param factorCode 因子编码
 * @param offset 
 * @param limit 
 */
export async function listAlarms(siteCode: string, factorCode: string,
    offset: number = 0, limit: number = 10) {
    return Taro.request({
        url: `/meijing-control-server/api/v1/alarms?siteCode=${siteCode}&factorCode=${factorCode}&offset=${offset}&limit=${limit}`,
    });
}

/**
 * 获取报警详情
 * @param id 报警id
 */
export async function getAlarmDetail(id: number) {
    return Taro.request({
        url: `/meijing-control-server/api/v1/alarms/${id}`,
    });
}

/**
 * 获取报警已读列表
 * @param id 报警id
 */
export async function getAlarmViewList(id: number, offset: number = 0, limit: number = 200) {
    return Taro.request({
        url: `/meijing-control-server/api/v1/alarms/${id}/views?offset=${offset}&limit=${limit}`,
    });
}

/**
 * 预警读取状态
 * @param id 报警id
 */
export async function alarmsView(id: number | string) {
    return Taro.request({
        url: `/meijing-control-server/api/v1/alarms/${id}/views`,
        method: 'POST'
    });
}

/**
 * 获取报警接收人列表
 * @param id 报警id
 * @param offset 
 * @param limit 
 */
export async function getAlarmRecipientList(id: number, offset: number = 0, limit: number = 200) {
    return Taro.request({
        url: `/meijing-message-server/api/v1/recipient-message/search-with-source?sourceType=alarm-analysis&sourceType=alarm-analysis-construction&sourceId=${id}&offset=${offset}&limit=${limit}`,
    });
}


/**
 * 获取热区内的污染源
 * @param params 热区多边形坐标列表
 */
export async function listPollutionSourcesInHotMap(params: any) {
    return Taro.request({
        url: `/meijing-pollution-source-server/api/v1/pollution-sources/in-hot-map`,
        data: params,
        method: 'POST',
    });
}

/**
 * 获取站点小时数据
 * @param params 
 */
export async function listHourDataByTime(params: any) {
    const { siteCode, ...otherParam } = params;
    return Taro.request({
        url: `/iot-data-server/api/v1/monitor-data/site/hour-by-time/${siteCode}`,
        data: otherParam
    });
}

/**
 * 获取站点小时数据-新
 * @param params 
 */
export async function listHourDataByTimeNew(params: any) {
    const { siteCode, ...otherParam } = params;
    return Taro.request({
        url: `/iot-manager-server/api/v2/site-datas/${siteCode}/hour-by-time`,
        data: otherParam
    });
}

/**
 * 获取站点分钟数据
 * @param params 
 */
export async function listMinuteDataByTime(params: any) {
    const { siteCode, ...otherParam } = params;
    return Taro.request({
        url: `/iot-data-server/api/v1/monitor-data/site/minute-by-time/${siteCode}`,
        data: otherParam
    });
}


/**
 * 获取站点分钟数据
 * @param params 
 */
export async function listMinuteDataByTimeNew(params: any) {
    const { siteCode, ...otherParam } = params;
    return Taro.request({
        url: `/iot-manager-server/api/v2/site-datas/${siteCode}/minute-by-time`,
        data: otherParam
    });
}

export type FactorCode = ('aqi' | 'a34004' | 'a34002' | 'a05024' | 'a21004' | 'a21026' | 'a21005')

export const factors: { label: string, value: FactorCode }[] = [{
    label: 'AQI',
    value: 'aqi',
}, {
    label: 'PM2.5',
    value: 'a34004',
}, {
    label: 'PM10',
    value: 'a34002',
}, {
    label: 'O₃',
    value: 'a05024',
}, {
    label: 'NO₂',
    value: 'a21004',
}, {
    label: 'SO₂',
    value: 'a21026',
}, {
    label: 'CO',
    value: 'a21005',
}]

export const FACTOR_CODE_NAME_MAP = new Map<string, string>()

factors.forEach(factor => FACTOR_CODE_NAME_MAP.set(factor.value, factor.label))

export const getFactorName = (factorCode: FactorCode): string | undefined => {
    return FACTOR_CODE_NAME_MAP.get(factorCode)
}

//  国控数据监测因子, key - value key
export const FACTOR_CODE_VALUE_FIELD_MAP: any = {
    a21026: 'V_a21026',
    a21005: 'V_a21005',
    a34002: 'V_a34002',
    a05024: 'V_a05024',
    a34004: 'V_a34004',
    a21004: 'V_a21004',
    aqi: 'aqi',
};

export function getFactorValueField(factorCode: FactorCode): string {
    return FACTOR_CODE_VALUE_FIELD_MAP[factorCode]
}


export async function getSites(divisionCode: string) {
    return Taro.request({
        url: `/iot-data-server/api/v1/sites/list-by-division.geojson?divisionCode=${divisionCode}`,
    });
}


export function getFillColor(index: number, size: number) {
    let levelValue = Math.ceil(16 + ((size - index) / size) * 64);
    return ("#E22424" + levelValue.toString(16));
}


export async function getAlarmTimeoutRulesConfig() {
    return Taro.request({
        url: `/meijing-control-server/api/v1/division-config/type-detail?type=TIMEOUT_RULES`,
    });
}


/**
 * 根据站点查询报警信息列表
 */
export async function alarmsList(params: any) {
    console.log(params, 1)
    return Taro.request({
        url: `/aurora-alarm-server/api/v1/alarms/list`,
        method: 'GET',
        data: params
    });
}


/**
 * 根据站点查询报警信息列表
 */
export async function alarmsListByPage(params: any) {
    console.log(params, 1)
    return Taro.request({
        url: `/aurora-alarm-server/api/v1/alarms`,
        method: 'GET',
        data: params
    });
}

/**
 * 分类统计工地报警信息
 */
export async function sortAlarms(params: any) {
    return Taro.request({
        url: `/meijing-pollution-source-server/api/v1/pollution-sources/sort-alarms`,
        method: 'GET',
        data: params
    });
}


/**
 * 查询工地报警信息列表
 */
export async function pollutionSourcesListAlarms(params: any) {
    return Taro.request({
        url: `/meijing-pollution-source-server/api/v1/pollution-sources/list-alarms`,
        method: 'GET',
        data: params
    });
}


/**
 * 获取站点小时数据-新
 * @param params 
 */
export async function listDataByTimeNew(params: any) {
    const { siteCode, dataType = "hour", ...otherParam } = params;
    return Taro.request({
        url: `/iot-manager-server/api/v2/site-datas/${siteCode}/${dataType === "hour" ? "hour-by-time" : "minute-by-time"}`,
        data: otherParam
    });
}

/**
 * 根据站点类型获取因子配置
 * @param {string} siteTypeCode 站点类型
 */
export async function getSiteFactorConfigBySiteType(siteTypeCode) {
    // return request(`/iot-manager-server/api/v2/air-sites/factors/${siteTypeCode}`);
    return Taro.request({
        url: `/iot-manager-server/api/v1/sites/factors/${siteTypeCode}`,
        method: 'GET'
    });
}

/**
 * 修改报警处置状态
 */
export async function sitesFactors(monitorType: string) {
    return Taro.request({
        url: `/iot-manager-server/api/v1/sites/factors/${monitorType}`,
        method: 'GET'
    });
}


/**
 * 获取报警处置状态
 */
export async function alarmsStatus(alarmId: number | string) {
    return Taro.request({
        url: `/aurora-alarm-server/api/v1/alarms/${alarmId}/status`,
        method: 'GET'
    });
}


/**
 * 根据报警Id查看详情
 */
export async function getAlarmsDetail(alarmId: number | string) {
    return Taro.request({
        url: `/aurora-alarm-server/api/v1/alarms/detail/${alarmId}`,
        method: 'GET'
    });
}


/**
 * 喷淋历史记录
 */
export function sprayHistories(params) {
    const { constructionCode, ...otherParams } = params
    return Taro.request({
        url: `/meijing-construction-server/api/v1/spray/${constructionCode}/histories`,
        method: 'GET',
        data: otherParams
    });
}