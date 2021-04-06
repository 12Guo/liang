import { observable, action, computed } from "mobx";
import Taro from "@tarojs/taro";
import get from 'lodash/get';
import { isOldVersion } from '../utils/common'

export interface UserInfo {
  name: string;
  nickname: string;
  phone: string;
  avatar: string;
}

export interface UserDetails {
  departmentCode: any;
  departmentNode: {
    children: null | any[],
    code: string,
    id: number,
    name: string,
    parentCode: null | string,
    parentId: null | string
  };
  requestStatus: string;
  status: string;
  resources: string[];
  roles: [{
    code: string;
    name: string
  }];
  simpleUserInfo: {
    name: string;
    nickName: string;
    phone: string;
    userId: number
  }
  tenant: any;
  tenantPlan: any;
  tenantType: any;
  tenantUser: any;
  pollutionSourceInfo?: {
    divisionCode: string;
    divisionName: string;
    pollutionSourceId: number;
    pollutionSourceName: string;
  }
}

export class UserStore {
  @observable userDetails: UserDetails;
  @observable userInfo: UserInfo;
  @observable token = null;
  @observable registerToken = null;
  @observable moduleAuthority = {};
  @observable serialNumber = null;
  @observable simpleUserInfo = null;
  @observable appKey = ''

  @computed get isLoggedIn() {
    return this.token && this.userDetails;
  }

  @action load = (faildCallback?: () => void) => {
    // if (Taro.getStorageSync("token")) {
    //   Taro.login().then(res => {
    //     if (res.code) {
    //       this.login(res.code, () => { }, faildCallback);
    //     }
    //   });
    // }
    this.userDetails = Taro.getStorageSync("userDetails");
    this.token = Taro.getStorageSync("token");
    this.appKey = Taro.getStorageSync("appKey");
    Taro.login().then(res => {
      if (res.code) {
        this.login(res.code, () => { }, faildCallback);
      }
    });
  };

  @action logout = () => {
    Taro.removeStorageSync("userDetails");
    Taro.removeStorageSync("token");
    this.token = null;
  };

  // 调用绑定unionid
  @action grantUnionId = () => {
    Taro.getUserInfo({
      success: async userInfo => {
        try {
          const appKey = this.appKey || Taro.getStorageSync('appKey')
          // 绑定unionid
          Taro.request({
            method: "POST",
            url: `/simple-user-server/api/v3/auth/wechat/${appKey}/bind-unionid`,
            data: {
              rawData: userInfo.rawData,
              signature: userInfo.signature,
              encryptedData: userInfo.encryptedData,
              iv: userInfo.iv
            },
            header: {
              "MJ-TenantVersion": "V2"
            }
          });
        }
        catch (error) { }
      },
      fail: function () { }
    });
  };

  // 根据login的 code 来登录
  @action login = async (
    code: string,
    callback?: (userDetails: any) => void,
    faildCallback?: () => void,
  ) => {
    try {
      const appKey = this.appKey || Taro.getStorageSync('appKey')
      let response = await Taro.request({
        method: "POST",
        url: `/simple-user-server/api/v3/auth/wechat/${appKey}/login-by-code`,
        data: { code },
        header: {
          "MJ-TenantVersion": "V2"
        }
      });
      this.token = response.data.token;
      Taro.setStorageSync("token", this.token);
      if (!response.data.hasUnionid) {
        this.grantUnionId();
      }
      this.getUserDetails(callback);
    } catch (error) {
      console.log("error", error);
      //登录错误且返回的错误码是 1001
      if (error.data && error.data.code == "1001") {
        this.serialNumber = error.data.serialNum;
        faildCallback && faildCallback();
      }
      if (error.data && error.data.code == "2002") {
        this.serialNumber = error.data.serialNum;
        this.loginByEncryption(callback, faildCallback)
      }
    }
  };

  // 租户加入申请 - le
  @action userJoinRequest = async data => {
    return await Taro.request({
      method: "POST",
      url:
        "/simple-user-server/api/v3/user-join-request",
      data: data,
      header: {
        "MJ-TenantVersion": "V2"
      }
    });
  };

  // 手机号、密码登录（未用到）
  @action loginByPhone = (
    phone: string,
    password: string,
    callback?: (userDetails: any) => void
  ) => {
    Taro.request({
      method: "POST",
      url: "/simple-user-server/api/v3/auth/login",
      data: {
        phone: phone,
        password: password
      },
      header: {
        "MJ-TenantVersion": "V2"
      }
    }).then(res => {
      this.token = res.data.token;
      Taro.setStorageSync("token", this.token);
      this.getUserDetails(callback);
    });
  };

  @action appletModules = () => {
    Taro.request({
      method: "GET",
      url: "/meijing-control-server/api/v1/division-config/type-detail?type=MEIJING_APPLET_MODULES"
    }).then(res => {
      this.moduleAuthority = get(res, 'data.config', {})
    });
  };


