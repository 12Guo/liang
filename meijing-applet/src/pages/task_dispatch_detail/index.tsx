import Taro, { Config } from '@tarojs/taro'
import { ComponentType } from 'react'
import { View, Map, Text, ScrollView, Image } from '@tarojs/components'
import './index.scss'
import { rootSourceBaseUrl } from '@common/utils/requests'
import { getLocation } from '../../service/userDivision'
import moment from 'moment'
import { UserStore } from '@common/store/user';
import { observer, inject } from '@tarojs/mobx';
import { Location } from '../../model'
import { DispatchStore, WeatherData } from '../../store/dispatch'
import { marker } from '@tarojs/components/types/Map'
import { getHourLevel, getHourLevelTitle, getFactorNames } from '@common/utils/monitor'

interface DiscoveryProps {
    userStore: UserStore;
    dispatchStore: DispatchStore;
}

interface DiscoveryState {
    centerLocaltion: Location,
    scrollLeft: number,
    rightTipShow: boolean
}

interface Discovery {
    props: DiscoveryProps,
    state: DiscoveryState
}

interface PollutantCode {
    name: string,
    code: string
}

interface WindType {
    max: number,
    name: string
}

interface WeatherItem {
    code: number,
    url: string
}

const weatherRight = rootSourceBaseUrl + "/assets/task_dispatch_detail/weather_right.png"

const wind_map: WindType[] = [
    {
        name: "0级",
        max: 0.2
    },
    {
        name: "1级",
        max: 1.5
    },
    {
        name: "2级",
        max: 3.3
    },
    {
        name: "3级",
        max: 5.4
    },
    {
        name: "4级",
        max: 7.9
    },
    {
        name: "5级",
        max: 10.7
    },
    {
        name: "6级",
        max: 13.8
    },

    {
        name: "7级",
        max: 17.1
    },
    {
        name: "8级",
        max: 20.7
    },
    {
        name: "9级",
        max: 24.4
    },
    {
        name: "10级",
        max: 28.4
    },
    {
        name: "11级",
        max: 32.6
    },
    {
        name: "12级",
        max: 36.9
    }
];

const weather_map: WeatherItem[] = [
    {
        "code": 0,
        "url": "/assets/task_dispatch_detail/qing.png"
    },
    {
        "code": 1,
        "url": "/assets/task_dispatch_detail/duoyun.png"
    },
    {
        "code": 2,
        "url": "/assets/task_dispatch_detail/yin.png"
    },
    {
        "code": 3,
        "url": "/assets/task_dispatch_detail/zhenyu.png"
    },
    {
        "code": 4,
        "url": "/assets/task_dispatch_detail/leizhenyu.png"
    },
    {
        "code": 6,
        "url": "/assets/task_dispatch_detail/yujiaxue.png"
    },
    {
        "code": 7,
        "url": "/assets/task_dispatch_detail/xiaoyu.png"
    },
    {
        "code": 8,
        "url": "/assets/task_dispatch_detail/zhongyu.png"
    },
    {
        "code": 9,
        "url": "/assets/task_dispatch_detail/dayu.png"
    },
    {
        "code": 10,
        "url": "/assets/task_dispatch_detail/baoyu.png"
    },
    {
        "code": 11,
        "url": "/assets/task_dispatch_detail/dabaoyu.png"
    },
    {
        "code": 12,
        "url": "/assets/task_dispatch_detail/tedabaoyu.png"
    },
    {
        "code": 14,
        "url": "/assets/task_dispatch_detail/xiaoxue.png"
    },
    {
        "code": 15,
        "url": "/assets/task_dispatch_detail/zhongxue.png"
    },
    {
        "code": 16,
        "url": "/assets/task_dispatch_detail/daxue.png"
    },
    {
        "code": 18,
        "url": "/assets/task_dispatch_detail/wu.png"
    },
    {
        "code": 20,
        "url": "/assets/task_dispatch_detail/qiangshachenbao.png"
    },
    {
        "code": 29,
        "url": "/assets/task_dispatch_detail/fuchen.png"
    },
    {
        "code": 30,
        "url": "/assets/task_dispatch_detail/yaochen.png"
    },
    {
        "code": 53,
        "url": "/assets/task_dispatch_detail/mai.png"
    },
]

