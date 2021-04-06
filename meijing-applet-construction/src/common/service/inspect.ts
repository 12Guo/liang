import Taro from '@tarojs/taro'
import userStore from '../store/user'
import isEmpty from 'lodash/isEmpty';
import moment from 'moment'
import { DispatchType } from './dispatch'

export interface InspectUser {
    userId: number;
    name: string;
}

/**
 * 事件类型
 */
export enum InspectInfoType {
    /**
     * 事件
     */
    INCIDENT = 'INCIDENT',
    /**
     * 例行巡查
     */
    PATROL = 'PATROL',
}

/**
 * 事件搜索类型
 */
export const InspectInfoTypeInWorkSearchs = [
    { label: '巡查工作', value: 'PATROL' },
    { label: '巡查事件', value: 'INCIDENT' },
    { label: '督查事件', value: 'SUPERVISE' }
];

/**
 * 工作圈查询类型 全部、我的、部门
 */
export type InspectInWorkSearchType = 'ALL' | 'MY' | 'DEPARTMENT';

/**
 * 事件处置类型   REPLY:仅仅是回复;  DISPOSAL:将事件由【未处置】变成【处置完成】;  UNDISPOSAL:将事件由【处置完成】变成【未处置】;
 */
export type ReplyType = 'REPLY' | 'DISPOSAL' | 'UNDISPOSAL';

/**
 * 事件
 */
export interface InspectInfo {
    id?: number;
    pollutionSourceId?: number;
    pollutionSourceName?: string;
    pollutionSourceTypeId?: number;
    longitude: number;
    latitude: number;
    divisionCode: string;
    divisionName: string;
    address?: string;
    content?: string;
    /**
     * 是否行政执法
     */
    enforcementLaw: boolean;
    /**
     * 事件状态 false:未完成 true：完成
     */
    status: boolean;
    voiceOssKey?: string;
    voiceDuration?: number;
    videoOssKey?: string;
    pictureOssKeys?: string;
    attachmentOssKeys?: string;
    /**
     * 污染类型id
     */
    pollutionTypeId?: number;
    /**
     *  是否需要处置 false:不需要;true: 需要;
     */
    needDisposaled: boolean;

    /**
     * 处置人id
     */
    disposalUserId?: number;
    /**
     * 处置人姓名
     */
    disposalUserName?: string;
    /**
     * 处置部门id
     */
    disposalDepartmentId?: number;
    /**
     * 事件类型
     */
    type: InspectInfoType;
    /**
     * 同行人 json字符串
     */
    partner?: string;
    /**
     * 响应式调度id
     */
    reactiveDispatchId?: number;

    /**
     * 调度类型  DISPATCH:响应式调度  ALARM:报警调度
     */
    dispatchType?: DispatchType,

    /**
     * 匿名上报
     */
    anonymous: boolean;

    /**
     * 上报部门id
     */
    reportDepartmentId: number;
    /**
     * 上报部门名称
     */
    reportDepartmentName: string;
    /**
     * 督查事件
     */
    supervise: boolean;
    /**
     * 上报人所属行政区编码
     */
    reportDivisionCode: string;
    /**
     * 上报人所属行政区名称
     */
    reportDivisionName: string;

    /**
     * 影响分析数据
     */
    impactAnalysisData?: any;
}

export interface InspectInfoInList {
    id: number;
    content: string;
    /**
     * 污染类型id
     */
    pollutionTypeId: number;
    pollutionTypeName: string;
    address: string;
    pollutionSourceTypeId: number;
    pollutionSourceName: string;
    divisionCode: string;
    divisionName: string;
    status: boolean;
    enforcementLaw: boolean;
    needDisposaled: boolean;
    reportUserId: number;
    reportUserName: string;
    /**
     * 上报部门id
     */
    reportDepartmentId: number;
    /**
     * 上报部门名称
     */
    reportDepartmentName: string;
    createTime: Date;
    praiseNum: number;
    shareNum: number;
    replyNum: number;
    /**
     * 图片访问地址
     */
    pictureLinks?: string[];
    voiceLink?: string;
    voiceDuration?: number;
    attachmentLinks?: string[];
    videoLink?: string;
    /**
     * 本人是否已点赞
     */
    praised: boolean;
    longitude: number;
    latitude: number;
    disposalUserId?: number;
    disposalUserName?: string;
    /**
     * 事件类型
     */
    type: InspectInfoType;
    /**
     * 同行人 json字符串
     */
    partner?: string;
    /**
     * 响应式调度id
     */
    reactiveDispatchId?: number;
    /**
     * 匿名上报
     */
    anonymous: boolean;
    /**
     * 督查事件
     */
    supervise: boolean;
    distance?: string | undefined;
    /**
     * 上报人所属行政区编码
     */
    reportDivisionCode: string;
    /**
     * 上报人所属行政区名称
     */
    reportDivisionName: string;
}