  // 用户信息userInfo来注册（未用到）
  @action register = async (
    userInfo: any,
    callback?: (userDetails: any) => void,
    faildCallback?: () => void
  ) => {
    try {
      const appKey = this.appKey || Taro.getStorageSync('appKey')
      let response = await Taro.request({
        method: "POST",
        url: `/simple-user-server/api/v3/auth/wechat/applet/${appKey}/register`,
        data: {
          phone: userInfo.phone,
          nickname: userInfo.nickname,
          avatar: userInfo.avatar,
          sex: userInfo.sex,
          city: userInfo.city,
          province: userInfo.province,
          registerToken: userInfo.registerToken,
          rawData: userInfo.rawData,
          signature: userInfo.signature,
          encryptedData: userInfo.encryptedData,
          iv: userInfo.iv
        },
        header: {
          "MJ-TenantVersion": "V2"
        }
      });
      this.token = response.data.token;
      this.getUserDetails(callback);
      Taro.setStorageSync("token", this.token);
    } catch (error) {
      faildCallback && faildCallback();
    }
  };

  // 获取用户详情（登录成功调用）
  @action getUserDetails = (callback?: (userDetails: any) => void) => {
    const apiOldVersion = isOldVersion()
    Taro.request({
      url: apiOldVersion ? "/meijing-division-server/api/v1/users/current/details" : "/simple-user-server/api/v3/tenant-user/user-detail",
      method: "GET"
    }).then(res => {
      const newUserDetails = Object.assign({}, this.userDetails, res.data);
      this.userDetails = newUserDetails;
      Taro.setStorageSync("userDetails", newUserDetails);
      callback && callback(newUserDetails);
    });
  };

  @action getConstructionSiteInfo = (callback?: (userDetails) => void, faildCallback?: (error) => void) => {
    Taro.request({
      url: "/meijing-inspect-server/api/v1/construction-site-manager/construction-site-info",
      method: "GET"
    }).then(res => {
      this.userDetails.pollutionSourceInfo = res.data;
      console.log(this.userDetails);
      Taro.setStorageSync("userDetails", this.userDetails);
      if (callback) {
        callback(this.userDetails);
      }
    }).catch(error => {
      faildCallback && faildCallback(error);
    })
  }

  // 获取用户简单信息（未用到）
  @action getSimpleUserInfo = (callback?: (userInfo: UserInfo) => void) => {
    Taro.request({
      url: "/simple-user-server/api/v3/users/current/details",
      header: {
        "MJ-TenantVersion": "V2"
      }
    }).then(res => {
      this.userInfo = res.data;
      if (callback) {
        callback(this.userInfo);
      }
    });
  };

  // 根据用户加密信息来登录
  @action loginByEncryption = (callback?: (userDetails: any) => void, faildCallback?: () => void) => {
    const appKey = this.appKey || Taro.getStorageSync('appKey')
    Taro.getUserInfo({
      success: async res => {
        console.log("store -> user-loginByEncryption", res);
        const { nickName: nickname, avatarUrl: avatar, gender: sex, city, province } = res.userInfo;

        try {
          const response = await Taro.request({
            method: "POST",
            url: `/simple-user-server/api/v3/auth/wechat/${appKey}/login-by-encryption`,
            data: {
              userInfo: { nickname, avatar, sex, city, province },
              serialNumber: this.serialNumber,
              rawData: res.rawData,
              signature: res.signature,
              encryptedData: res.encryptedData,
              iv: res.iv
            }
          });
          // @ts-ignore
          if (response.data.token) {
            this.token = response.data.token;
            Taro.setStorageSync("token", this.token);
            this.getUserDetails(callback);
          }
        }
        catch (error) {
          //登录错误且返回的错误码是 1001
          if (error.data && error.data.code == "1001") {
            faildCallback && faildCallback();
          } else {
            Taro.showToast({
              title: error.data.message,
              icon: "none",
            })
          }
        }
      },
      fail: function () { }
    });
  };

  // 用户手机加密信息登录
  @action loginByPhoneEncryption = async (phoneInfo, callback?: (userDetails: any) => void, faildCallback?: () => void) => {
    try {
      const appKey = this.appKey || Taro.getStorageSync('appKey')
      const response = await Taro.request({
        url: `/simple-user-server/api/v3/auth/wechat/${appKey}/login-by-phone-encryption`,
        method: "POST",
        data: {
          serialNumber: this.serialNumber,
          ...phoneInfo
        }
      });
      this.token = response.data.token;
      Taro.setStorageSync("token", this.token);
      this.getUserDetails(callback);
    } catch (error) {
      if (error.data && error.data.code === "2003") {
        this.serialNumber = error.data.serialNum;
        faildCallback && faildCallback();
      } else {
        Taro.showToast({
          title: error.data.message,
          icon: "none",
        });
      }
    }
  }

  //  用户手机和验证码登录
  @action loginByPhoneVerify = async (phone: string, verifyCode: string, callback?: (userDetails: any) => void, faildCallback?: (error) => void) => {
    try {
      const response = await Taro.request({
        method: "POST",
        url: `/simple-user-server/api/v3/auth/wechat/${this.appKey}/login-by-phone-verify`,
        data: {
          phone,
          verifyCode,
          serialNumber: this.serialNumber
        }
      });
      this.token = response.data.token;
      Taro.setStorageSync("token", this.token);
      this.getUserDetails(callback);
      // if (!response.data.hasUnionid) {
      //   this.grantUnionId(callback);
      // } else {
      //   this.getUserDetails(callback);
      // }
    } catch (error) {
      Taro.showToast({
        title: error.data.message,
        icon: "none"
      });
      faildCallback && faildCallback(error);
    }
  }
}

export default new UserStore();