const pollutantCodes: PollutantCode[] = [
    {
        "code": "V_a34004",
        "name": "PM2.5"
    },
    {
        "code": "V_a34002",
        "name": "PM10"
    },
    {
        "code": "V_a05024",
        "name": "O₃"
    },
    {
        "code": "V_a21004",
        "name": "NO₂"
    },
    {
        "code": "V_a21026",
        "name": "SO₂"
    },
    {
        "code": "V_a21005",
        "name": "CO"
    }
];

@inject('userStore', 'dispatchStore')
@observer
class Discovery extends Taro.Component {

    constructor() {
        super(...arguments)
        this.state = {
            centerLocaltion: {
                longitude: 0,
                latitude: 0
            },
            scrollLeft: 0,
            rightTipShow: true
        }
    }

    config: Config = {
        navigationBarTitleText: '管控建议',
    }

    //通过AQI监测值获取颜色
    parseTitleColorByValue(value: number) {
        let level = getHourLevel("aqi", value);
        if (level <= 5) {
            return ".title_color_level_" + level
        } else {
            return ".title_color_level_5"
        }
    }

    parseWeatherUrlByCode(code: number) {
        let url: string = "";
        for (let index = 0; index < weather_map.length; index++) {
            const element = weather_map[index];
            if (element.code == code) {
                url = element.url;
                break;
            }
        }
        return rootSourceBaseUrl + url;
    }

    parseWindTypeByValue(value: number) {
        let windType = "0级"
        for (let index = 0; index < wind_map.length; index++) {
            const element = wind_map[index];
            if (element.max > value) {
                windType = element.name;
                break;
            }
        }
        return windType;
    }

    //通过监测值解析颜色
    parseColorByValue(value: number, factorDataKey: string) {
        let level = getHourLevel(factorDataKey, value);
        if (level <= 5) {
            return "six_pollutant_title .color_level_" + level
        } else {
            return "six_pollutant_title .color_level_5"
        }
    }

    parseValue(value: number, type: string) {
        if (type == "V_a21005") {
            return value;
        } else {
            return Math.floor(value);
        }
    }

    onTurnLast() {
        this.setState({
            scrollLeft: 1000,
            rightTipShow: false
        })
    }

    onScrollToUpper() {
        this.setState({
            scrollLeft: 0,
            rightTipShow: true
        })
    }

    onShareAppMessage() {
        return {
            title: `管控建议`,
            path: `pages/task_dispatch_detail/index`
        }
    }

    async componentWillMount() {
        const { userStore: { userDetails }, dispatchStore } = this.props
        dispatchStore.loadRoutineDispatch()
        dispatchStore.loadLatestMonitorDatas(userDetails.divisionCode)
        dispatchStore.loadInspects()
        try {
            let localtion: Location = await getLocation();
            if (userDetails.divisionCenterLocation == null) {
                this.setState({
                    centerLocaltion: localtion
                })
            } else {
                this.setState({
                    centerLocaltion: userDetails.divisionCenterLocation
                })
            }
        } catch (error) {
        }
    }

