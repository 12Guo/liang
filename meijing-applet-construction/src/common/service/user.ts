import Taro from '@tarojs/taro'
import { isOldVersion } from '../utils/common'

export interface SimpleUser {
    id: number;
    name: string;
    departmentId?: number;
    departmentCode?: string;
    departmentName?: number;
}

export interface DepartmentUser {
    departmentId: number;
    departmentName: string;
    users: SimpleUser[];
}

export interface DivisionUser {
    divisionCode: string;
    divisionName: string;
    users: SimpleUser[];
}

/**
 * 用于修改用户信息的实体对象
 */
export interface User {
    id: number;
    name: string;
    nickname: string;
    phone: string;
    avatar: string;
    divisionCode: string;
    departmentId?: number;
}

/**
 * 查看用户详情
 * @param userId 用户ID
 * UserDetails
 */
export async function viewUserDetails(userId: number) {
    return Taro.request({
        url: `/meijing-division-server/api/v1/users/${userId}`,
    });
}

/**
 * 查看用户详情
 * @param userId 用户ID
 * UserDetails
 */
export async function viewTenantUserDetails(userId: number) {
    return Taro.request({
        url: `/simple-user-server/api/v3/tenant-user/${userId}/user-detail`,
    });
}

/**
 * 获取用户详情
 * @param userId 用户ID
 * User
 */
export async function getUserInfo(userId: number) {
    return Taro.request({
        url: `/simple-user-server/api/v3/users/${userId}`,
    });
}

/**
 * 修改用户信息(需要行政区管理员权限)
 * @param user 用户信息
 */
export async function updateUser(user: User) {
    return Taro.request({
        url: `/meijing-division-server/api/v1/users/${user.id}`,
        data: user,
        method: 'POST'
    });
}

/**
 * 登录用户修改自己的用户信息
 * @param user 用户信息
 */
export async function updateCurrentUser(user: User) {
    return Taro.request({
        url: `/meijing-division-server/api/v1/users/current`,
        data: user,
        method: 'POST'
    });
}


/**
 * 传入行政区编码，获取部门分组用户
 * @param divisionCode 行政区编码
 * @returns DepartmentUser[]
 */
export async function departmentUsers(divisionCode: string) {
    let url = `/simple-user-server/api/v3/departments/${divisionCode}/department-users`
    if (isOldVersion()) {
        url = `/meijing-division-server/api/v1/users/${divisionCode}/department-users`
    }
    return Taro.request({ url });
}

/**
 * 传入租户编码，获取部门分组用户
 * @param tenantCode 租户编码
 * @returns DepartmentUser[]
 */
export async function departmentUsers_tenant(tenantCode: string) {
    return Taro.request({
        url: `/simple-user-server/api/v3/departments/${tenantCode}/department-users`,
    });
}


/**
 * 获取下级区域人员、按区域分组
 * @param divisionCode 行政区编码
 * @returns DivisionUser[]
 */
export async function childDivisionUsers(divisionCode: string) {
    return Taro.request({
        url: `/meijing-division-server/api/v1/users/${divisionCode}/child-division-users`,
    });
}

/**
 * 批量修改部门
 * @param userIds 用户id列表
 * @param departmentId 部门id
 */
export async function batchUpdateDepartment(userIds: number[], departmentId: number) {
    return Taro.request({
        url: `/meijing-division-server/api/v1/users/batch-update-department`,
        data: {
            userIds: userIds,
            departmentId: departmentId,
        },
        method: 'POST'
    });
}

/**
 * 批量修改区域
 * @param userIds 用户id列表
 * @param divisionCode 行政区编码
 */
export async function batchUpdateDivision(userIds: number[], divisionCode: string) {
    return Taro.request({
        url: `/meijing-division-server/api/v1/users/batch-update-division`,
        data: {
            userIds: userIds,
            divisionCode: divisionCode,
        },
        method: 'POST'
    });
}

/**
 * 删除行政区内用户,将这些用户的行政区编码置空
 * @param userIds 用户id
 */
export async function batchRemoveDivision(userIds: number[]) {
    return Taro.request({
        url: `/meijing-division-server/api/v1/users/batch-remove-division`,
        data: {
            userIds: userIds,
        },
        method: 'POST'
    });
}

export interface Person {
    id: number,
    location: {
        latitude: number,
        longitude: number
    },
    userAvatar: string,
    userName: string,
    userId: number,
    phone: string
}

/**
 * 上传用户经纬度
 */
export async function uploadPersionLocation(longitude: number, latitude: number) {
    return Taro.request({
        url: `/meijing-control-server/api/v1/user-locations`,
        method: 'POST',
        data: {
            longitude: longitude,
            latitude: latitude
        }
    });
}

/**
 * 获取所有用户坐标
 */
export async function getAllUserLocation() {
    let persons: Person[] = [];
    let personResponse = await Taro.request({
        url: `/meijing-control-server/api/v1/user-locations`,
        method: 'GET'
    });
    if (personResponse.statusCode == 200) {
        personResponse.data.map((person: Person) => {
            persons.push(person);
        })
    }
    return persons;
}
/**
 * 获取微信小程序二维码
 * @param fileName 二维码名称
 * @param scene 二维码参数
 * @param page 微信小程序登录路径
 */
export async function getQrCode(fileName: string, scene: string, page: string) {
    return await Taro.request({
        url: `/simple-user-server/api/v3/auth/qr-code`,
        method: 'POST',
        data: {
            fileName: fileName,
            scene: scene,
            page: page,
            width: 420
        }
    });
}

/**
 * 
 * @param params 加入团队申请的
 */
export async function passByAdministrator(params: any) {
    const { id, ...otherParams } = params
    return await Taro.request({
        // url: `/meijing-division-server/api/v1/user-join-requests/${id}/pass-by-administrator`,
        url: `/simple-user-server/api/v3/user-join-request/pass/${id}`,
        method: 'POST',
        data: otherParams
    });
}

/**
 * 
 * @param params 销售人员加入申请的
 */
export async function passBySalesperson(params: any) {
    const { id, ...otherParams } = params
    return await Taro.request({
        // url: `/meijing-division-server/api/v1/user-join-requests/${id}/pass-by-salesperson`,
        url: `/simple-user-server/api/v3/user-join-request/pass/${id}`,
        method: 'POST',
        data: otherParams
    });
}


/**
 * 
 * @param params 用户最近联系人接口
 */
export async function latestLinkman() {
    return Taro.request({
        url: `/simple-user-server/api/v3/link-men/latest`,
    });
}


/**
 * 
 * @param params 新增最近联系人接口
 */
export async function addLatest(ids) {
    return Taro.request({
        url: `/simple-user-server/api/v3/link-men/add-latest`,
        method: 'POST',
        data: ids
    });
}