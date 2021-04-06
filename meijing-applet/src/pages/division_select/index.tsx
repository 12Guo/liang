import { ComponentType } from "react";
import Taro, { Config } from "@tarojs/taro";
import { rootSourceBaseUrl } from '@common/utils/requests';
import { View, Image, Text, Picker, ScrollView } from "@tarojs/components";
import "./index.scss";
import { getAddressByLocationFromTencentMap } from '@common/utils/mapUtils';
import {
  getLocation,
  getParentsOpenDivision,
  getProvinceAndCityDatas,
  getCountryAndTownDatas
} from "../../service/userDivision";
import { Location } from "../../model";
import { Division, getDivisionLevelCode } from '@common/utils/divisionUtils';
import { navBackWithData } from '@common/utils/common';

interface DivisionSelectProps { }

interface DivisionSelectState {
  selectDivision: Division | null;
  selectCity: Division | null;
  selectCountry: Division | null;
  provinces: Division[];
  provinceCities: Division[];
  cities: { [key: string]: Division[] };
  pickerValues: Division[][];
  countries: Division[];
  selectDivisionList: Division[];
}

interface DivisionSelect {
  props: DivisionSelectProps;
  state: DivisionSelectState;
}

//切换行政区划
const changeDivision =
  rootSourceBaseUrl + "/assets/user_join/change_division.png";
//行政区划为空
const divisionEmpty =
  rootSourceBaseUrl + "/assets/user_join/division_empty.png";
//拨打点哈
const call = rootSourceBaseUrl + "/assets/user_join/call.png";

const defaultDivision: Division = {
  code: "110000000000",
  name: "北京市",
  superiorAccess: false
};

class DivisionSelect extends Taro.Component {
  config: Config = {
    navigationBarTitleText: "选择区域"
  };

  constructor() {
    super(...arguments);
    this.state = {
      selectDivision: null,
      selectCity: null,
      selectCountry: null,
      provinces: [],
      provinceCities: [],
      cities: {},
      pickerValues: [],
      countries: [],
      selectDivisionList: []
    };
  }

  componentWillMount() {
    this.setLocationAddress();
    this.loadProvinceAndCityDatas();
  }

  async loadProvinceAndCityDatas() {
    const { provinces, cities } = this.state;
    let provinceAndCityResp = await getProvinceAndCityDatas();
    let provinceAndCityDatas = provinceAndCityResp.data;
    provinceAndCityDatas
      .filter(division => {
        return division.opened;
      })
      .map(division => {
        provinces.push(division);
        let cityValues: Division[] = division.children;
        cityValues = cityValues.filter(division => {
          return division.opened;
        });
        cities[division.code] = cityValues;
      });
    let divisions: Division[][] = [provinces, cities[provinces[0].code]];
    this.setState({
      pickerValues: divisions,
      provinceCities: cities[provinces[0].code]
    });
  }

  async setLocationAddress() {
    let location: Location;
    try {
      location = await getLocation();
    } catch (error) {
      this.setState({
        selectCity: defaultDivision
      });
      this.selectCity(defaultDivision);
      return;
    }

    let addressResponse = await getAddressByLocationFromTencentMap(
      location.latitude,
      location.longitude
    );
    let currentDivisionCode =
      addressResponse.data.result.address_reference.town.id;
    //由于位置过于偏僻导致腾讯地图逆解析获取不到行政区
    if (currentDivisionCode == null) {
      currentDivisionCode =
        addressResponse.data.result.ad_info.adcode + "000000";
    } else {
      currentDivisionCode += "000";
    }
    let openDivisionResp = await getParentsOpenDivision(currentDivisionCode);
    let openDivision: Division =
      openDivisionResp == null ? null : openDivisionResp.data;
    if (openDivision == null) {
      this.setState({
        selectCity: defaultDivision
      });
    } else {
      let levels = getDivisionLevelCode(openDivision.code);
      if (levels == "CITY") {
        this.selectCity(openDivision);
      } else if (levels == "COUNTY") {
        this.selectCountry(openDivision);
      } else {
        this.selectCity(defaultDivision);
      }
    }
  }

  async onCitySelectChange(event) {
    const { provinceCities } = this.state;
    let cityIndex = event.detail.value[1] == null ? 0 : event.detail.value[1];
    let division: Division = provinceCities[cityIndex];
    this.selectCity(division);
  }

