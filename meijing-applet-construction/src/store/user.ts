import { observable, action, computed } from "mobx";
import Taro from "@tarojs/taro";
import { Location } from "../model/common";

export interface UserInfo {
  name: string;
  nickname: string;
  phone: string;
  avatar: string;
}

export interface UserDetails {
  id: number;
  name: string;
  nickname: string;
  phone: string;
  avatar: string;
  divisionCode: string;
  divisionName: string;
  divisionStatus: string;
  divisionCenterLocation: Location;
  divisionFree: boolean;
  hasOpenCar: boolean;
  status: string;
  departmentInfo: {
    id: number;
    name: string;
  };
  roles: [
    {
      code: string;
      name: string;
    }
  ];
  permissions: [
    {
      code: string;
      name: string;
    }
  ];
}

export class UserStore {
  @observable userDetails: UserDetails;
  @observable userInfo: UserInfo;
  @observable token = null;
  @observable registerToken = null;

  @computed get isLoggedIn() {
    return this.token && this.userDetails;
  }

  @computed get isJoinedDivision() {
    return this.isLoggedIn && this.userDetails.divisionCode;
  }

  @action load = (faildCallback?: () => void) => {
    if (Taro.getStorageSync("token")) {
      Taro.login().then(res => {
        if (res.code) {
          this.login(res.code, () => { }, faildCallback);
        }
      });
    }
    this.userDetails = Taro.getStorageSync("userDetails");
    this.token = Taro.getStorageSync("token");
  };

  @action logout = () => {
    Taro.removeStorageSync("userDetails");
    Taro.removeStorageSync("token");
    this.token = null;
  };

  @action grantUnionId = (callback?: (userDetails: any) => void) => {
    Taro.getUserInfo({
      success: async userInfo => {
        try {
          // 绑定unionid
          const res_unix = await Taro.request({
            method: "POST",
            url:
              "/simple-user-server/api/v2/auth/wechat/applet/mj-construction/bind-unionid",
            data: {
              rawData: userInfo.rawData,
              signature: userInfo.signature,
              encryptedData: userInfo.encryptedData,
              iv: userInfo.iv
            }
          });
          // @ts-ignore
          if (res_unix.data.success) {
            this.getUserDetails(callback);
          } else {
            // Taro.redirectTo({ url: "/pages/user_unionid_verify/index" });
            Taro.switchTab({ url: '/pages/index/index' });
          }
        }
        catch (error) {
          // Taro.showToast({
          //   title: "授权失败，请稍后再试",
          //   mask: true,
          //   icon: "none",
          //   duration: 3000
          // })
          Taro.switchTab({ url: '/pages/index/index' });
        }
      },
      fail: function () {
        Taro.redirectTo({ url: "/pages/user_unionid_verify/index" });
      }
    });
  };

  @action login = async (
    code: string,
    callback?: (userDetails: any) => void,
    faildCallback?: () => void,
  ) => {
    try {
      let response = await Taro.request({
        method: "POST",
        url: "/simple-user-server/api/v2/auth/wechat/mj-construction/login",
        data: {
          code: code
        }
      });
      this.token = response.data.token;
      Taro.setStorageSync("token", this.token);
      if (!response.data.hasUnionid) {
        this.grantUnionId(callback);
      } else {
        this.getUserDetails(callback);
      }
    } catch (error) {
      //登录错误且返回的错误码是 1001
      if (error.data && error.data.code == "1001") {
        faildCallback && faildCallback();
      }
      if (error.data && error.data.code == "1003") {
        this.loginByEncryption(code, callback, faildCallback)
      }
    }
  };

  @action loginByPhone = (
    phone: string,
    password: string,
    callback?: (userDetails: any) => void
  ) => {
    Taro.request({
      method: "POST",
      url: "/simple-user-server/api/v1/auth/login",
      data: {
        phone: phone,
        password: password
      }
    }).then(res => {
      this.token = res.data.token;
      Taro.setStorageSync("token", this.token);
      this.getUserDetails(callback);
    });
  };

  @action getRegisterToken = async (
    code: string,
    callback: (token: string) => void,
    faildCallback?: () => void
  ) => {
    try {
      let response = await Taro.request({
        method: "POST",
        url: `/simple-user-server/api/v2/auth/wechat/applet/mj-construction/register-token`,
        data: {
          code: code
        }
      });
      this.registerToken = response.data.registerToken;
      Taro.setStorageSync("registerToken", this.registerToken);
      callback(response.data.registerToken);
    } catch (error) {
      faildCallback && faildCallback();
    }
  };

  @action register = async (
    userInfo: any,
    callback?: (userDetails: any) => void,
    faildCallback?: () => void
  ) => {
    try {
      let response = await Taro.request({
        method: "POST",
        url:
          "/simple-user-server/api/v2/auth/wechat/applet/mj-construction/register",
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
        }
      });
      this.token = response.data.token;
      Taro.setStorageSync("token", this.token);
    } catch (error) {
      faildCallback && faildCallback();
    }
  };

  @action getUserDetails = (callback?: (userDetails: any) => void) => {
    Taro.request({
      url: "/meijing-division-server/api/v1/users/current/details"
    }).then(res => {
      this.userDetails = res.data;
      Taro.setStorageSync("userDetails", this.userDetails);
      if (callback) {
        callback(this.userDetails);
      }
    });
  };

  @action getSimpleUserInfo = (callback?: (userInfo: UserInfo) => void) => {
    Taro.request({
      url: "/simple-user-server/api/v1/users/current/details"
    }).then(res => {
      this.userInfo = res.data;
      if (callback) {
        callback(this.userInfo);
      }
    });
  };

  @action loginByEncryption = (code: string, callback?: (userDetails: any) => void, faildCallback?: () => void, ) => {
    Taro.getUserInfo({
      success: async userInfo => {
        try {
          const response = await Taro.request({
            method: "POST",
            url:
              "/simple-user-server/api/v2/auth/wechat/mj-construction/login-by-encryption",
            data: {
              rawData: userInfo.rawData,
              signature: userInfo.signature,
              encryptedData: userInfo.encryptedData,
              iv: userInfo.iv,
              wechatLoginCode: code,
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
          }
        }
      },
      fail: function () { }
    });
  };
}

export default new UserStore();
