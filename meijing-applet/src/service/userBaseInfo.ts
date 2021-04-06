import Taro from "@tarojs/taro";

/**
 * 用于修改用户信息的实体对象
 */
export interface UserInfo {
  avatar: string;
  nickname: string;
  name: string;
  phone: string;
  departmentId?: number | null;
  departmentName?: string | null;
  divisionCode?: string;
  otherDepartment?: string | null;
}

/**
 * 用于用户提交加入行政区申请
 */
export interface UserJoinDivisionRequestEntry {
  userId: number | null;
  userName: string;
  phone?: string;
  departmentId: number | null;
  departmentName: string | null;
  departmentCode: string | null;
  tenantCode: string;
  divisionName: string;
  otherDepartment?: string | null;
  inviteUserId?: number | null
}

export interface WeixinPhone {
  phone: string;
}

/**
 * 修改用户信息
 * @param user 用户信息
 */
export async function updateCurrentUserInfo(user: UserInfo) {
  return Taro.request({
    url: `/meijing-division-server/api/v1/users/current`,
    data: user,
    method: "POST"
  });
}

/**
 * 修改用户信息
 * @param user 用户信息
 */
export async function updateSimpleUserInfo(user: UserInfo) {
  return Taro.request({
    url: `/simple-user-server/api/v3/users/current`,
    data: user,
    method: "POST"
  });
}

/**
 * 提交用户行政区划激活申请
 * @param user 用户信息
 */
export async function uploadDivisionActiveRequest(user: UserInfo) {
  return Taro.request({
    url: `/meijing-division-server/api/v1/division-active-requests`,
    data: {
      ...user
    },
    method: "POST"
  });
}

/**
 * 提交用户加入行政区申请
 * @param request 用户信息
 */
export async function userJoinDivisionRequest(
  request: UserJoinDivisionRequestEntry
) {
  return Taro.request({
    // url: `/meijing-division-server/api/v1/user-join-requests`,
    url: `/simple-user-server/api/v3/user-join-request`,
    data: {
      ...request
    },
    method: "POST"
  });
}

/**
 * 发送验证码
 * @param phone 手机号码
 * @param isRegister 是否注册用户
 */
export async function sendVerifyCode(phone: string, isRegister: boolean) {
  return Taro.request({
    method: "POST",
    url: "/simple-user-server/api/v3/auth/verify-code",
    data: {
      phone: phone,
      action: isRegister ? "register" : "other"
    }
  });
}

export async function decryptPhone(
  encryptedData: string,
  iv: string,
  registerToken: string
): Promise<WeixinPhone> {
  const appKey = Taro.getStorageSync('appKey')
  const response = await Taro.request({
    method: "POST",
    url: `/simple-user-server/api/v3/auth/wechat/applet/${appKey}/decrypt-and-bind-register-phone`,
    data: {
      encryptedData: encryptedData,
      iv: iv,
      registerToken: registerToken
    }
  });
  return response && response.data;
}

/**
 * 绑定手机号码
 * @param phone 手机号码
 * @param registerToken 安全码
 */
export async function bindUserPhone(
  phone: string,
  verifyCode: string,
  registerToken: string
) {
  return Taro.request({
    method: "POST",
    url: "/simple-user-server/api/v3/auth/wechat/applet/bind-phone",
    data: {
      phone: phone,
      verifyCode: verifyCode,
      registerToken: registerToken
    }
  });
}

/**
 * 修改手机号码
 * @param phone 手机号码
 * @param verifyCode 验证码
 */
export async function updateUserPhone(phone: string, verifyCode: string) {
  return Taro.request({
    method: "POST",
    url: "/simple-user-server/api/v3/users/phone",
    data: {
      phone: phone,
      verifyCode: verifyCode
    }
  });
}
