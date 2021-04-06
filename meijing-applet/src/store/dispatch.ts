import { observable, action, computed } from "mobx";
import moment, { Moment } from 'moment';
import {
  getCurrentRoutineDispatch, getSites, getSiteMonitorDatas, getInspects, getDivisionGoal,
  getPollutionSources, getStaffs, Region, getWeekData, loadRecentGoalInfo, calculateFactorRank, loadYearGoal,
  calculateValueGoalInfo, calculateRankGoalInfo, loadPm25YearGoal, calculateDayDivisionGoalInfo, loadDivisionDayData
  , getSiteMonitorDatasByTime, getSitesByCode, getSiteMonitorMinuteDatasByTime
} from '../service/dispatch'
import { Site, Inspect, PollutionSource, Staff, SiteMonitorData, Location } from '../model'
import { rootSourceBaseUrl } from '@common/utils/requests'
import { marker } from '@tarojs/components/types/Map'
import { getAddressByLocationFromTencentMap } from '@common/utils/mapUtils'
import { getValueColor, getHourLevel, getFactorDataKey } from '@common/utils/monitor'
import { getEventsDetail, getEventByTag } from "../service/pollutantEvent";
import { getGoalsByPeriod, DivisionGoal, DivisionRankGoalInfo, ValueGoalInfo, GoalConfig, FactorRankInfo, CalculateDayGoalValueInfo, CurrentPm25Value } from "../service/division";
import { getLocation } from "../service/userDivision";
import { calculateDistance } from '@common/utils/divisionUtils'
import get from "lodash/get";


export interface Polygon {
  coordinates: [number, number][][],
  type: "Polygon",
}

export interface Feature {
  geometry: Polygon,
  type: 'Feature',
  properties: {
    factors: {
      value: number
    }
  }
}
export interface RoutineDispatch {
  id: number,
  auditingExpertUserAvatar: string,
  auditingExpertUserId: number,
  auditingExpertUserName: string,
  controlAreaJson: {
    features: Feature[],
    type: 'FeatureCollection'
  },
  controlProposal: string,
  controlProposalSummary: string,
  dispatchBeginTime: Date,
  dispatchEndTime: Date,
  divisionCode: string,
  emergencyDispatch: boolean,
  mainBodyUrl: string,
  createTime: Date,
  modifyTime: Date
}

export interface WeatherData {
  dataTime: number,
  weather: number,
  V_a01007: number,
  V_a01008: string,
  V_a01001: number
}

export interface Remind {
  id: number,
  divisionCode: string,
  divisionName: string,
  dataTime: string,
  controlProposalSummary: string,
  controlAreaJson: {
    controlAreaJson: {
      features: Feature[],
      type: 'FeatureCollection'
    }
  },
  controlProposal: string,
  airDatas: {
    V_a05024: number,
    V_a21004: number,
    V_a21005: number,
    V_a21026: number,
    V_a34002: number,
    V_a34004: number,
    aqi: number,
    main_pollutants: string[],
  },
  weatherDatas: {
    data: WeatherData[]
  },
  weatherSuggestion: string,

}

export interface DrawerStatus {
  site: boolean,
  pollution: boolean,
  roadCondition: boolean,
  pollutionType: boolean,
  selectPollutionTypeIds: number[],
  selectPollutionSourceTypeIds: number[],
  selectSiteTypes: number[],
  factorCode: string,
  staffPosition: boolean,
  currentUserId: number,
  mapType: string
  clickLocation: Location | undefined,
  enableShowRadius: boolean
}

const getFillColorByValue = (currentValue: number, maxValue: number) => {
  let levelValue = Math.ceil(16 + (currentValue / maxValue) * 184);
  return ("#E22424" + levelValue.toString(16));
}

