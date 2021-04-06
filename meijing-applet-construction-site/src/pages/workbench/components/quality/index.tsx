import Taro, { Component } from "@tarojs/taro";
import { View, Text } from "@tarojs/components";
import { getHourLevel, getHourLevelTitle } from '../../../../common/utils/monitor'
import "./index.scss";
import moment from "moment";

interface QualityProps {
    airQuality: any
}

interface QualityState {
}

interface PollutantCode {
    name: string,
    code: string
}

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
];

export default class Quality extends Component<QualityProps, QualityState>{
    constructor(props) {
        super(props);
        this.state = {}
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

    parseValue(value: number, type: string) {
        if (type == "V_a21005") {
            return value.toFixed(1);
        } else {
            return Math.floor(value);
        }
    }

    render() {
        const { airQuality={} } = this.props;

        let aqiValueStyle: string = this.parseTitleColorByValue(airQuality.datas ? airQuality.datas.aqi : 0);

        return (
            <View className="numberical">
                <View className="numberical-left">
                    <View className="aqi">
                        <Text className="aqi-number">{airQuality.datas && airQuality.datas.aqi}</Text>
                        <Text>AQI</Text>
                    </View>
                    <Text className={`pollution-deep ${aqiValueStyle}`}>{airQuality.datas ? getHourLevelTitle(airQuality.datas.aqi) : "--"}</Text>
                </View>
                <View className="numberical-right">
                    <View className="time">{airQuality.modifyTime && moment(airQuality.modifyTime).format("YYYY/M/DD HH:mm")}</View>
                    <ul className="types">
                        {
                            pollutantCodes.map((res: PollutantCode) => (
                                <li key={res.code}>
                                    <View className="type-number">{airQuality && airQuality.datas && airQuality.datas[res.code] ? this.parseValue(airQuality.datas[res.code], res.code) : '--'}</View>
                                    <View className="type-name">{res.name}</View>
                                </li>
                            ))
                        }
                    </ul>
                </View>
            </View>
        )
    }
}