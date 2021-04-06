import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import './index.scss'
import { rootConstructionSourceBaseUrl, rootSourceBaseUrl } from '@common/utils/requests';
import Weather from "./components/weather";
import Quality from "./components/quality";
import { getWeather, getControlProposal, getDivisionExamineSites } from "../../service/workbench";
import { getDivisionMonitorData } from "../../service/pollutant";
import { formatSplitString, calcDistance, transformXY } from "@common/utils/common";
import { listSites } from '../../service/alarm'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty';

const video = `${rootConstructionSourceBaseUrl}/assets/pages/work/video.png`
const inspection_report = `${rootConstructionSourceBaseUrl}/assets/pages/work/inspection_report.png`
const record = `${rootConstructionSourceBaseUrl}/assets/pages/work/record.png`
const supervise = `${rootConstructionSourceBaseUrl}/assets/pages/work/supervise.png`;
// 影响分析
const yingxiang = rootSourceBaseUrl + "/assets/discovery/yingxiang.png";
// 异常预警
const alarmUrl = rootSourceBaseUrl + "/assets/discovery/alarm.png";

// 调度响应
const dispatch = rootConstructionSourceBaseUrl + "/assets/pages/green-construction/dispatch.png";
// 地图
const radarMap = rootConstructionSourceBaseUrl + "/assets/pages/green-construction/icon-radar.png";
const monitor = `${rootConstructionSourceBaseUrl}/assets/pages/work/monitor.png`

interface WorkBenchProps {
  userStore: any;
}

interface WorkBenchState {
  list: ListType[],
  weatherInfo: {    // 天气信息
    aqiLevel: string
    temperature: string
    weatherText: string
    wind: string
    windSpeed: string
  },
  airQuality: {},     // 空气质量（以后换接口）
  controlProposalText: string;  // 管控建议
  windDirection: string;  // 风向的英文名
  dotPosition: any[]  // 站点定位
}

interface ListType {
  title: string,
  options: OptionsType[]
}

interface OptionsType {
  img: any,
  txt: string,
  path?: string
}
interface WindSector {
  width: string;
  height: string;
  left: string;
  top: string
}

@inject('userStore')
@observer
export default class Workbench extends Component<WorkBenchProps, WorkBenchState> {

  constructor(props) {
    super(props)
    this.state = {
      list: [
        {
          title: '实时监测',
          options: [{
            img: video,
            txt: '视频哨兵',
            path: '/pages/device/video'
          }, {
            img: monitor,
            txt: '在线监测',
            path: '/pages/device/detail'
          }
          ]
        },
        {
          title: '日常工作',
          options: [{
            img: inspection_report,
            txt: '自查上报',
            path: '/pages/work_options/inspection_report'
          },
          {
            img: supervise,
            txt: '督察整改',
            path: '/pages/supervise/index?nameType=inspect'
          },
          {
            img: alarmUrl,
            txt: '异常预警',
            path: '/pages/pollution-manage/question?source=AbnormalWarning'
          },
          // {
          //   img: dispatch,
          //   txt: '调度响应',
          //   path: '/pages/dispatch/dispatch_list'
          // },
          {
            img: record,
            txt: '工地档案',
            path: '/pages/pollution-manage/detail?id=' + get(props, 'userStore.userDetails.pollutionSourceInfo.pollutionSourceId')
          }
          ]
        },
        {
          title: '研判分析',
          options: [{
            img: yingxiang,
            txt: '影响分析',
            path: '/pages/impact_analysis/index'
          }
          ]
        }
      ],
      weatherInfo: {
        aqiLevel: "-",
        temperature: "-℃",
        weatherText: "-",
        wind: "-",
        windSpeed: "-米/秒"
      },
      airQuality: {},
      controlProposalText: "",
      windDirection: "",
      dotPosition: []
    }
  }

  config: Config = {
    navigationBarTitleText: '工作台',
    enablePullDownRefresh: true
  }

  onNavigateTo(path) {
    Taro.navigateTo({
      url: path
    });
  }

  componentDidShow() {
    this.getWeatherInfo();
    this.getAirQuality();
    this.getControlProposal();
    this.setMonitorPath()
    this.resetPath()
  }

  resetPath = () => {
    const { list } = this.state
    const { userStore: { userDetails } } = this.props
    list[1].options[3].path = '/pages/pollution-manage/detail?id=' + get(userDetails, 'pollutionSourceInfo.pollutionSourceId')
    this.setState({ list })
  }

  setMonitorPath = () => {
    const { userStore: { userDetails } } = this.props
    listSites(userDetails.tenant.code).then(res => {
      if (isEmpty(get(res, 'data', []))) {
        const { list } = this.state
        list[0].options[1].path = '/pages/device/nodata'
        this.setState({ list })
      }
    })
  }

  onPullDownRefresh() {
    this.getAirQuality();
    Taro.stopPullDownRefresh()
  }