const parsePollutantImageByLevel = (selected: boolean, examineSite: boolean, value: number, facotrCode: string) => {
  let level: number = -1;
  if (!selected) {
    level = getHourLevel(facotrCode, value);
  }
  if (isNaN(value) && examineSite) {
    return rootSourceBaseUrl + `/assets/task_dispatch/examine_level_${selected ? 0 : -1}.png`
  } else if (isNaN(value) && !examineSite) {
    return rootSourceBaseUrl + `/assets/task_dispatch/none.png`
  }
  if (examineSite) {
    return rootSourceBaseUrl + `/assets/task_dispatch/examine_level_${(level + 1)}.png`
  } else {
    return rootSourceBaseUrl + `/assets/task_dispatch/none.png`
  }
}

const MARKER_TYPE_SUFFIX_MAP = {
  'Site': 1,
  'Inspect': 2,
  'PollutionSource': 3,
  'Staff': 4,
}

type MarkerType = 'Site' | 'PollutionSource' | 'Inspect' | 'Staff'

export class DispatchStore {
  @observable routineDispatch: RoutineDispatch
  @observable remind: Remind | null
  @observable sites: Site[]
  @observable alarmSite: Site[]
  @observable inspects: Inspect[]
  @observable targetWeekData?: number
  @observable loadSuccess: boolean
  @observable currentPm25Value: number
  @observable pollutionSources: PollutionSource[]
  @observable alarmPollutionSources: PollutionSource[]
  @observable staffs: Staff[]
  @observable siteMonitorDataMap: Map<string, SiteMonitorData>
  @observable alarmSiteMonitorDataMap: Map<string, SiteMonitorData>
  @observable currentStaffAddress: string = ''
  @observable currentStaffDistance: string = ''
  @observable selectedMarker: {
    markerId?: number;
    id?: number;
    type?: MarkerType
  } = {}
  @observable inspectStatistics: {
    totalWorks: number;
    watering: number;
    totalEvents: number;
    disposedEvents: number;
  }
  @observable rankGoalInfo: DivisionRankGoalInfo | null
  @observable valueGoalInfo: ValueGoalInfo | null
  @observable factorRankInfo: FactorRankInfo | null
  @observable divisionGoal: DivisionGoal | null
  @observable divisionGoalInfo: any
  @observable dayGoalValueInfo: CalculateDayGoalValueInfo | null
  @observable currentAlarmFactor: string
  @observable drawerStatus: DrawerStatus = {
    site: true,
    pollution: false,
    roadCondition: false,
    pollutionType: true,
    selectPollutionTypeIds: [],
    selectPollutionSourceTypeIds: [],
    selectSiteTypes: [],
    factorCode: 'a34004',
    staffPosition: false,
    currentUserId: 0,
    mapType: "COMMON",
    clickLocation: undefined,
    enableShowRadius: true
  }
  siteHourDataExpirationTime: Moment

  @action clearData() {
    this.drawerStatus.selectPollutionTypeIds = [];
    this.drawerStatus.selectPollutionSourceTypeIds = [];
    this.drawerStatus.selectSiteTypes = [];
    this.sites = [];
    this.rankGoalInfo = null;
    this.valueGoalInfo = null;
    this.divisionGoal = null;
    this.divisionGoalInfo = {};
    this.factorRankInfo = null;
    this.inspects = [];
    this.pollutionSources = [];
    this.staffs = [];
    this.targetWeekData = undefined;
    this.siteMonitorDataMap = new Map();
    this.alarmSiteMonitorDataMap = new Map();
  }

  needLoadRoutineDispatch = () => {
    const now = moment(new Date())
    return this.routineDispatch == null || now.isAfter(this.routineDispatch.dispatchEndTime)
  }

  @action loadCurrentPm25Value(divisionCode: string) {
    let startTime = moment()
      .startOf('day')
      .toDate()
      .getTime();
    let endTime = moment()
      .endOf('day')
      .toDate()
      .getTime();
    loadDivisionDayData(divisionCode, startTime, endTime).then((data: any) => {
      this.currentPm25Value = data.datas.V_a34004;
    })
  }

