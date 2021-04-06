import Taro, { Config } from "@tarojs/taro";
import { View, Image, Text, Picker } from "@tarojs/components";
import { getLocation, getProvinceAndCityDatas } from "../../service/userDivision";
import { getAddressByLocationFromTencentMap } from "../../common/utils/mapUtils";
import { listTenantsByDivision } from "@common/service/department";
import { rootSourceBaseUrl } from "@common/utils/requests";
import ListView from "@common/components/ListView";
import Loading from "@common/components/FpiLoading/loading";
import ConstructionItem from "@common/components/FbiItems/ConstructionItem";
import { navBackWithData } from "@common/utils/common";
import "./index.scss";

const divisionEmptyImg = rootSourceBaseUrl + "/assets/user_join/division_empty.png";    // 行政区为空时
const callImg = rootSourceBaseUrl + "/assets/user_join/call.png";     // 打电话

interface UserConstructionProps {
}
interface UserConstructionState {
    location: any,
    addressSearchList: any[],
    pickerValues: any[],
    provinceCities: any[],
    provinces: any[],
    cities: {},
    selectCity: {
        code: string | number
        name: string
        superiorAccess: boolean
    }
    offset: number
    isLoading: boolean
    hasMore: boolean
    hasData: boolean
}
interface UserConstruction {
    props: UserConstructionProps;
    state: UserConstructionState
}
const defaultDivision = {
    code: "110000000000",
    name: "北京市",
    superiorAccess: false
};
class UserConstruction extends Taro.Component {
    config: Config = {
        navigationBarTitleText: "选择工地"
    };
    constructor () {
        super(...arguments)
        this.state = {
            location: {},             // 用户的经纬度信息
            addressSearchList: [],    // 地址列表
            pickerValues: [],         // 选择器里面的所有数据
            provinceCities: [],       // 当前选择的省下城市数据
            provinces: [],            // 省数据
            cities: {},               // 已省编码为键名，旗下的城市为键值
            selectCity: {             // 选中城市的信息
                code: "",
                name: "",
                superiorAccess: false
            },
            offset: 0,
            isLoading: true,
            hasMore: true,
            hasData: true
        }
    }

    componentDidMount(){
        this.loadProvinceAndCityDatas();
        this.setLocationAddress();
    }
    // 获取省市联动数据
    async loadProvinceAndCityDatas() {
        const { provinces, cities } = this.state;
        let provinceAndCityResp = await getProvinceAndCityDatas();
        let provinceAndCityDatas = provinceAndCityResp.data;
        provinceAndCityDatas
          .map(division => {
            provinces.push(division);
            let cityValues = division.children;
            cities[division.code] = cityValues;
          });
        let divisions = [provinces, cities[provinces[0].code]];
        this.setState({
          pickerValues: divisions,
          provinceCities: cities[provinces[0].code]
        });
    }
    async setLocationAddress() {
        let location;
        try {
          location = await getLocation();
          this.setState({ location });
        } catch (error) {
          this.setState({
            selectCity: defaultDivision,
          });
          return;
        }
    
        let addressResponse = await getAddressByLocationFromTencentMap(location.latitude, location.longitude);
        const { adcode, city } = addressResponse.data.result.ad_info; // 用户的城市名称及编号
        let currentDivisionCode = adcode.slice(0, 4) + "00000000";
        this.setState({
            selectCity: {
                code: currentDivisionCode,
                name: city,
                superiorAccess: false
            }
        }, this.fetchList)
    }
    // 改变省市
    async onCitySelectChange(event) {
        const { provinceCities } = this.state;
        let cityIndex = event.detail.value[1] == null ? 0 : event.detail.value[1];
        let division = provinceCities[cityIndex];  

        this.setState({
            selectCity: {
                code: division.code,
                name: division.name,
                superiorAccess: false
            }
        }, this.onRefresh);
    }
    // 列改变时
    onColumnChange(event) {
        const { provinces, cities } = this.state;
        if (event.detail.column == 0) {
          let provinceIndex = event.detail.value;
          let provinceCode = provinces[provinceIndex];
          let divisions = [provinces, cities[provinceCode.code]];
          this.setState({
            pickerValues: divisions,
            provinceCities: cities[provinceCode.code]
          });
        }
    }
    async fetchList(callback?:any){
        try{
            const { selectCity, location, offset, addressSearchList } = this.state;
            const searchResponse = await listTenantsByDivision({
                divisionCode: selectCity.code,
                name: "",
                currentLongitude: location.longitude,
                currentLatitude: location.latitude,
                offset,
                limit: 10,
            });
            const searchData = searchResponse.data.entries;
            this.setState({
                addressSearchList: addressSearchList.concat(searchData),
                hasMore: searchData.length === 10,
                offset: searchData.length + offset,
                isLoading: false,
                hasData: !(addressSearchList.length === 0 && searchData.length === 0)
            }, () => {
                callback && callback()
            });
        } catch (error) {
            callback && callback()
        }
    }
    onRefresh(){
        this.setState({
            offset: 0,
            addressSearchList: [],
            hasMore: true
        }, this.fetchList);
    }
    onToSearch(){
        const {location: {latitude, longitude}, selectCity} = this.state;
        Taro.navigateTo({
            url: `/pages/user_construction/search?latitude=${latitude}&longitude=${longitude}&divisionCode=${selectCity.code}`
        });
    }
    openCall(){
        Taro.makePhoneCall({
            phoneNumber: "15923930189"
        });
    }
    onTenant(tenantCode, tenantName, tenantId){
        navBackWithData({tenantCode, tenantName, tenantId});
    }
    render(){
        const {pickerValues, selectCity, addressSearchList, isLoading, hasMore, hasData} = this.state;

        const Empty = (
            <View className="empty">
                <Image className="empty-img" src={divisionEmptyImg} ></Image>
                <Text className="small-tip">该地区暂无工地</Text>
                <View className="group">
                    <Image className="call-image" src={callImg}></Image>
                    <Text className="call-tip" onClick={this.openCall.bind(this)}>联系管理员开通</Text>
                </View>
            </View>
        )

        return (
            <View className="root_view">
                <View className="head">
                    <Picker
                        mode="multiSelector"
                        range={pickerValues}
                        value={[0, 0]}
                        onChange={this.onCitySelectChange.bind(this)}
                        onColumnChange={this.onColumnChange.bind(this)}
                        rangeKey="name"
                    >
                        <View className="city_select">
                            <View className="city-name">{selectCity ? selectCity.name : ""}</View>
                            <View className="bottom"></View>
                        </View>
                    </Picker>
                    <View className="search" onClick={this.onToSearch.bind(this)}>
                        <View className='at-icon at-icon-search'></View>
                        搜索工地名称
                    </View>
                </View>
                <ListView
                    com-class="construction-list"
                    hasMore={hasMore}
                    hasData={hasData}
                    showLoading={isLoading}
                    onRefresh={this.onRefresh.bind(this)}
                    onEndReached={this.fetchList.bind(this)}
                >
                    {
                        hasData ? (
                            addressSearchList.map(item => <ConstructionItem construction={item} key={item.id} onTenant={this.onTenant.bind(this)} />)
                        ) : Empty
                    }
                </ListView>
            </View>
        )
    }
}

export default UserConstruction