export interface InspectDetail {
    id: number;
    content: string;
    /**
     * 污染类型id
     */
    pollutionTypeId: number;
    pollutionTypeName: string;
    address: string;
    status: boolean;
    reportUserId: number;
    reportUserName: string;
    createTime: Date;
    pollutionSourceId: number;
    pollutionSourceTypeId: number;
    pollutionSourceName: string;
    longitude: number;
    latitude: number;
    divisionCode: string;
    divisionName: string;
    enforcementLaw: boolean;
    needDisposaled: boolean;
    disposalUserId?: number;
    disposalUserName?: string;
    disposalDepartmentId?: number;
    praiseNum: number;
    shareNum: number;
    replyNum: number;
    /**
     * 图片访问地址
     */
    pictureLinks?: string[];
    voiceLink?: string;
    voiceDuration?: number;
    attachmentLinks?: string[];
    videoLink?: string;
    /**
     * 事件类型
     */
    type: InspectInfoType;
    /**
     * 同行人 json字符串
     */
    partner?: string;
    /**
     * 响应式调度id
     */
    reactiveDispatchId?: number;
    /**
     * 本人是否已点赞
     */
    praised: boolean;
    /**
     * 匿名上报
     */
    anonymous: boolean;
    /**
     * 督查事件
     */
    supervise: boolean;
    /**
     * 上报人所属行政区编码
     */
    reportDivisionCode: string;
    /**
     * 上报人所属行政区名称
     */
    reportDivisionName: string;
    /**
     * 影响分析数据
     */
    impactAnalysisData?: any;

    /**
     *  异常事件id(用于美境专车)
     */
    eventId?: any;
    /**
     *  事件来源
     */
    source: string;
}

/**
 * 事件回复在列表中展示的内容实体
 */
export interface InspectReplyInList {
    id: number;
    inspectId: number;
    userId: number;
    userName: string;
    createTime: Date;
    content: string;
    pictureLinks?: string[];
    voiceLink?: string;
    voiceDuration?: number;
    attachmentLinks?: string[];
    videoLink?: string;
    departmentId: number;
    departmentName: string;
    replyType: ReplyType;
}

/**
 * 事件回复
 */
export interface InspectComments {
    id: number;
    inspectId: number;
    content: string;
    voiceOssKey?: string;
    voiceDuration?: number;
    videoOssKey?: string;
    pictureOssKeys?: string;
    attachmentOssKeys?: string;
    userId: number;
    userName: string;
    createTime: Date;
}

/**
 * 事件指派对象
 */
export interface InspectAssign {
    inspectId: number;
    userId?: number;
    userName?: string;
    departmentId?: number;
    departmentCode?: string;
    departmentName?: number;
}

/**
 * 事件评论输入实体
 */
export interface InspectCommentsInput {
    inspectId: number;
    content: string;
    voiceOssKey?: string;
    voiceDuration?: number;
    videoOssKey?: string;
    pictureOssKeys?: string;
    attachmentOssKeys?: string;
    pollutionSourceId?: number;
    pollutionSourceTypeId?: number;
    pollutionSourceName?: string;
    pollutionTypeId?: number;
    enforcementLaw: boolean;
    status: boolean;
    disposalDepartmentName?: string;
    disposalDepartmentId?: number;
}

/**
 * 事件行为
 */
export interface InspectBehavior {
    id: number;
    inspectId: number;
    type: string;
    userId: number;
    userName: number;
    assignedTo?: string;
    description?: string;
    createTime: Date;
}

/**
 * 查询事件
 * @param offset 
 * @param limit 
 * @param keywords 关键字
 * @param isAll 是否查询所有 true: 全部  false: 我的
 * @returns PageResponse<InspectInfoInList>
 */
export async function getInspectList(offset: number = 0, limit: number = 10, isAll: boolean, keywords?: string) {
    let all = isAll ? 'all' : '';
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/inspects?offset=${offset}&limit=${limit}&all=${all}`,
    });
}


/**
 * 工作圈事件列表查询
 * @param type 查询类型
 * @param offset 始位置，偏移位置
 * @param limit 每页显示数量
 * @param departmentId 部门id
 */
export async function workGroupInspects(type: InspectInWorkSearchType = 'ALL', offset: number = 0, limit: number = 10, departmentId: number = 0, maxId: number = 0) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/inspects/inspects-in-work?offset=${offset}&limit=${limit}&type=${type}&departmentId=${departmentId}&maxId=${maxId}`,
    });
}