  @action loadRecentGoalInfo(divisionCode: string) {
    loadRecentGoalInfo(divisionCode).then((goalConfig: GoalConfig) => {
      if (goalConfig && goalConfig.id) {
        if (goalConfig.type == "VALUE_GOAL") {
          this.calculateValueGoalInfo(goalConfig.id)
        } else {
          this.calculateGoalRankInfo(goalConfig.id)
        }
      } else {
        this.resetGoalCache()
        this.loadSuccess = true;
      }
    })
  }

  @action loalPm25CurrentDayData(divisionCode: string) {
    calculateDayDivisionGoalInfo({
      divisionCode,
      factor: 'a34004',
      period: 'DAY',
      dataTime: Date.now(),
    }).then((result: CalculateDayGoalValueInfo) => {
      this.dayGoalValueInfo = result;
    })
  }

  @action loalCurrentDayData(divisionCode: string, facotrCode: string) {
    calculateDayDivisionGoalInfo({
      divisionCode,
      factor: facotrCode,
      period: 'DAY',
      dataTime: Date.now(),
    }).then((result: CalculateDayGoalValueInfo) => {
      this.dayGoalValueInfo = result;
    })
  }

  @action loadPm25HourRankInfo(divisionCode: string) {
    calculateFactorRank(divisionCode, "a34004").then((factorRankInfo: FactorRankInfo) => {
      this.factorRankInfo = factorRankInfo;
    })
  }

  @action loadHourRankInfo(divisionCode: string, facotrCode: string) {
    calculateFactorRank(divisionCode, facotrCode).then((factorRankInfo: FactorRankInfo) => {
      this.factorRankInfo = factorRankInfo;
    })
  }

  //获取浓度目标配置信息
  @action calculateValueGoalInfo(id: number) {

    calculateValueGoalInfo(id).then((valueGoalInfo: ValueGoalInfo) => {
      this.valueGoalInfo = valueGoalInfo;
      this.loadSuccess = true;
    }).catch(() => {
      this.loadSuccess = true;
    });
  }

  @action resetGoalCache() {
    this.valueGoalInfo = null;
    this.rankGoalInfo = null;
    this.dayGoalValueInfo = null;
    this.factorRankInfo = null;
    this.currentPm25Value = -1;
  }

  //获取排名目标配置信息
  @action calculateGoalRankInfo(id: number) {

    calculateRankGoalInfo(id).then((rankGoalInfo: DivisionRankGoalInfo) => {
      this.rankGoalInfo = rankGoalInfo;
      this.loadSuccess = true;
    }).catch(() => {
      this.loadSuccess = true;
    });
  }

  @action resetSiteData() {
    this.sites = [];
    this.selectedMarker = {};
    this.drawerStatus.clickLocation = undefined
  }

  @action loadInspect(divisionCode: string) {
    var mondayTime = moment().startOf('day').toDate().getTime();
    var sundayTime = moment().endOf('day').toDate().getTime();
    this.loadInspectStatistics(divisionCode, mondayTime, sundayTime)
  }

  @action loadRoutineDispatch() {
    // if (this.needLoadRoutineDispatch()) {
    //   getCurrentRoutineDispatch().then((dispatch: RoutineDispatch) => {
    //     if (dispatch != null) {
    //       this.routineDispatch = dispatch
    //       this.loadInspectStatistics(dispatch.divisionCode, dispatch.dispatchBeginTime, dispatch.dispatchEndTime)
    //     }
    //   })
    // } else {
    //   const dispatch = this.routineDispatch
    //   this.loadInspectStatistics(dispatch.divisionCode, dispatch.dispatchBeginTime, dispatch.dispatchEndTime)
    // }

    //当前管控建议是需要人员在后台编辑的,需要实时显示最新数据,等后台服务完善之后放开以上判断注释
    //当前管控建议以实时刷新为主
    getCurrentRoutineDispatch().then((dispatch: Remind) => {
      if (dispatch && dispatch.divisionCode) {
        this.remind = dispatch
      } else {
        this.remind = null;
      }
    })
  }