  async selectCity(division: Division) {
    let countryAndTowns = await getCountryAndTownDatas(division.code);
    let country: Division[] = [];
    if (countryAndTowns.data.COUNTY != null) {
      country = countryAndTowns.data.COUNTY.filter(division => {
        return division.opened;
      });
    }
    this.setState({
      selectCity: division,
      countries: country,
      selectCountry: {
        code: "-1",
        name: "全部区县",
        superiorAccess: false
      }
    });
    let divisions: Division[] = [];
    divisions.push(division);
    country.map((item: Division) => {
      divisions.push(item);
    });
    this.setState({
      selectDivisionList: divisions
    });
  }

  async onCountrySelectChange(event) {
    const { countries } = this.state;
    let selectCountry: Division = countries[event.detail.value];
    this.selectCountry(selectCountry);
  }

  async selectCountry(selectCountry: Division) {
    const { selectCity } = this.state;
    if (selectCity == null) {
      this.setState({
        selectCity: {
          code: selectCountry.parentCode,
          name: selectCountry.parentName
        }
      });
    }
    this.setState({
      selectCountry: selectCountry
    });
    let towns = await getCountryAndTownDatas(selectCountry.code);
    let divisions: Division[] = [];
    towns.data.COUNTY.filter(division => {
      return division.opened;
    }).map((division: Division) => {
      divisions.push(division);
    });
    towns.data.TOWN.filter(division => {
      return division.opened;
    }).map((division: Division) => {
      divisions.push(division);
    });
    this.setState({
      selectDivisionList: divisions
    });
  }

  onColumnChange(event) {
    const { provinces, cities } = this.state;
    if (event.detail.column == 0) {
      let provinceIndex = event.detail.value;
      let provinceCode = provinces[provinceIndex];
      let divisions: Division[][] = [provinces, cities[provinceCode.code]];
      this.setState({
        pickerValues: divisions,
        provinceCities: cities[provinceCode.code]
      });
    }
  }

  //选择行政区
  onSelectDivision(division: Division) {
    navBackWithData({
      selectDivision: division
    });
  }

  render() {
    const {
      selectCity,
      selectCountry,
      pickerValues,
      countries,
      selectDivisionList
    } = this.state;

    return (
      <View className="root_view">
        <View className="selected_division">
          <View className="city_select">
            <Picker
              mode="multiSelector"
              range={pickerValues}
              value={[0, 0]}
              onChange={this.onCitySelectChange.bind(this)}
              onColumnChange={this.onColumnChange.bind(this)}
              rangeKey="name"
            >
              <View className="picker">
                <Text className="city">{selectCity ? selectCity.name : ""}</Text>
                <Image src={changeDivision} className="icon"></Image>
              </View>
            </Picker>
          </View>
          {selectCountry && (
            <View className="city_select">
              <Picker
                mode="selector"
                value={0}
                range={countries}
                onChange={this.onCountrySelectChange.bind(this)}
                rangeKey="name"
              >
                <View className="picker">
                  <Text className="city">
                    {selectCountry && selectCountry.name}
                  </Text>
                  <Image src={changeDivision} className="icon"></Image>
                </View>
              </Picker>
            </View>
          )}
        </View>
        <View className="tip">
          <Text className="content">已开放的区域</Text>
        </View>
        {selectDivisionList.length > 0 && (
          <View className="division_result">
            <ScrollView className="scrollview" scrollY scrollWithAnimation>
              {selectDivisionList.map((division: Division) => {
                return (
                  <View
                    className="division_item"
                    onClick={this.onSelectDivision.bind(this, division)}
                  >
                    <View className="division_name">{division.name}</View>
                    <View className="address_name">{division.parentName}</View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}
        {selectDivisionList.length == 0 && (
          <View className="empty">
            <View className="content">
              <Image className="empty_img" src={divisionEmpty}></Image>
              <Text className="top_tip">您筛选的地区暂无开放的行政区域</Text>
              <Text className="small_tip">（可联系运营人员开放此区域）</Text>
              <View className="call_user">
                <View className="group">
                  <Image className="call_image" src={call}></Image>
                  <Text className="call_tip">联系运营人员</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  }
}

export default DivisionSelect as ComponentType;
