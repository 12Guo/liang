import Taro from '@tarojs/taro'


export enum UserJoinRequestStatus {
    /**
     * 确认中
     */
    CONFIRMING = 'CONFIRMING',

    /**
     * 通过
     */
    PASS = 'PASS',

    /**
     * 拒绝
     */
    REJECT = 'REJECT',
}


export interface UserJoinRequest {
    id: number;
    userId: number;
    userName: string;
    phone: string;
    divisionCode: string;
    divisionName: string;
    status: UserJoinRequestStatus;
    requestTime: Date;
    otherDepartment?: string;
    departmentId?: number;
    departmentName?: string;
}

/**
 * 提交加入行政区申请
 * @param userJoinRequest 
 */
export async function joinRequest(userJoinRequest: UserJoinRequest) {
    return Taro.request({
        // url: '/meijing-division-server/api/v1/user-join-requests',
        url: `/simple-user-server/api/v3/user-join-request`,
        data: userJoinRequest,
        method: 'POST'
    });
}

/**
 * 通过加入行政区申请
 * @param requestId 请求id
 * @param departmentId 申请人部门ID
 */
export async function pass(requestId: number) {
    return Taro.request({
        // url: `/meijing-division-server/api/v1/user-join-requests/${requestId}/pass`,
        url: `/simple-user-server/api/v3/user-join-request/pass/${requestId}`,
        // data: {departmentId: departmentId},
        method: 'POST'
    });
}

/**
 * 
 * 拒绝加入行政区申请
 * @param requestId reject
 */
export async function reject(requestId: number) {
    return Taro.request({
        // url: `/meijing-division-server/api/v1/user-join-requests/${requestId}/reject`,
        url: `/simple-user-server/api/v3/user-join-request/reject/${requestId}`,
        method: 'POST'
    });
}

/**
 * 销售人员通过加入行政区申请
 * @param requestId 请求id
 * @param departmentId 申请人部门ID
 */
export async function passBySalesperson(requestId: number) {
    return Taro.request({
        // url: `/meijing-division-server/api/v1/user-join-requests/${requestId}/pass-by-salesperson`,
        url: `/simple-user-server/api/v3/user-join-request/pass/${requestId}`,
        method: 'POST'
    });
}

/**
 * 
 * 拒绝加入行政区申请
 * @param requestId reject
 */
export async function rejectBySalesperson(requestId: number) {
    return Taro.request({
        // url: `/meijing-division-server/api/v1/user-join-requests/${requestId}/reject-by-salesperson`,
        url: `/simple-user-server/api/v3/user-join-request/reject/${requestId}`,
        method: 'POST'
    });
}

/**
 * 
 * @param offset 分页 offset
 * @param limit 分页大小
 * @param status 申请状态
 */
export async function getUserJoinRequests(offset: number = 0, limit: number = 20, status?: UserJoinRequestStatus) {
    return Taro.request({
        // url: `/meijing-division-server/api/v1/user-join-requests/list-by-admin`,
        url: `/simple-user-server/api/v3/user-join-request`,
        data: {
            status: status || '',
            offset: offset,
            limit: limit,
        }
    });
}

/**
 * 获取销售人员邀请列表
 * @param offset 分页 offset
 * @param limit 分页大小
 * @param status 申请状态
 */
export async function getSalespersonJoinRequests(offset: number = 0, limit: number = 20, status?: UserJoinRequestStatus) {
    return Taro.request({
        // url: `/meijing-division-server/api/v1/user-join-requests/list-by-invite-user`,
        url: `/simple-user-server/api/v3/user-join-request/list-by-inviteUser`,
        data: {
            status: status || '',
            offset: offset,
            limit: limit,
        }
    });
}

/**
 * 查询销售人员加入申请数量
 * @param status 申请状态 
 */
export async function countBySalesperson(status?: UserJoinRequestStatus) {
    return Taro.request({
        // url: `/meijing-division-server/api/v1/user-join-requests/count-by-invite-user`,
        url: `/simple-user-server/api/v3/user-join-request//count-by-inviteUser`,
        data: {
            status: status || '',
        }
    });
}

/**
 * 查询加入申请数量
 * @param status 申请状态 
 */
export async function countByAdmin(status?: UserJoinRequestStatus, tenantCode?: string) {
    return Taro.request({
        // url: `/meijing-division-server/api/v1/user-join-requests/count-by-admin`,
        url: `/simple-user-server/api/v3/user-join-request/count-by-admin`,
        data: {
            status: status || '',
            tenantCode
        }
    });
}

/**
 * 获取用户申请管理员状态
 */
export async function administratorRequests() {
    return Taro.request({
        // url: `/meijing-division-server/api/v1/administrator-requests/status`
        url: `/simple-user-server/api/v3/user-role-request/admin-request-status`
    });
}

/**
 * 设置用户申请管理员
 */
export async function setAdministratorRequests() {
    return Taro.request({
        // url: `/meijing-division-server/api/v1/administrator-requests`,
        url: `/simple-user-server/api/v3/user-role-request`,
        method: 'POST'
    });
}