  needLoadSiteMonitorDatas = () => {
    if (this.siteMonitorDataMap == null || this.siteMonitorDataMap.size == 0 || this.sites == null || this.sites.length == 0) {
      return true
    }
    if (this.siteHourDataExpirationTime.isBefore(moment(new Date()))) {
      return true
    }
    return false
  }

  @action loadLatestAlarmSiteMonitorDatas(dataTime: number, siteCode: string, timeType: string) {
    if (timeType == "HOUR") {
      getSiteMonitorDatasByTime(dataTime, siteCode).then((monitorDatas: SiteMonitorData[]) => {
        this.loadSiteByCode(siteCode)
        if (monitorDatas == null || monitorDatas.length == 0) {
          return
        }
        this.alarmSiteMonitorDataMap = new Map()
        monitorDatas.forEach((data) => {
          this.alarmSiteMonitorDataMap.set(data.siteCode, data)
        })
      })
    } else {
      getSiteMonitorMinuteDatasByTime(dataTime, siteCode).then((monitorDatas: SiteMonitorData[]) => {
        this.loadSiteByCode(siteCode)
        if (monitorDatas == null || monitorDatas.length == 0) {
          return
        }
        this.alarmSiteMonitorDataMap = new Map()
        monitorDatas.forEach((data) => {
          this.alarmSiteMonitorDataMap.set(data.siteCode, data)
        })
      })
    }
  }

  @action loadLatestMonitorDatas(divisionCode: string, isExamineSite: boolean = false) {
    getSiteMonitorDatas(divisionCode, isExamineSite).then((monitorDatas: SiteMonitorData[]) => {
      this.loadSites(divisionCode)
      if (monitorDatas == null || monitorDatas.length == 0) {
        return
      }
      this.siteMonitorDataMap = new Map()
      monitorDatas.forEach((data) => {
        this.siteMonitorDataMap.set(data.siteCode, data)
      })
      this.siteHourDataExpirationTime = moment(new Date()).add(5, 'm')
    })
  }

  @action loadSites(divisionCode: string) {
    getSites(divisionCode).then((sites) => {
      if (sites != null) {
        this.sites = sites
      }
    })
  }

  @action loadSiteByCode(siteCode: string) {
    getSitesByCode(siteCode).then((sites) => {
      if (sites != null) {
        this.alarmSite = [sites];
      }
    })
  }

  @action loadTargetWeekData() {
    getWeekData().then(targetResponse => {
      this.targetWeekData = targetResponse.V_a34004
    })
  }

  @action loadDivisionGoalList(divisionCode: string) {
    getDivisionGoal({ divisionCode }).then(response => {
      this.divisionGoalInfo = get(response, 'data[0]', {})
    })
  }

  @action loadInspects() {
    getInspects().then(inspects => this.inspects = inspects)
  }

  @action async loadPollutionSources(region: Region) {
    getLocation()
      .then(location => getPollutionSources(location, region))
      .then(pollutionSources => this.pollutionSources = pollutionSources)
  }

  @action async loadStaffs() {
    getStaffs().then(staffs => this.staffs = staffs)
  }

  @action async loadInspectStatistics(divisionCode: string, startDate: number, endDate: number) {
    const eventsDetail = await getEventsDetail(divisionCode, startDate, endDate)
    if (eventsDetail == null || eventsDetail.length < 3) {
      return
    }
    const watering = await getEventByTag(divisionCode, "道路洒水", startDate, endDate)
    this.inspectStatistics = {
      totalEvents: eventsDetail[0].number,
      disposedEvents: eventsDetail[1].number,
      totalWorks: eventsDetail[2].number,
      watering: (watering && watering.length > 0) ? watering[0].number : 0,
    }
  }

