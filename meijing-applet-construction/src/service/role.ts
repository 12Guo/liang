import Taro from '@tarojs/taro'


/**
 * 角色实体
 */
export interface Role {
    id?: number;
    name: string;
    code: string;
}
  
  
/**
 * 行政区管理员获取所有角色
 */
export async function listAllRoles() {
    return Taro.request({
        url: '/meijing-division-server/api/v1/roles/list-by-administrator',
    });
}

/**
 * 行政区管理员添加用户角色
 * @param userIds 用户id列表
 * @param roleCodes 角色编码数组
 */
export async function addRolesByAdministrator(userIds:number[],roleCodes:string[]) {
    return Taro.request({
        url: '/meijing-division-server/api/v1/user-roles/add-roles-by-administrator',
        data: { userIds: userIds, roleCodes : roleCodes },
        method: 'POST',
    });
}



  