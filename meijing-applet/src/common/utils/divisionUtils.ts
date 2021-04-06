import { Location } from "../model";
/**
 * 行政区域编码等级 只展示4级
 */
export const DivisionLevel = {
  PROVINCE: 2,
  CITY: 4,
  COUNTY: 6,
  TOWN: 9,
  VILLAGE: 12
};

export const DIVISION_LEVEL_CODES = {
  2: "PROVINCE",
  4: "CITY",
  6: "COUNTY",
  9: "TOWN",
  12: "VILLAGE"
};

export const eventSource = {
  WEAPP: "微信小程序",
  MEIJING_CAMERA: "美境相机",
  MEIJING_CAR: "美境专车",
  MEIJING_SENTRY: "美境哨兵",
  MEIJING_CONSTRUCTION_SITE: "智慧生态工地-巡查上报",
  SUPERIOR_MANAGE: "上级整改"
}

/**
 * 行政区状态
 */
export enum DivisionStatus {
  /**
   * 未激活-老款
   */
  REJECT = "REJECT",
  /**
   * 激活申请中-老款
   */
  CONFIRMING = "CONFIRMING",
  /**
   * 已激活-老款
   */
  PASS = "PASS",
  /**
   * 未激活
   */
  INACTIVE = "INACTIVE",
  /**
   * 激活申请中
   */
  UNDER_REVIEW = "UNDER_REVIEW",
  /**
   * 已激活
   */
  ACTIVE = "ACTIVE"
}

/**
 * 行政区编码长度
 */
export const DIVISION_LENGTH = 12;

/**
 * 顶级行政区
 */
export const SUPER_DIVION_CODE = "000000000000";

export interface Division {
  code: string;
  name: string;
  status?: DivisionStatus;
  superiorAccess: boolean;
  parentName?: string;
  parentCode?: string;
  opened?: boolean;
}

export function calculateRad(value: number): number {
  return (value * Math.PI) / 180.0;
}

export function calculateDistance(
  userLocation: Location,
  currentLocation: Location
): string {
  let radLat1 = calculateRad(userLocation.latitude);
  let radLat2 = calculateRad(currentLocation.latitude);
  let a = radLat1 - radLat2;
  let b =
    calculateRad(userLocation.longitude) -
    calculateRad(currentLocation.longitude);
  let s =
    2 *
    Math.asin(
      Math.sqrt(
        Math.pow(Math.sin(a / 2), 2) +
          Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)
      )
    );
  s = s * 6378.137;
  s = Math.round(s * 10000) / 10000;
  return "(距离" + s + "公里)";
}

export interface SimpleDivision extends Division {
  children: SimpleDivision[];
}

export function getDivisionLevelCode(divisionCode: string): string {
  const level = getDivisionLevel(divisionCode);
  return DIVISION_LEVEL_CODES[level];
}

/**
 * 根据divisionCode获取行政区域编码等级
 * @param divisionCode
 */
export function getDivisionLevel(divisionCode: string): number {
  for (let key in DivisionLevel) {
    let level = DivisionLevel[key];
    if (divisionCode.match(getDivisionLevelPattern(level))) {
      return level;
    }
  }
  return 0;
}

/**
 * 获取行政区编码级别正则
 * @param level
 */
export function getDivisionLevelPattern(level: number) {
  let patternStr = `[0-9]{${level}}`;
  for (let i = 0; i < DIVISION_LENGTH - level; i++) {
    patternStr = patternStr + "0";
  }
  return new RegExp(patternStr);
}

/**
 * 将乡镇、村行政区列表加入到区县的children属性中
 * @param data 省、市、县 行政区列表
 * @param divisionCode 行政区编码
 * @param childData 乡镇、村 行政区列表
 */
