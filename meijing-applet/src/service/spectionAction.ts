import Taro from '@tarojs/taro'


// 专项行动类型
export interface ActionType {
    id: number,
    name: string
}


// 专项行动选择人员
export interface ParticipantUserType {
    participantUserId: number,	//非必须 参与人用户ID	
    participantUserName: string,// 非必须n参与人用户姓名
}

// 专项行动新增实体
export interface SpecialActionType {
    divisionCode: string,	//非必须 用户行政区代码	
    divisionName: string, //非必须 用户行政区名称	
    name: string, //非必须 行动名称	
    typeId?: number, // 非必须 行动类型ID	
    beginTime: number, // 非必须 开始时间	
    endTime: number, //非必须 结束时间	
    content: string	// 非必须 行动内容	
    participants: ParticipantUserType[] //参与人信息
}

// 专项行动列表item实体
export interface SpecialActionItemType {
    id: number,
    name: string,
    typeImageUrl: string,
    beginTime: number,
    endTime: number,
    patrol?: number
}

// 参与人实体
export interface ParticipantsType {
    createTime: number
    id: number
    modifyTime: number
    participantUserId: number
    participantUserName: string
    specialActivityId: number
}

/**
 * 专项行动实体
 */
export interface SpecialActivity{
    beginTime: number,
    content: string,
    createTime: number,
    createUserId?: number,
    createUserName?: string,
    divisionCode?: string,
    divisionName?: string,
    endTime?: number,
    id: number,
    isDeleted: boolean,
    modifyTime?: number,
    name: string,
    typeId?: number,
    typeImageUrl?: string,
    typeName: string 
}

// 专项行动详情实体
export interface SpecialActionDetailType extends SpecialActivity{
    participants: ParticipantsType[],
}

/**
 * 获取专项行动类型列表
 */
export async function getSpecialActivityTypes() {
    return Taro.request({
        url: `/meijing-control-server/api/v1/special-activity-types`,
        method: 'GET'
    });
}

/**
 * 创建专项行动
 */
export async function createApecialActivities(params: SpecialActionType) {
    return Taro.request({
        url: `/meijing-control-server/api/v1/special-activities`,
        method: 'POST',
        data: params
    });
}

/**
 * 获取专项行动列表
 */
export async function getApecialActivities(params: any) {
    return Taro.request({
        url: `/meijing-control-server/api/v1/special-activities`,
        data: params,
        method: 'GET'
    });
}

/**
 * 获取专项行动详情
 */
export async function getApecialActivityById(id:string) {
    return Taro.request({
        url: `/meijing-control-server/api/v1/special-activities/${id}`,
        method: 'GET'
    });
}

/**
 * 获取专项巡查记录
 * @param labelType 
 * @param id 专项行动id
 * @param offset 
 * @param limit 
 */
export async function listByLabel(labelType: string, id: string, offset:number=0, limit:number=10) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/inspects/list-by-label/${labelType}/${id}?limit=${limit}&offset=${offset}`,
        method: 'GET',
    });
}

/**
 * 获取专项巡查记录数量
 */
export async function countByLabel(labelIds: number[]) {
    let params = labelIds.map(item => `labelId=${item}`).join('&');
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/inspects/count-by-label/special-activity?${params}`,
        method: 'GET'
    });
}

/**
 * 获取登录用户参与的专项行动
 */
export async function current() {
    return Taro.request({
        url: `/meijing-control-server/api/v1/special-activities/current`,
        method: 'GET'
    });
}


export async function downloadSpecialActivityAsync(params: any) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/inspects/download-special-activity-async`,
        method: 'GET',
        data: params
    });
}

export async function downloadSpecialActivityLink(params: any) {
    console.log(params,123)
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/inspects/download-special-activity-link`,
        method: 'GET',
        data: params
    });
}