/**
 * 工作圈查询
 */
export async function unionWorkInspects(params: any) {
    let url = '/meijing-inspect-server/api/v1/inspects/inspects-work-advanced-search'
    let searchOption = {}
    if (params.tabType == 'ALL') {
        url = `/meijing-inspect-server/api/v1/inspects/inspects-work-advanced-search?limit=${params.limit}&offset=${params.offset}`
        const unionKey = ['order', 'status', 'type', 'pollutionTypeId', 'divisionCode', 'departmentId']
        const ortherKey = ['latitude', 'longitude']
        unionKey.forEach(keyword => {
            if (params[keyword]) {
                url += `&${keyword}=` + params[keyword].split(',').join(`&${keyword}=`)
            }
        })
        ortherKey.forEach(keyword => {
            if (params[keyword]) {
                url += `&${keyword}=` + params[keyword]
            }
        })
        searchOption = {}
    }
    else {
        url = '/meijing-inspect-server/api/v1/inspects/inspects-in-work'
        searchOption = {
            type: params.tabType,
            departmentId: params.departmentId,
            offset: params.offset,
            limit: params.limit
        }
    }
    return Taro.request({
        url,
        method: 'GET',
        data: searchOption
    });
}


/**
 * 获取事件详情
 * @param inspectId 事件id
 * @returns InspectDetail
 */
export async function getInspectDetail(inspectId: number) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-site-manager/inspects/${inspectId}`,
    });
}

/**
 * 事件指派列表
 * @param inspectId 事件id
 * @param offset 
 * @param limit 
 */
export async function getAssignList(inspectId: number, offset: number = 0, limit: number = 10) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-site-manager/inspects/assignList/${inspectId}?offset=${offset}&limit=${limit}`,
    });
}

/**
 * 事件点赞列表
 * @param inspectId 事件id
 * @param offset 
 * @param limit 
 */
export async function getPraiseList(inspectId: number, offset: number = 0, limit: number = 10) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-site-manager/inspects/praiseList/${inspectId}?offset=${offset}&limit=${limit}`,
    });
}

/**
 * 事件分享列表
 * @param inspectId 事件id
 * @param offset 
 * @param limit 
 */
export async function getShareList(inspectId: number, offset: number = 0, limit: number = 10) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-site-manager/inspects/shareList/${inspectId}?offset=${offset}&limit=${limit}`,
    });
}

/**
 * 事件查看列表
 * @param inspectId 事件id
 * @param offset 
 * @param limit 
 */
export async function getViewList(inspectId: number, offset: number = 0, limit: number = 10) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-site-manager/inspects/viewList/${inspectId}?offset=${offset}&limit=${limit}`,
    });
}

/**
 * 事件回复列表
 * @param inspectId 事件id
 * @param offset 
 * @param limit 
 */
export async function getReplyList(inspectId: number, offset: number = 0, limit: number = 10) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-site-manager/inspects/replyList/${inspectId}?offset=${offset}&limit=${limit}`,
    });
}


/**
 * 回复
 * @param input 
 */
export async function reply(input: InspectCommentsInput) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-site-manager/inspects/reply`,
        data: input,
        method: 'POST',
    });
}

/**
 * 事件上报
 * @param input 事件对象
 */
export async function add(input: InspectInfo) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-site-manager/inspects`,
        data: input,
        method: 'POST',
    });
}

/**
 * 点赞
 * @param id 事件id
 */
export async function praise(id: number) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-site-manager/inspects/praise/${id}`,
        method: 'POST',
    });
}

/**
 * 设置事件为督查事件
 * @param id 事件id
 */
export async function supervise(id: number) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/inspects/supervise/${id}`,
        method: 'GET',
    });
}

/**
 * 分享
 * @param id 事件id
 */
export async function share(id: number) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-site-manager/inspects/share/${id}`,
        method: 'POST',
    });
}

/**
 * 指派
 * @param inspectAssign 指派对象
 */
export async function assign(inspectAssign: InspectAssign) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-site-manager/inspects/assign`,
        data: inspectAssign,
        method: 'POST',
    });
}

/**
 * 事件查看
 * @param id 
 */
export async function view(id: number) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-site-manager/inspects/view/${id}`,
        method: 'POST',
    });
}

/**
 * 工作日志
 * @param params 
 */
export async function logs(params: any) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/inspects/logs`,
        method: 'GET',
        data: params
    });
}

/**
 * 工作日志下载
 * @param params 
 */
