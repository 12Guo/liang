import Taro from '@tarojs/taro'
import { AtSwitch } from 'taro-ui'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import { rootSourceBaseUrl } from '@common/utils/requests'
import { PollutantType, SiteType } from '../../service/pollutant'
import './DispatchDrawer.scss'
const map_radius = rootSourceBaseUrl + "/assets/task_dispatch/radius.png";
const current_road = rootSourceBaseUrl + "/assets/task_dispatch/current_road.png";
const monitor_point = rootSourceBaseUrl + "/assets/task_dispatch/monitor_point.png";
const pollutant_company = rootSourceBaseUrl + "/assets/task_dispatch/pollutant_company.png";
const pollutant_event = rootSourceBaseUrl + "/assets/task_dispatch/pollutant_event.png";
const person_location = rootSourceBaseUrl + "/assets/task_dispatch/person_location.png";
//选择
const map_selected = rootSourceBaseUrl + "/assets/task_dispatch/map_selected.png";

//地图类型
const MAP_TYPE = [
  {
    "code": "COMMON",
    "url": rootSourceBaseUrl + "/assets/task_dispatch/map_common.png",
    "name": "标准地图"
  },
  {
    "code": "SATELLITE",
    "url": rootSourceBaseUrl + "/assets/task_dispatch/map_satellite.png",
    "name": "卫星图"
  },
  {
    "code": "3D",
    "url": rootSourceBaseUrl + "/assets/task_dispatch/3d.png",
    "name": "3D图"
  }
]

export interface Status {
  site: boolean;
  pollution: boolean;
  roadCondition: boolean;
  staffPosition: boolean;
  factorCode: string;
  selectPollutionTypeIds: number[];
  selectPollutionSourceTypeIds: number[];
  selectSiteTypes: number[];
  pollutionType: boolean;
  mapType: string,
  enableShowRadius: boolean
}
interface Props {
  show: boolean;
  pollutionTypes: PollutantType[];
  pollutantSourceTypes: PollutantType[];
  stationTypes: SiteType[];
  onClose: () => void;
  status: Status;
  onPollutantTypeChange: (selectPollutionTypeIds: number[]) => void;
  onPollutantSourceTypeChange: (selectPollutionTypeIds: number[]) => void;
  onSiteTypeChange: (selectSiteTypeIds: number[]) => void;
  onStatusChange: (status: Status) => void;
}

export default class DispatchDrawer extends Taro.Component<Props> {
  static defaultProps = {
    status: {
      site: true,
      pollution: true,
      roadCondition: true,
      staffPosition: true,
      factorCode: 'a34004',
      selectPollutionTypeIds: [],
      selectPollutionSourceTypeIds: [],
      pollutantSourceTypes: [],
      selectSiteTypes: [],
      pollutionType: true
    }
  }

  onPollutionTypeClick = (pollutantType: PollutantType) => {
    const { status, onStatusChange } = this.props
    let selectTypes: number[];
    if (status.selectPollutionTypeIds) {
      if (status.selectPollutionTypeIds.includes(pollutantType.id)) {
        selectTypes = status.selectPollutionTypeIds.filter((typeId) => typeId != pollutantType.id)
      } else {
        selectTypes = [...status.selectPollutionTypeIds, pollutantType.id]
      }
    } else {
      selectTypes = [pollutantType.id]
    }
    this.props.onPollutantTypeChange(selectTypes);
    onStatusChange({ ...status, selectPollutionTypeIds: selectTypes })
  }

  onPollutionSourceTypeClick = (pollutantType: PollutantType) => {
    const { status, onStatusChange } = this.props
    let selectTypes: number[];
    if (status.selectPollutionSourceTypeIds) {
      if (status.selectPollutionSourceTypeIds.includes(pollutantType.id)) {
        selectTypes = status.selectPollutionSourceTypeIds.filter((typeId) => typeId != pollutantType.id)
      } else {
        selectTypes = [...status.selectPollutionSourceTypeIds, pollutantType.id]
      }
    } else {
      selectTypes = [pollutantType.id]
    }
    this.props.onPollutantSourceTypeChange(selectTypes);
    onStatusChange({ ...status, selectPollutionSourceTypeIds: selectTypes })
  }

  onSiteTypeClick = (siteType: SiteType) => {
    const { status, onStatusChange } = this.props
    let selectTypes: number[];
    if (status.selectSiteTypes) {
      if (status.selectSiteTypes.includes(siteType.id)) {
        selectTypes = status.selectSiteTypes.filter((typeId) => typeId != siteType.id)
      } else {
        selectTypes = [...status.selectSiteTypes, siteType.id]
      }
    } else {
      selectTypes = [siteType.id]
    }
    this.props.onSiteTypeChange(selectTypes);
    onStatusChange({ ...status, selectSiteTypes: selectTypes })
  }

