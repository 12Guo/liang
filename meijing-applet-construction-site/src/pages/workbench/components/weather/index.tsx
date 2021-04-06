import Taro, { Component } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { rootResearchWebSourceBaseUrl } from '@common/utils/requests';
import { weather_map, wind_map } from "@common/utils/common"
import "./index.scss";

interface WeatherProps {
    weatherInfo: any
}

interface WeatherState {

}

export default class Weather extends Component<WeatherProps, WeatherState> {
    constructor() {
        super(...arguments);
    }

    render(){
        const {temperature="-", weatherText="-", wind="-", windSpeed="-"} = this.props.weatherInfo || {};

        const weatherMapInfo = weather_map.filter(item => item.name === weatherText)[0];
        const windSpeedNum = windSpeed.replace("米/秒", "");
        const windLevel = wind_map.find(item => item.max >= windSpeedNum);

        return (
            <View className="weather-info">
                <View className="weather-left">
                    {
                        weatherMapInfo && <Image src={rootResearchWebSourceBaseUrl + weatherMapInfo.url} className="weather-img"></Image>
                    }                   
                    <Text className="weather-du">{temperature} {weatherText}</Text>
                </View>
                <View className="weather-right">
                    <Text className="weather-name">{wind}</Text>
                    <Text className="weather-number">{windLevel.name}</Text>
                </View>
            </View>
        )
    }
}