  needLoadDivisionGoal = () => {
    const now = moment(new Date())
    return this.divisionGoal == null || now.isAfter(this.divisionGoal.endTime)
  }

  @action async loadDivisionGoal() {
    if (this.needLoadDivisionGoal()) {
      this.divisionGoal = await getGoalsByPeriod('WEEK')
    }
  }

  @action async selectMarker(markerId: number | undefined) {
    if (markerId === undefined) {
      this.drawerStatus.clickLocation = undefined
      this.selectedMarker = {}
      return
    }
    for (const key in MARKER_TYPE_SUFFIX_MAP) {
      if (MARKER_TYPE_SUFFIX_MAP.hasOwnProperty(key)) {
        const suffix = MARKER_TYPE_SUFFIX_MAP[key];
        if ((markerId - suffix) % 10 === 0) {
          this.selectedMarker = {
            markerId: markerId,
            id: (markerId - suffix) / 10,
            // @ts-ignore
            type: key
          }
          break
        }
      }
    }
    if (this.selectedMarker.type == 'Site' && this.selectedSite != null) {
      this.drawerStatus.clickLocation = {
        longitude: this.selectedSite.location.longitude,
        latitude: this.selectedSite.location.latitude
      };
    }
    if (this.selectedMarker.type == 'Staff' && this.selectedStaff != null) {
      const staff = this.selectedStaff
      let response = await getAddressByLocationFromTencentMap(staff.location.latitude, staff.location.longitude);
      this.currentStaffAddress = response.data.result.address;
      let currentLocaltion = await getLocation()
      let distanceResponse = calculateDistance(staff.location, currentLocaltion);

      this.currentStaffDistance = distanceResponse
    }
  }

  @action updateDrawerStatus(status: DrawerStatus) {
    this.drawerStatus = status
  }

  @computed get alarmSiteMarkers(): marker[] {
    if (this.alarmSite == null) {
      return []
    }

    return this.alarmSite.map(site => {
      const factorValue = this.getAlarmSiteFactorValue(site.code, this.currentAlarmFactor);
      const markerId = site.id * 10 + MARKER_TYPE_SUFFIX_MAP.Site;
      const selected = false;

      return {
        id: markerId,
        title: "",
        latitude: site.location != null ? site.location.latitude : 0,
        longitude: site.location != null ? site.location.longitude : 0,
        width: 10,
        height: 10,
        iconPath: parsePollutantImageByLevel(selected, false, factorValue, this.drawerStatus.factorCode),
        callout: {
          content: isNaN(factorValue) ? "--" : "" + factorValue,
          color: "#ffffff",
          fontSize: 9,
          borderRadius: 5,
          bgColor: selected ? "#1091FF" : getValueColor(this.drawerStatus.factorCode, factorValue),
          display: "ALWAYS",
          borderWidth: 0,
          borderColor: '#FFFFFF',
          padding: 5,
          textAlign: 'center'
        }
      }
    })
  }

  @computed get siteMarkers(): marker[] {
    if (!this.drawerStatus.site || this.sites == null) {
      return []
    }

    return this.sites.filter(site => {
      if (this.drawerStatus.selectSiteTypes.length == 0) {
        return true;
      }
      if (this.drawerStatus.selectSiteTypes.includes(site.siteType)) {
        return true;
      }
      return false;
    }).map(site => {
      const factorValue = this.getSiteFactorValue(site.code, this.drawerStatus.factorCode);
      const markerId = site.id * 10 + MARKER_TYPE_SUFFIX_MAP.Site;
      const selected = markerId === this.selectedMarker.markerId;

      return {
        id: markerId,
        title: "",
        latitude: site.location != null ? site.location.latitude : 0,
        longitude: site.location != null ? site.location.longitude : 0,
        width: 13,
        height: 13,
        iconPath: parsePollutantImageByLevel(selected, site.examineSite, factorValue, this.drawerStatus.factorCode),
        callout: {
          content: isNaN(factorValue) ? "--" : "" + factorValue,
          color: "#ffffff",
          fontSize: site.examineSite ? 14 : 12,
          borderRadius: site.examineSite ? 4 : 10,
          bgColor: selected ? "#1091FF" : getValueColor(this.drawerStatus.factorCode, factorValue),
          display: "ALWAYS",
          borderWidth: 0,
          borderColor: '#FFFFFF',
          padding: selected ? 12 : 8,
          textAlign: 'center'
        }
      }
    })
  }