  onMoveHandle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  onChangeMap(mapType: string) {
    const { status, onStatusChange } = this.props
    status.mapType = mapType;
    onStatusChange({ ...status })
  }

  render() {
    const { status, onStatusChange, pollutionTypes = [] ,pollutantSourceTypes = [],stationTypes= []} = this.props
    return (
      <View className='drawer_container' onTouchMove={this.onMoveHandle}>
        <ScrollView
          className='scrollview'
          scrollY
          scrollWithAnimation
        >
          <View className="tip">地图选择</View>
          <View className="control_map_group">
            <View className="image_group">
              {
                MAP_TYPE.map((mapType) => {
                  return (
                    <View key={mapType.code} className="image_item" onClick={this.onChangeMap.bind(this, mapType.code)}>
                      <Image className="image" src={mapType.url}></Image>
                      {status.mapType == mapType.code && <Image className="select_icon" src={map_selected}></Image>}
                      <Text className="name">{mapType.name}</Text>
                    </View>
                  )
                })
              }
            </View>
          </View>
          <View className="tip">图层选择</View>
          <View className="control_item">
            <Image className="control_image" src={monitor_point} />
            <Text className="control_item_title">监测点位</Text>
            <AtSwitch className="control_item_switch" title="" checked={status.site} border={false} onChange={(val) => onStatusChange({ ...status, site: val })} />
          </View>
          {status.site &&
            <View className="factor_group">
              {
                stationTypes.map((siteType) => {
                  return (
                    <View key={siteType.id} className={`content ${status.selectSiteTypes.includes(siteType.id) ? 'active' : ''}`}>
                      <Text className="factor_item" onClick={this.onSiteTypeClick.bind(this, siteType)}>{siteType.name}</Text>
                    </View>
                  )
                })
              }
            </View>}
          <View className="divider"></View>
          <View className="control_item">
            <Image className="control_image" src={pollutant_company} />
            <Text className="control_item_title">污染源</Text>
            <AtSwitch className="control_item_switch" title="" checked={status.pollution} border={false} onChange={(val) => onStatusChange({ ...status, pollution: val })} />
          </View>
          {status.pollution &&
            <View className="polltant_event_group">
              {pollutantSourceTypes.map((sourceType: PollutantType) =>
                <View key={sourceType.id} className={`event_tag ${status.selectPollutionSourceTypeIds.indexOf(sourceType.id) != -1 ? 'active' : ''}`}>
                  <Text className="event_title" onClick={this.onPollutionSourceTypeClick.bind(this, sourceType)}>{sourceType.name}</Text>
                </View>
              )}
            </View>
          }
          <View className="divider"></View>
          <View className="control_item">
            <Image className="control_image" src={pollutant_event} />
            <Text className="control_item_title">污染事件</Text>
            <AtSwitch className="control_item_switch" title="" checked={status.pollutionType} border={false} onChange={(val) => onStatusChange({ ...status, pollutionType: val })} />
          </View>
          {status.pollutionType &&
            <View className="polltant_event_group">
              {pollutionTypes.map((pollutantType: PollutantType) =>
                <View key={pollutantType.id} className={`event_tag ${status.selectPollutionTypeIds.indexOf(pollutantType.id) != -1 ? 'active' : ''}`}>
                  <Text className="event_title" onClick={this.onPollutionTypeClick.bind(this, pollutantType)}>{pollutantType.name}</Text>
                </View>
              )}
            </View>
          }
          <View className="divider"></View>
          <View className="control_item">
            <Image className="control_image" src={person_location} />
            <Text className="control_item_title">人员位置</Text>
            <AtSwitch className="control_item_switch" title="" checked={status.staffPosition} border={false} onChange={(val) => onStatusChange({ ...status, staffPosition: val })} />
          </View>
          <View className="divider"></View>
          <View className="control_item">
            <Image className="control_image" src={current_road} />
            <Text className="control_item_title">实时路况</Text>
            <AtSwitch className="control_item_switch" title="" checked={status.roadCondition} border={false} onChange={(val) => onStatusChange({ ...status, roadCondition: val })} />
          </View>
          <View className="divider"></View>
          <View className="tip">其他</View>
          <View className="control_item">
            <Image className="control_image" src={map_radius} />
            <Text className="control_item_title">站点1,2,3 Km标线</Text>
            <AtSwitch className="control_item_switch" title="" checked={status.enableShowRadius} border={false} onChange={(val) => onStatusChange({ ...status, enableShowRadius: val })} />
          </View>
          <View className="space_view"></View>
        </ScrollView>
      </View>
    )
  }
}