import Taro from "@tarojs/taro";
import { Location } from "../model/common";

/**
 * 获取用户经纬度
 * @param user 用户信息
 */
export async function getLocation() {
  let location: Location = { latitude: -1, longitude: -1 };
  await Taro.getLocation({
    type: "gcj02",
    success(res) {
      location.latitude = res.latitude;
      location.longitude = res.longitude;
    }
  });
  return location;
}

/**
 * 逐级查询开放的行政区
 * @param divisionCode 行政区编码
 */
export async function getParentsOpenDivision(divisionCode: string) {
  return Taro.request({
    method: "GET",
    url: `/meijing-division-server/api/v1/divisions/open/parents-open-division?divisionCode=${divisionCode}`
  });
}

/**
 * 获取省份及城市数据
 */
export async function getProvinceAndCityDatas() {
  return Taro.request({
    method: "GET",
    url:
      "/meijing-division-server/api/v1/divisions/open/provinces-and-cities-tree"
  });
}

/**
 * 获取下级行政区数据
 */
export async function getCountryAndTownDatas(divisionCode: string) {
  return Taro.request({
    method: "GET",
    url: `/meijing-division-server/api/v1/divisions/open/cities/${divisionCode}/counties-and-towns-group`
  });
}