  @computed get examSiteMarkers(): marker[] {
    if (!this.drawerStatus.site || this.sites == null) {
      return []
    }

    return this.sites.filter(site => {
      if (!site.examineSite) {
        return false
      }
      return true;
    }).map(site => {
      const factorValue = this.getSiteFactorValue(site.code, this.drawerStatus.factorCode);
      const markerId = site.id * 10 + MARKER_TYPE_SUFFIX_MAP.Site;
      const selected = false;

      return {
        id: markerId,
        title: "",
        latitude: site.location != null ? site.location.latitude : 0,
        longitude: site.location != null ? site.location.longitude : 0,
        width: 13,
        height: 13,
        iconPath: parsePollutantImageByLevel(selected, site.examineSite, factorValue, this.drawerStatus.factorCode),
        callout: {
          content: isNaN(factorValue) ? "--" : "" + factorValue,
          color: "#ffffff",
          fontSize: site.examineSite ? 14 : 12,
          borderRadius: site.examineSite ? 4 : 10,
          bgColor: selected ? "#1091FF" : getValueColor(this.drawerStatus.factorCode, factorValue),
          display: "ALWAYS",
          borderWidth: 0,
          borderColor: '#FFFFFF',
          padding: selected ? 12 : 8,
          textAlign: 'center'
        }
      }
    })
  }

  @computed get inspectMarkers(): marker[] {
    if (!this.drawerStatus.pollutionType || this.inspects == null) {
      return []
    }
    return this.inspects.filter(inspect => {
      if (inspect.type == "PATROL") {
        return false;
      }
      if (this.drawerStatus.selectPollutionTypeIds.length == 0) {
        return true;
      }
      return this.drawerStatus.selectPollutionTypeIds.includes(inspect.pollutionTypeId);

    }).map(inspect => {
      const markerId = inspect.id * 10 + MARKER_TYPE_SUFFIX_MAP.Inspect
      const isHasdone = inspect.status;
      const selected = markerId === this.selectedMarker.markerId
      return {
        "id": markerId,
        "title": "",
        "latitude": inspect.latitude,
        "longitude": inspect.longitude,
        "width": (selected ? 50 : 36),
        "height": (selected ? 50 : 36),
        "iconPath": (selected ? require('../assets/dispatch/event_click.png') : isHasdone ? require('../assets/dispatch/event_has_done.png') : require('../assets/dispatch/event_normal.png'))

      }
    })
  }

  @computed get allInspectMarkers(): marker[] {
    return (this.inspects || []).filter(inspect => inspect.type === 'INCIDENT').map(inspect => {
      const markerId = inspect.id * 10 + MARKER_TYPE_SUFFIX_MAP.Inspect
      const isHasdone = inspect.status;
      const selected = markerId === this.selectedMarker.markerId
      return {
        "id": markerId,
        "title": "",
        "latitude": inspect.latitude,
        "longitude": inspect.longitude,
        "width": (selected ? 50 : 36),
        "height": (selected ? 50 : 36),
        "iconPath": (selected ? require('../assets/dispatch/event_click.png') : isHasdone ? require('../assets/dispatch/event_has_done.png') : require('../assets/dispatch/event_normal.png'))
      }
    })
  }

