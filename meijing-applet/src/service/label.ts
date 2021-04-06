import Taro from '@tarojs/taro'


/**
 * 标签类型
 */
export enum LabelType{
    /**
     * 巡查类型
     */
    INSPECT_TYPE='inspect-type',
    /**
     * 专项行动
     */
    SPECIAL_ACTIVITY='special-activity',
    /**
     * 措施
     */
    MEASURES='measures',
}

export interface Label{
    id:number;
    name:string;
    type:string;
}

export interface LabelGroup{
    name:string;
    type:string;
    labels: Label[]
}

/**
 * 各类型标签汇总
 * @returns LabelGroup[]
 */
export async function labelGroupList() {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/labels`,
    });
}

/**
 * 用户历史标签
 * @param size 标签个数
 * @returns Label[]
 */
export async function historyLabelList(size:number=5) {
    return Taro.request({
        url: `/meijing-inspect-server/api/v1/labels/history?size=${size}`,
    });
}