export async function logDownload(params: any, originFileName: string) {
    const { token } = userStore
    const fs = Taro.getFileSystemManager();
    Taro.downloadFile({
        header: {
            'Authorization': token
        },
        url: params,
        success: function (res) {
            Taro.hideLoading();
            let tempFilePath = res.tempFilePath;
            Taro.getSavedFileList({
                success(res) {
                    const fileList = res.fileList;
                    if (!isEmpty(fileList)) {
                        // 删除文件
                        fs.removeSavedFile({
                            filePath: fileList[0].filePath,
                            success: function (res) {
                                File_Save_Rname_Open(tempFilePath, originFileName);
                            },
                            fail: function (err) {
                                console.log(err, 'err', 'remove')
                            }
                        })
                    }
                    else {
                        File_Save_Rname_Open(tempFilePath, originFileName);
                    }
                }
            })
        },
        fail: function (err) {
            Taro.hideLoading();
            console.log(err, 'err')
        }
    })
}

/**
 * 
 * @param filePath 
 */
function File_Save_Rname_Open(filePath: string, newName: string) {
    newName = newName.replace(/-/g, '~').replace(/\//g, '-');
    const fs = Taro.getFileSystemManager();
    // 1. 保存文件名
    fs.saveFile({
        tempFilePath: filePath,
        success(res) {
            const savedFilePath = res.savedFilePath

            // 2. 修改文件名
            let newPath = `${wx.env.USER_DATA_PATH}/${newName}`;
            fs.rename({
                oldPath: savedFilePath,
                newPath,
                success: function (res) {
                    // 3. 打开
                    Taro.openDocument({
                        filePath: newPath
                    })
                },
                fail: function (err) {
                    console.log(err, 'err', 'rename')
                }
            })
        },
        fail: function (err) {
            console.log(err, 'err', 'save file')
        }
    })
}


export async function logDownloadAsync(params: any) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/inspects/log-download`,
        method: 'GET',
        data: params
    });
}


export async function logDownloadLink(params: any) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/inspects/log-download-link`,
        method: 'GET',
        data: params
    });
}

/**
 * 工作日志文件大小检测
 * @param params 
 */
export async function logFileInfo(params: string) {
    return Taro.getFileInfo({
        filePath: params
    })
}



/**
 * 获取事件详情
 * @param inspectId 事件id
 * @returns InspectDetail
 */
export async function getInspectDetailOpen(inspectId: number) {
    return Taro.request({
        url: `/meijing-inspect-server/open/api/v1/camera/inspects/${inspectId}`,
    });
}


/**
 * 我的事件查询类型
 */
export enum MyInspectSearchType {
    /**
     * 巡查事件
     */
    INCIDENT = 'INCIDENT',
    /**
     * 巡查工作
     */
    PATROL = 'PATROL',
    /**
     * 处置事件
     */
    INCIDENT_FINISHED = 'INCIDENT_FINISHED',
}

/**
 * 我的事件列表
 * @param type 
 * @param offset 
 * @param limit 
 */
export async function myInspects(type: MyInspectSearchType, offset: number = 0, limit: number = 10) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-site-manager/inspects/my`,
        method: 'GET',
        data: {
            type,
            offset,
            limit,
        },
    });
}


/**
 * 删除我上报的事件
 * @param inspectId 事件id
 */
export async function deleteMyInspect(inspectId: number) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-site-manager/delete-my-inspect/${inspectId}`,
        method: 'DELETE'
    });
}


export interface GenerateUrlInputData {
    ossKeys: string[];
    timeoutDays: number;
    styleRuleName: string;
}

/**
 * 回复
 * @param input 
 */
export async function generateUrl(input: GenerateUrlInputData) {
    return Taro.request({
        url: `/simple-oss-server/api/v1/oss/generate-urls`,
        data: input,
        method: 'POST',
    });
}

/**
 * 我的事件列表
 */
export async function myInspectList(params: any) {
    const { type, ...otherParams } = params
    if (type === 'PATROL' || type === 'INCIDENT' || type === 'INCIDENT_FINISHED') {
        return Taro.request({
            url: `/meijing-inspect-server/api/v1/construction-site-manager/inspects/my`,
            method: 'GET',
            data: params
        });
    }
    else {
        return Taro.request({
            url: `/meijing-inspect-server/api/v1/construction-site-manager/inspects/${type}`,
            method: 'GET',
            data: otherParams
        });
    }
}

export async function inspectReportType(params: any) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-site-manager/inspect-report-type`,
        method: 'GET',
        data: params
    });
}

export async function inspectReportTypeLink(params: any) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/construction-site-manager/inspect-report-type-link`,
        method: 'GET',
        data: params
    });
}

/**
 * 判断是否是今天时间
 * @param time 
 */
export function isToday(time: number) {
    const todayFormat = moment(time).format('yyyyMMdd')
    const currentFormat = moment().format('yyyyMMdd')
    return todayFormat === currentFormat
}