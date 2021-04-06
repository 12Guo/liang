import Taro, { Config } from "@tarojs/taro";
import { View, Image, Text, Input } from "@tarojs/components";
import { ComponentType } from "react";
import { rootSourceBaseUrl } from "@common/utils/requests"
import { listTenantsByDivision } from "@common/service/department";
import "./search.scss";
import { observer, inject } from '@tarojs/mobx';
import { UserStore } from '@common/store/user';
import ListView from "@common/components/ListView";
import ConstructionItem from "@common/components/FbiItems/ConstructionItem";


const divisionEmptyImg = rootSourceBaseUrl + "/assets/user_join/division_empty.png";    // 行政区为空时
const callImg = rootSourceBaseUrl + "/assets/user_join/call.png";     // 打电话

interface WelcomeProps {
    userStore: UserStore;
}
interface WelcomeState {
    modalContent: string;
    isOpened: boolean;
    hasMore: boolean;
    hasData: boolean;
    isLoading: boolean;
    name: string;
    offset: number;
    addressSearchList: any[];
    isFirstEnter: boolean;
}
interface ConstructionSearch {
    props: WelcomeProps;
    state: WelcomeState;
}

@inject("userStore")
@observer
class ConstructionSearch extends Taro.Component {
    config: Config = {
        navigationBarTitleText: '选择工地'
    }
    constructor(){
        super(...arguments);
        this.state = {
            modalContent: "确认拨打？\n\r159 2393 0189",
            isOpened: false,
            hasMore: false,
            hasData: false,
            isLoading: false,
            name: "",
            offset: 0,
            addressSearchList: [],
            isFirstEnter: true
        }
    }
    onInput(e){
        this.setState({
            name: e.target.value
        });
    }
    async getAddressList(){
        const { longitude, latitude, divisionCode } = this.$router.params;
        const { name, offset } = this.state;
        const searchResponse = await listTenantsByDivision({
            divisionCode,
            name,
            currentLongitude: longitude,
            currentLatitude: latitude,
            offset,
            limit: 10
        });
        const searchData = searchResponse.data.entries;
        const { addressSearchList } = this.state;
        this.setState({
            addressSearchList: addressSearchList.concat(searchData),
            hasMore: searchData.length === 10,
            offset: searchData.length + offset,
            isLoading: false,
            hasData: !(addressSearchList.length === 0 && searchData.length === 0),
            isFirstEnter: false
        });
    }
    onRefresh(){
        this.setState({
            offset: 0,
            addressSearchList: [],
            hasMore: true
        }, this.getAddressList);
    }
    openCall(){
        Taro.showModal({
            title: "确认拨打？",
            content: "15923930189",
            success(){
                Taro.makePhoneCall({
                    phoneNumber: "15923930189"
                });
            }
        }) 
    }
    onTenant(tenantCode, tenantName, tenantId){
        const pages = Taro.getCurrentPages();
        const twoUpPage = pages[pages.length - 3];
        twoUpPage.setData({tenantName, tenantCode, tenantId})
        Taro.navigateBack({delta: 2});
    }
    render(){
        const { name, hasMore, addressSearchList, isLoading, hasData, isFirstEnter } = this.state;

        const Empty = (
            <View className="empty">
                    <Image className="empty-img" src={divisionEmptyImg}></Image>
                    <Text className="small-tip">暂无该工地</Text>
                    <View className="group">
                        <Image className="call-image" src={callImg}></Image>
                        <Text className="call-tip" onClick={this.openCall.bind(this)}>联系管理员开通</Text>
                    </View>
                </View>
        )
        return (
            <View>
                <View className="root_view">
                    <View className="head">
                        <View className="search">
                            <View className='at-icon at-icon-search'></View>
                            <Input
                                className="search-input"
                                value={name}
                                onInput={this.onInput.bind(this)}
                                placeholder="输入关键字，搜一搜想要找的工地"
                            ></Input>
                        </View>
                        <View style={{color: "#0D86FF"}} onClick={this.onRefresh.bind(this)}>搜索</View>
                    </View>
                    <ListView
                        com-class="construction-list"
                        hasMore={hasMore}
                        hasData={hasData}
                        showLoading={isLoading}
                        onRefresh={this.onRefresh.bind(this)}
                        onEndReached={this.getAddressList.bind(this)}
                    >
                        {
                            hasData ? (
                                addressSearchList.map(item => (
                                    <ConstructionItem construction={item} key={item.id} onTenant={this.onTenant} />
                                ))
                            ) : (!isFirstEnter && Empty)
                        }
                    </ListView>
                </View>
            </View>
        )
    }
}

export default ConstructionSearch as ComponentType;