    render() {
        const {
            dispatchStore: {
                remind, controlAreas, siteMarkers, inspectMarkers, pollutionSourceMarkers, staffMarkers
            } } = this.props;
        const { centerLocaltion, scrollLeft, rightTipShow } = this.state;
        const hasMonitorData = remind && remind.airDatas;
        let aqiValueStyle: string = this.parseTitleColorByValue(hasMonitorData ? hasMonitorData.aqi : 0);
        let markerList: marker[] = [...siteMarkers, ...inspectMarkers, ...pollutionSourceMarkers, ...staffMarkers]
        let proposals: string[] = [];
        let weatherDatas = (remind && remind.weatherDatas) ? remind.weatherDatas.data : [];
        if (remind != undefined && remind.controlProposal != null) {
            proposals = remind.controlProposal.split("\r\n");
        }
        let tip = remind ? moment(remind.dataTime).hour() < 12 ? "早间提醒" : "晚间提醒" : ""

        return (
            <View className="root">
                <View className="time">
                    <Text className="content">{remind && moment(remind.dataTime).format("MM月DD日") + tip}</Text>
                </View>
                <View className="body">
                    <View className="head">
                        <View className="air_quality">
                            <Text className="localtion">空气质量状况</Text>
                            <View className="update_time">
                                截止时间: {remind ? moment(remind.dataTime).format("HH:mm") : "--"}
                            </View>
                        </View>
                        <View className="aqi_view">
                            <View className="aqi_view_left">
                                <Text className={`aqi_value ${aqiValueStyle}`}>{hasMonitorData ? hasMonitorData.aqi : "--"}</Text>
                                <Text className="aqi_tip">AQI</Text>
                            </View>
                            <View className="aqi_view_right">
                                <Text className={`pollutant_value ${aqiValueStyle}`}>{hasMonitorData ? getHourLevelTitle(hasMonitorData.aqi) : "--"}</Text>
                                <Text className="primary_pollutant">首污: {hasMonitorData && hasMonitorData.main_pollutants && hasMonitorData.main_pollutants.length > 0 && getFactorNames(hasMonitorData.main_pollutants).join(",") || "--"}</Text>
                            </View>
                        </View>
                        <View className="aqi_value_view">
                            {
                                pollutantCodes.map((res: PollutantCode) => {
                                    let colorStyle: string = this.parseColorByValue(hasMonitorData && hasMonitorData[res.code] ? hasMonitorData[res.code] : 0, res.code)
                                    return (
                                        <View key={res.code} className="value_iteam">
                                            <Text className="six_pollutant_vale">{hasMonitorData && hasMonitorData[res.code] ? this.parseValue(hasMonitorData[res.code], res.code) : '--'}</Text>
                                            <Text className={colorStyle}>{res.name}</Text>
                                        </View>
                                    )
                                })
                            }
                        </View>
                    </View>
                </View>
                <View className="space_wrap"></View>
                <View className="weather">
                    <View className="air_quality">
                        <Text className="localtion">气象形势</Text>
                    </View>
                    <View className="detail">
                        <View className="weather_list">
                            <ScrollView
                                className='scrollview'
                                style={""}
                                onScrollToUpper={this.onScrollToUpper.bind(this)}
                                scrollX
                                scrollLeft={scrollLeft}
                                scrollWithAnimation>
                                <View className="weather_content">
                                    {weatherDatas.map((weather: WeatherData) => {
                                        return (
                                            <View className="weather_item">
                                                <View className="item">
                                                    {moment(weather.dataTime).format("H:mm")}
                                                </View>
                                                <View className="item">
                                                    <Image className="image" src={this.parseWeatherUrlByCode(weather.weather)}></Image>
                                                </View>
                                                <View className="item">
                                                    {`${weather.V_a01001}℃`}
                                                </View>
                                                <View className="item">
                                                    {weather.V_a01008}
                                                </View>
                                                <View className="item">
                                                    {`<${this.parseWindTypeByValue(weather.V_a01007)}`}
                                                </View>
                                            </View>
                                        )
                                    })}
                                </View>
                            </ScrollView>
                            {rightTipShow && <Image className="right_tip" src={weatherRight} onClick={this.onTurnLast.bind(this)}></Image>}
                        </View>
                        <View className="content">
                            {remind && remind.weatherSuggestion}
                        </View>
                    </View>
                </View>
                <View className="space_wrap"></View>
                <View className="control_message">
                    <View className="air_quality">
                        <Text className="localtion">管控建议</Text>
                    </View>
                    <View className="department_item">
                        <View className="detail">
                            {
                                proposals.map((content) => {
                                    return (
                                        <View className="content">
                                            {content.split("\n").map((c) => (<View>{c}</View>))}
                                        </View>
                                    )
                                })
                            }
                        </View>
                    </View>
                </View>
                <View className="space_wrap"></View>
                <View className="map_content">
                    <View className="air_quality">
                        <Text className="localtion">今日热点分布</Text>
                    </View>
                    <Map id="map" scale={13} markers={markerList} polygons={controlAreas} className="map" longitude={centerLocaltion.longitude} latitude={centerLocaltion.latitude} onClick={() => { }} />
                </View>
                <View className="tip_view">
                    *数据仅供参考
                </View>
            </View>
        )
    }

} export default Discovery as ComponentType