  parsePollutantSourceIconByType = (typeId: number, selected: boolean) => {

    switch (typeId) {
      case 1:
        return selected ? require('../assets/pollutant_source/daoluyangchen-select.png') : require('../assets/pollutant_source/daoluyangchen.png');
      case 2:
        return selected ? require('../assets/pollutant_source/gongdiyangchen-select.png') : require('../assets/pollutant_source/gongdiyangchen.png');
      case 3:
        return selected ? require('../assets/pollutant_source/canyinyouyan-select.png') : require('../assets/pollutant_source/canyinyouyan.png');
      case 4:
        return selected ? require('../assets/pollutant_source/gongyewuran-select.png') : require('../assets/pollutant_source/gongyewuran.png');
      case 5:
        return selected ? require('../assets/pollutant_source/sanluanwuqiye-select.png') : require('../assets/pollutant_source/sanluanwuqiye.png');
      case 6:
        return selected ? require('../assets/pollutant_source/daoluyidong-select.png') : require('../assets/pollutant_source/daoluyidong.png');
      case 7:
        return selected ? require('../assets/pollutant_source/feidaoluyidong-select.png') : require('../assets/pollutant_source/feidaoluyidong.png');
      default:
        return selected ? require('../assets/pollutant_source/xiaoqusanluanwu-select.png') : require('../assets/pollutant_source/xiaoqusanluanwu.png');
    }
  }

  @computed get pollutionSourceMarkers(): marker[] {
    if (!this.drawerStatus.pollution || this.pollutionSources == null) {
      return []
    }
    return this.pollutionSources.filter(source => {
      if (this.drawerStatus.selectPollutionSourceTypeIds.length == 0) {
        return true;
      }
      return this.drawerStatus.selectPollutionSourceTypeIds.includes(source.pollutionSourceTypeId);
    })
      .map(source => {
        const markerId = source.id * 10 + MARKER_TYPE_SUFFIX_MAP.PollutionSource
        const selected = markerId === this.selectedMarker.markerId
        return {
          "id": markerId,
          "title": "",
          "latitude": source.latitude,
          "longitude": source.longitude,
          "width": (selected ? 44 : 28),
          "height": (selected ? 44 : 28),
          "iconPath": this.parsePollutantSourceIconByType(source.pollutionSourceTypeId, selected)
        }
      })
  }

  @computed get alarmPollutionSourceMarkers(): marker[] {
    if (this.alarmPollutionSources == null) {
      return []
    }
    return this.alarmPollutionSources.map(source => {
      const markerId = source.id * 10 + MARKER_TYPE_SUFFIX_MAP.PollutionSource
      const selected = false
      return {
        "id": markerId,
        "title": "",
        "latitude": source.latitude,
        "longitude": source.longitude,
        "width": (selected ? 44 : 28),
        "height": (selected ? 44 : 28),
        "iconPath": this.parsePollutantSourceIconByType(source.pollutionSourceTypeId, selected)
      }
    })
  }

  @computed get staffMarkers(): marker[] {
    if (!this.drawerStatus.staffPosition || this.staffs == null) {
      return []
    }
    return this.staffs.filter(staff => staff.id != this.drawerStatus.currentUserId).map(staff => {
      const markerId = staff.id * 10 + MARKER_TYPE_SUFFIX_MAP.Staff
      const selected = markerId === this.selectedMarker.markerId
      return {
        "id": markerId,
        "title": "",
        "latitude": staff.location.latitude,
        "longitude": staff.location.longitude,
        "width": (selected ? 50 : 36),
        "height": (selected ? 50 : 36),
        "iconPath": (selected ? require("../assets/dispatch/person_point_active.png") : require("../assets/dispatch/person_point.png"))
      }
    })
  }

  @computed get isMarkerSelected(): boolean {
    return this.selectedMarker.id !== undefined
  }
  @computed get isSiteSelected(): boolean {
    return this.selectedMarker.type === 'Site'
  }
  @computed get isInspectSelected(): boolean {
    return this.selectedMarker.type === 'Inspect'
  }
  @computed get isPollutionSourceSelected(): boolean {
    return this.selectedMarker.type === "PollutionSource"
  }
  @computed get isStaffSelected(): boolean {
    return this.selectedMarker.type === 'Staff'
  }

