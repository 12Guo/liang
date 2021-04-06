import Taro from '@tarojs/taro'

const SourceTypesId = [
    {id:1, name:'站点报警'},
    {id:2, name:'区域报警'}
];

export function getAlarmSourceName(sourceType:number):string{
    const types:any[] = SourceTypesId.filter(type=> type.id == sourceType);
    return types.length>0 ? types[0].name : '';
}

/**
 * 查询报警列表
 * @param factorCode 因子编码
 * @param status
 * @param offset 
 * @param limit 
 */
export async function listAlarms(params: { factorCode:string, alarmStatus:string, offset:number, limit:number}){
    const {alarmStatus, ...others  } = params;

    const finalParams:any = alarmStatus==='-1' ? others: params;

    const urlParams = Object.entries(finalParams).map(([key, value]) => `${key}=${value}`).join('&');

    return Taro.request({
        url: `/aurora-alarm-server/api/v1/alarms/search-list?${urlParams}`,
        method: 'POST',
        data: [],
    });
}

/**
 * 获取报警详情
 * @param id 报警id
 */
export async function getAlarmDetail(id:number){
    return Taro.request({
        url: `/aurora-alarm-server/api/v1/alarms/detail/${id}`,
    }); 
}

export async function getSiteDetail(code:string){
    return Taro.request({
        url: `/iot-manager-server/api/v1/sites/detail/${code}`,
    }); 
}

/**
 * 获取报警已读列表
 * @param id 报警id
 */
export async function getAlarmViewList(id:number,offset:number=0,limit:number=200){
    return Taro.request({
        url: `/meijing-control-server/api/v1/alarms/${id}/views?offset=${offset}&limit=${limit}`,
    }); 
}

/**
 * 获取报警接收人列表
 * @param id 报警id
 * @param offset 
 * @param limit 
 */
export async function getAlarmRecipientList(id:number,offset:number=0,limit:number=200){
    return Taro.request({
        url: `/meijing-message-server/api/v1/recipient-message/search-with-source?sourceType=alarm-analysis&sourceType=alarm-analysis-construction&sourceId=${id}&offset=${offset}&limit=${limit}`,
    }); 
}


/**
 * 获取热区内的污染源
 * @param params 热区多边形坐标列表
 */
export async function listPollutionSourcesInHotMap(params: any){
    return Taro.request({
        url: `/meijing-pollution-source-server/api/v1/pollution-sources/in-hot-map`,
        data: params,
        method: 'POST',
    });
}


/**
 * 获取行政区小时数据
 * @param params 
 */
export async function listDivisionHourDataByTime(params: any) {
    const { divisionCode, ...otherParam } = params;
    return Taro.request({
        url: `/iot-data-server/api/v1/monitor-data/division/hour-by-time/${divisionCode}`,
        data: otherParam
    });
}


/**
 * 获取站点小时数据
 * @param params 
 */
export async function listHourDataByTime(params: any) {
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


export function getFillColor(index: number, size: number){
    let levelValue = Math.ceil(16 + ((size - index) / size) * 64);
    return ("#E22424" + levelValue.toString(16));
}


export async function getAlarmTimeoutRulesConfig() {
    return Taro.request({
        url: `/meijing-control-server/api/v1/division-config/type-detail?type=TIMEOUT_RULES`,
    }); 
}

/**
 * 修改管控建议
 * @param alarmId 报警id
 * @param suggest 管控建议内容
 */
export async function editAlarmControlSuggest(alarmId: number, suggest:string) {
    return Taro.request({
        url: `/aurora-alarm-server/api/v1/alarms/${alarmId}/edit-control-suggest`,
        method: 'POST',
        data: suggest,
        header: {
            "content-type": "text/plain",
        },
    });
}



export function getAlarmFactors(alarm : any){
    let factorList:any[] = [];
    const factorItems:any[] = alarm.datas && alarm.datas.factorItems || [];
    if(factorItems.length >0){
        factorList = factorItems.map(item => item.alarmConfig.factor);
    }
    return factorList;
}

/**
 * 报警处置
 * @param alarmId 报警id
 * @param status 报警处置状态
 */
export async function disposed(alarmId:number,status: boolean){
    const alarmStatus:string = status ? 'ALREADY_DISPOSED' : 'NOT_DISPOSED';
    return Taro.request({
        url: `/aurora-alarm-server/api/v1/alarms/${alarmId}/disposed?status=${alarmStatus}`,
    }); 
}