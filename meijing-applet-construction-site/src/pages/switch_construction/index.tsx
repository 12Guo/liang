import Taro, { Config } from "@tarojs/taro";
import { View, Image, Text, Input } from "@tarojs/components";
import { ComponentType } from "react";
import { rootSourceBaseUrl } from "@common/utils/requests"
import { listTenants } from "../../service/department";
import "./index.scss";
import { observer, inject } from '@tarojs/mobx';
import { UserStore } from '@common/store/user';
import ListView from "@common/components/ListView";
import ConstructionItem from "./component/constructionItem";
import Loading from "@common/components/FpiLoading/loading";

const divisionEmptyImg = rootSourceBaseUrl + "/assets/user_join/division_empty.png";    // 行政区为空时
const callImg = rootSourceBaseUrl + "/assets/user_join/call.png";     // 打电话

interface WelcomeProps {
    userStore: UserStore;
}
interface WelcomeState {
    modalContent: string;
    isOpened: boolean;
    hasMore: boolean;
    isLoading: boolean;
    name: string;
    offset: number;
    addressSearchList: any[]
    nowTenantCode: string
}
interface ConstructionSearch {
    props: WelcomeProps;
    state: WelcomeState;
}

@inject("userStore")
@observer
class ConstructionSearch extends Taro.Component {
    config: Config = {
        navigationBarTitleText: '切换工地'
    }
    constructor(props){
        super(props);
        this.state = {
            modalContent: "确认拨打？\n\r159 2393 0189",
            isOpened: false,
            hasMore: false,
            isLoading: true,
            name: "",
            offset: 0,
            addressSearchList: [],
            nowTenantCode: ""
        }
    }
    componentDidMount(){
        this.getAddressList();
        this.setState({
            nowTenantCode: this.props.userStore.userDetails.tenant.code
        })
    }
    onInput(e){
        this.setState({
            name: e.target.value
        }, this.onRefresh);
    }
    getAddressList(){
        const { offset, name } = this.state;
        this.setState({ isLoading: true }, async () => {
            const searchResponse = await listTenants(name);
            const searchData = searchResponse.data.entries;
            this.setState({
                addressSearchList: this.state.addressSearchList.concat(searchData),
                hasMore: searchData.length === 10,
                offset: searchData.length + offset,
                isLoading: false
            });
        });
    }
    onRefresh(){
        this.setState({
            offset: 0,
            addressSearchList: [],
            hasMore: true
        }, () => {
            this.getAddressList();
        });
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
    onTenant(tenantCode){
        this.setState({
            nowTenantCode: tenantCode
        })
        
    }
    switchTenant(){
        const { getUserDetails } = this.props.userStore;
        this.props.userStore.userDetails.tenant.code = this.state.nowTenantCode;
        getUserDetails(() => {
            Taro.showToast({
                title: "切换工地成功",
                icon: "success",
                duration: 2000
            });
            Taro.navigateBack();
        });
    }
    render(){
        const { name, hasMore, addressSearchList, isLoading, nowTenantCode } = this.state;
        console.log(nowTenantCode, "nowTenantCode")
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
                                placeholder="搜索工地名称"
                            />
                        </View>
                    </View>
                    {
                        addressSearchList.length > 0 ? (
                            <ListView
                                com-class="construction-list"
                                hasMore={hasMore}
                                hasData={true}
                                showLoading={isLoading}
                                onRefresh={this.onRefresh.bind(this)}
                                onEndReached={this.getAddressList.bind(this)}
                            >
                                {
                                    nowTenantCode && (
                                        <ConstructionItem
                                            list={addressSearchList}
                                            nowTenantCode={nowTenantCode}
                                            onTenant={this.onTenant.bind(this)}
                                        ></ConstructionItem>
                                    )
                                }
                            </ListView>
                        ) : (
                            (!isLoading) && (<View className="empty">
                                <Image className="empty-img" src={divisionEmptyImg}></Image>
                                <Text className="small-tip">暂无该工地</Text>
                                <View className="group">
                                    <Image className="call-image" src={callImg}></Image>
                                    <Text className="call-tip" onClick={this.openCall.bind(this)}>联系管理员开通</Text>
                                </View>
                            </View>)
                        )
                    }
                    {
                        isLoading && <Loading />
                    }
                </View>
                <View className="footer" onClick={this.switchTenant.bind(this)}>确认</View>
            </View>
        )
    }
}

export default ConstructionSearch as ComponentType;