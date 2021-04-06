import Taro from "@tarojs/taro";
import userStore from "@common/store/user";
import moment from "moment";

/**
 * 是否为正式版
 */
export const isRelease: boolean = __wxConfig.envVersion === "release";

export const baseUrl = "https://cloud.meijingdata.cn";

export const carUrl = "meijing-spcar-user-web";

export const rootSourceBaseUrl =
  "https://mpr.cdn.meijingdata.com/mini-programs/meijing-applet";

export const rootConstructionSourceBaseUrl =
  "https://mpr.cdn.meijingdata.com/mini-programs/meijing-applet-construction";

export const rootResearchWebSourceBaseUrl = 
  "https://mpr.cdn.meijingdata.com/mini-programs/meijing-research-web"

export const webSite = `${baseUrl}/meijing-research-web/${moment().valueOf()}/#/`.replace(
  "cn",
  isRelease ? "com" : "cn"
);

export const aliyunOssUrl: string = isRelease ? "https://mp.cdn.meijingdata.com" : "https://md.cdn.meijingdata.cn";

export const carWebSite = `${baseUrl}`.replace(
  "cn",
  isRelease ? "com" : "cn"
);

export const getUserAvatarUrl = function (userId: number): string {
  const baseAvatarUrl = isRelease ? 'https://mejiing360-pro.app-resources.cdn.fpi-inc.site' : 'https://meijing360-dev.cdn.fpi-inc.site';
  return baseAvatarUrl + `/users/wechat/avatar/${Math.floor(userId / 1000)}/${userId}`;
}

export const generateStamp = moment().valueOf();

const authInterceptor = function (chain) {
  let { url, header, ...otherParams } = chain.requestParams;

  if (!url.startsWith("http")) {
    url = baseUrl + url;
  }

  const { token, userDetails } = userStore;

  header = {
    "content-type": "application/json",
    "MJ-TenantVersion": "V2",
    "X-Authenticated-TenantTypeCode": "construction",
    ...header
  };
  if(userDetails && userDetails.tenant && userDetails.status === "COMMON"){
    header["MJ-TenantCode"] = userDetails.tenant.code;
  }
  if (token) {
    header["Authorization"] = token;
  }

  const requestParams = { url, header, ...otherParams };
  return chain.proceed(requestParams).then(res => {
    return res;
  });
};

export const codeMessage: Object = {
  200: "请求成功",
  400: "错误请求",
  401: "未授权，请求要求身份验证",
  403: "服务器拒绝请求",
  404: "服务器找不到请求的资源",
  405: "禁用请求中指定的方法",
  500: "服务器错误,服务器遇到错误，无法完成请求",
  502: "网关错误",
  503: "服务不可用，服务器暂时过载或维护",
  504: "网关超时"
};

const responseInterceptor = function (chain) {
  const requestParams = chain.requestParams;

  return chain.proceed(requestParams).then(res => {
    switch (res.statusCode) {
      case 401:
        userStore.logout();
        Taro.reLaunch({
          url: "/pages/login/login"
        });
        break;
      case 404:
        Taro.showToast({
          title: codeMessage[404],
          mask: true,
          icon: "none",
          duration: 3000
        });
        return Promise.reject(res);
        break;
      case 400:
      case 403:
      case 405:
      case 500:
        const errortext =
          (res.data && res.data.message) || codeMessage[res.statusCode];
        if (res.data && res.data.code != "1001" && res.data.code != "1002" && res.data.code != "2002") {
          Taro.showToast({
            title: errortext,
            mask: true,
            icon: "none",
            duration: 2000
          });
        }
        return Promise.reject(res);
      default:
        break;
    }
    return res;
  });
};

Taro.addInterceptor(authInterceptor);
Taro.addInterceptor(responseInterceptor);