  // 获取空气质量信息
  async getAirQuality() {
    const airQualityInfo = await getDivisionMonitorData(this.props.userStore.userDetails.pollutionSourceInfo.divisionCode);
    this.setState({
      airQuality: airQualityInfo
    });
  }

  // 获取天气以及附近站点信息
  async getWeatherInfo() {
    try {
      const { location } = this.props.userStore.userDetails.pollutionSourceInfo;
      const center = {
        lat: location.latitude,
        lng: location.longitude
      }

      const dotPosition = await this.getdivisionExamineSites(center);
      const weatherInfoRes = await getWeather(location);
      this.setState({
        weatherInfo: weatherInfoRes.data,
        windDirection: this.windDirectionTransform(weatherInfoRes.data.wind),
        dotPosition: dotPosition
      })
    } catch (err) {
      console.log(err, "错误信息")
    }
  }

  // 获取管控建议
  async getControlProposal() {
    const controlProposal = await getControlProposal();
    this.setState({
      controlProposalText: formatSplitString(controlProposal.data, 65)
    });
  }

  // 风向汉字转为英文
  windDirectionTransform(windDirection) {
    console.log(windDirection, "windDirection")
    let newWindDirection = "";
    switch (windDirection) {
      case '北风':
        newWindDirection = "north"; break;
      case '东北风':
        newWindDirection = "east-north"; break;
      case '东风':
        newWindDirection = "east"; break;
      case '东南风':
        newWindDirection = "east-south"; break;
      case '南风':
        newWindDirection = "south"; break;
      case '西南风':
        newWindDirection = "west-south"; break;
      case '西风':
        newWindDirection = "west"; break;
      case '西北风':
        newWindDirection = "west-north"; break;
    }
    return newWindDirection;
  }

  // 风级转换为雷达图上显示
  windSpeedToCXYS(windSpeed) {
    const windSpeedNum = windSpeed.replace("米/秒", "");
    let windSector: WindSector;
    if (windSpeedNum < 6) {
      const windyRadus = 50 * windSpeedNum / 6;
      windSector = {
        width: windyRadus + "%",
        height: windyRadus + "%",
        left: 50 - windyRadus / 2 + "%",
        top: 50 - windyRadus / 2 + "%"
      }
    } else {
      windSector = {
        width: "78%",
        height: "78%",
        left: "11%",
        top: "11%"
      }
    }
    return windSector
  }

  // 获取附近站点位置
  async getdivisionExamineSites(center) {
    const divisionExamine = await getDivisionExamineSites(this.props.userStore.userDetails.pollutionSourceInfo.divisionCode);
    const distance = calcDistance(center, divisionExamine.data);
    const CXYS = transformXY(distance);
    return CXYS.map(item => {
      let x = Math.round(item.x * 9 / 1000 - 3);
      let y = Math.round(-3 - item.y * 9 / 1000);

      let marginLeft = 0;
      let marginTop = 0;

      if (x > -30 && x < 30) {
        marginLeft = x;
      } else if (x > 30) {
        marginLeft = 30;
      } else {
        marginLeft = -30
      }

      if (y > -30 && y < 30) {
        marginTop = y;
      } else if (y > 30) {
        marginTop = 30;
      } else {
        marginTop = -30
      }

      return {
        marginLeft: marginLeft + "px",
        marginTop: marginTop + "px"
      }
    })
  }

  jumpToImpactAnalysis() {
    Taro.navigateTo({
      url: "/pages/impact_analysis/index"
    });
  }

  render() {
    const { list, weatherInfo, controlProposalText, windDirection, dotPosition, airQuality } = this.state;

    return (
      <View className="work-page">
        <View className="work-details">
          {
            airQuality && <Quality airQuality={airQuality}></Quality>
          }
          <Weather weatherInfo={weatherInfo} />
          <View className="weather-detail">
            {/* 最多65个子 */}
            <View className="detail-text" onClick={this.jumpToImpactAnalysis}>
              {controlProposalText}
              <View className="more">更多&gt;</View>
            </View>
            <View className="radar-box">
              <Image className="radar-map" src={radarMap}></Image>
              <View className="radar-overflow" style={this.windSpeedToCXYS(weatherInfo.windSpeed)}>
                {
                  windDirection && <View className={`sactor ${windDirection}`} ></View>
                }
              </View>
              {
                dotPosition.length > 0 && dotPosition.map(item => (
                  <Text className="position-dot dot" style={item}></Text>
                ))
              }
            </View>
          </View>
        </View>
        <View className="select_options">
          {
            list.map((item, index) => {
              return (
                <View key={index}>
                  <View className="title">
                    <Text className="txt1">{item.title}</Text>
                  </View>
                  <View className="options_box">
                    {
                      item.options.map((element, i) => {
                        return (
                          <View className="option_item" key={i} onClick={this.onNavigateTo.bind(this, element.path)}>
                            <Image className="img1" src={element.img}></Image>
                            <Text className="txt2">{element.txt}</Text>
                          </View>
                        )
                      })
                    }
                  </View>
                </View>
              )
            })
          }
        </View>
      </View>
    )
  }
}