  @computed get selectedSiteMonitorData(): SiteMonitorData | undefined {
    return this.selectedSite && this.siteMonitorDataMap.get(this.selectedSite.code)
  }

  @computed get selectedSite(): Site | undefined {
    return this.getSelectedMarkerItem(this.sites, 'Site')
  }

  @computed get selectedInspect(): Inspect | undefined {
    return this.getSelectedMarkerItem(this.inspects, 'Inspect')
  }

  @computed get selectedPollutionSource(): PollutionSource | undefined {
    return this.getSelectedMarkerItem(this.pollutionSources, 'PollutionSource')
  }

  @computed get selectedStaff(): Staff | undefined {
    return this.getSelectedMarkerItem(this.staffs, 'Staff')
  }

  getSelectedMarkerItem<T extends { id: number }>(items: T[], type: MarkerType): T | undefined {
    if (items == null || !this.isMarkerSelected || this.selectedMarker.type != type) {
      return undefined;
    }
    for (const item of items) {
      if (item.id === this.selectedMarker.id) {
        return item
      }
    }
  }

  getSiteFactorValue = (siteCode: string, factorCode: string) => {
    const data = this.siteMonitorDataMap && this.siteMonitorDataMap.get(siteCode)
    return data && data.datas[getFactorDataKey(factorCode)]
  }

  getAlarmSiteFactorValue = (siteCode: string, factorCode: string) => {
    const data = this.alarmSiteMonitorDataMap && this.alarmSiteMonitorDataMap.get(siteCode)
    return data && data.datas[getFactorDataKey(factorCode)]
  }

  @computed get controlAreas() {
    const json = this.remind && this.remind.controlAreaJson.controlAreaJson
    if (json == null || json.features == null) {
      return []
    }
    const maxValue = json.features.filter(feature => feature.properties).map(feature => feature.properties.factors.value).reduce(function (a, b) {
      return b > a ? b : a;
    }, 0);
    return json.features.filter(feature => feature.properties).map(feature => ({
      points: feature.geometry.coordinates[0].map(item => {
        return item[0] > item[1] ? { latitude: item[1], longitude: item[0] } : { latitude: item[0], longitude: item[1] }
      }),
      strokeWidth: 0,
      strokeColor: "#FFFFFF00",
      fillColor: getFillColorByValue(feature.properties.factors.value, maxValue)
    }))
  }

  //定位显示当前1,2,3KM 范围
  @computed get positionCurrentLocation() {
    let currentLocation = this.drawerStatus.clickLocation;
    if (currentLocation == undefined || !this.drawerStatus.enableShowRadius) {
      return []
    }
    let circles: number[] = [1, 2, 3];
    return circles.map(circle => ({
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      color: "#1091FFCC",
      fillColor: "#1091FF0c",
      radius: circle * 1000,
      strokeWidth: 2
    }))
  }

  @computed get positionCurrentLocationMarker(): marker[] {

    let currentLocation = this.drawerStatus.clickLocation;
    if (currentLocation == undefined || !this.drawerStatus.enableShowRadius) {
      return []
    }
    let circles: number[] = [1, 2, 3];
    return circles.map(circle => {
      return {
        id: 10000 * circle,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude + circle * (1000 / 25.2 / 3600),
        title: circle + "KM",
        callout: {
          content: circle + "KM",
          color: "#ffffff",
          fontSize: 12,
          borderRadius: 4,
          bgColor: "#101F427F",
          display: "ALWAYS",
          borderWidth: 0,
          borderColor: '#FFFFFF',
          padding: 6,
          textAlign: 'center',
        },
        iconPath: rootSourceBaseUrl + `/assets/task_dispatch/examine_level_0.png`,
        width: 2,
        height: 2
      }
    })
  }
}

export default new DispatchStore()