export function mixinDivisionData(
  data: SimpleDivision[],
  divisionCode: string,
  childData: SimpleDivision[]
) {
  if (!childData || childData.length == 0) {
    return data;
  }
  const childDivisionLevel = getDivisionLevel(childData[0].code);
  if (childDivisionLevel == 0) {
    return data;
  }
  const parentDivisionLevel = getParentLevel(childDivisionLevel);
  if (parentDivisionLevel == 0) {
    return data;
  }

  let sourceDivisionList = data;

  for (let key in DivisionLevel) {
    let level = DivisionLevel[key];

    if (level < childDivisionLevel) {
      let sourceDivision = getDivisionOnLevel(
        sourceDivisionList,
        divisionCode,
        level
      );

      if (!sourceDivision || sourceDivision == null) {
        return data;
      }
      sourceDivisionList = sourceDivision.children;

      if (parentDivisionLevel == level) {
        sourceDivision.children = childData;
      }
    }
  }
  return data;
}

/**
 * 获取行政区编码、level匹配的行政区
 * @param sourceDivisionList 源行政区列表
 * @param divisionCode 行政区编码
 * @param level 行政区级别
 */
export function getDivisionOnLevel(
  sourceDivisionList: SimpleDivision[],
  divisionCode: string,
  level: number
) {
  if (!sourceDivisionList || sourceDivisionList.length == 0) {
    return null;
  }

  let divisionCodeTemp = divisionCode.substring(0, level);

  for (let i = 0; i < sourceDivisionList.length; i++) {
    let sourceDivision = sourceDivisionList[i];

    if (divisionCodeTemp === sourceDivision.code.substring(0, level)) {
      return sourceDivision;
    }
  }
  return null;
}

/**
 * 获取父级行政区编码
 * @param divisionCode
 */
export function getParentDivisionCode(divisionCode: string): string {
  if (
    !divisionCode ||
    divisionCode.length != DIVISION_LENGTH ||
    divisionCode == SUPER_DIVION_CODE
  ) {
    return SUPER_DIVION_CODE;
  }
  const level = getDivisionLevel(divisionCode);
  const parentLevel = getParentLevel(level);

  return getDivisionCodeWithLevel(divisionCode, parentLevel);
}

/**
 * 获取行政区编码对应的城市编码
 * @param divisionCode 行政区编码
 */
export function getCityDivisionCode(divisionCode: string) {
  return getDivisionCodeWithLevel(divisionCode, DivisionLevel.CITY);
}

/**
 * 获取行政区对应（级别）的行政区编码
 * @param divisionCode 行政区编码
 * @param level 行政区级别 参考DivisionLevel
 */
export function getDivisionCodeWithLevel(divisionCode: string, level: number) {
  let zeros = "";
  for (let i = 0; i < DIVISION_LENGTH - level; i++) {
    zeros = zeros + "0";
  }
  return divisionCode.substring(0, level) + zeros;
}

/**
 * 获取父行政区级别
 * @param level 当前行政区级别
 */
export function getParentLevel(level: number) {
  let parentLevel = 0;
  for (let key in DivisionLevel) {
    if (DivisionLevel[key] < level) {
      parentLevel = DivisionLevel[key];
    } else {
      return parentLevel;
    }
  }
  return parentLevel;
}

/**
 * 获取行政区代码前缀
 * @param divisionCode
 * <ul>
 * <li>省级行政区：返回前2位</li>
 * <li>市级行政区：返回前4位</li>
 * <li>区县级行政区：返回前6位</li>
 * <li>乡镇级行政区：返回前9位</li>
 * <li>村级行政区：返回前12位</li>
 * </ul>
 */
export function getDivisionPrefix(divisionCode: string): string {
  if (divisionCode.length != DIVISION_LENGTH) {
    return "";
  }
  const level: number = getDivisionLevel(divisionCode);
  return divisionCode.substring(0, level);
}

/**
 * 判断当前定位行政区是否在用户行政区范围内
 * @param userDivisionCode 用户所在行政区
 * @param divisionCode 当前定位行政区
 */
export function checkDivision(
  userDivisionCode: string,
  divisionCode: string
): boolean {
  if (!(userDivisionCode && divisionCode)) {
    return false;
  }
  if (
    userDivisionCode.length != DIVISION_LENGTH ||
    divisionCode.length != DIVISION_LENGTH
  ) {
    return false;
  }
  return divisionCode.startsWith(getDivisionPrefix(userDivisionCode));
}
