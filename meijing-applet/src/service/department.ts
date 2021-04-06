import Taro from '@tarojs/taro'

// 根区域Id：默认
export const rootDivisionCode: string = '000000000000000'


export interface Department {
    id?: number;
    code: string;
    name: string;
    divisionCode?: string;
    divisionName?: string;
    parentCode?: string;
}

/**
 * 获取行政区部门
 * @param divisionCode 行政区编码
 */
export async function listDepartmentByDivision(divisionCode: string) {
    return Taro.request({
        url: `/meijing-division-server/api/v1/divisions/open/departments/list-by-division/${divisionCode}`,
    });
}

/**
 * 获取行政区部门-多级
 * @param divisionCode 行政区编码
 */
export async function hierarchyList(divisionCode: string) {
    return Taro.request({
        url: `/meijing-division-server/api/v1/divisions/open/department/hierarchy-list/${divisionCode}`,
    });
}

/**
 * 获取专家行政区
 * @param divisionCode 行政区编码
 */
export async function listExpertDivisions() {
    return Taro.request({
        url: `/meijing-division-server/api/v1/experts/current/divisionList`,
    });
}

/**
 * 新增一个部门
 * @param department 部门详细信息
 */
export async function add(department: Department) {
    return Taro.request({
        url: `/meijing-division-server/api/v1/departments/add-by-division`,
        data: department,
        method: 'POST',
    });
}


/**
 * 删除一个部门
 * @param department 部门详细信息
 */
export async function deleteByDivision(id: string) {
    return Taro.request({
        url: `/meijing-division-server/api/v1/departments/delete-by-division/${id}`,
        method: 'DELETE',
    });
}

/**
 * 修改部门
 * @param id 部门id
 * @param name 部门名称
 */
export async function update(id: number | string, name: string) {
    return Taro.request({
        url: `/meijing-division-server/api/v1/departments/update-by-division/${id}`,
        data: { name: name },
        method: 'POST',
    });
}

/**
 * 切换行政区
 * @param id 部门id
 * @param name 部门名称
 */
export async function switchDivision(params: any) {
    return Taro.request({
        url: `/meijing-division-server/api/v1/users/switch-division`,
        data: params,
        method: 'POST'
    });
}

/**
 * 获取工地扬尘权限
 */
export async function getTypeDetail() {
    return Taro.request({
        url: `/meijing-control-server/api/v1/division-config/type-detail?type=CONSTRUCTION_SITE_SPECIAL_PATROL`,
        method: 'GET'
    });
}

/**
 * 
 * @param id 要查询的节点id
 * @param node 从该节点开始
 */
export function getNodeById(id, node) {
    let result = null;
    if (node.id === id || node.code === id) {
        result = node;
    }
    else {
        for (let child of node.children) {
            let newResult = getNodeById(id, child);
            if (newResult) {
                result = newResult;
                break;
            }
        }
    }
    return result;
}