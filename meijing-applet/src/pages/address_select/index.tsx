import Taro, { Component, Config } from '@tarojs/taro'
import { View, Map, ScrollView } from '@tarojs/components'
import { marker } from '@tarojs/components/types/Map'
import SearchBox from '@common/components/SearchBox'
import {getLocation} from '../../service/userDivision'
import { search } from '@common/utils/mapUtils'
import { Location } from '../../model'

import './index.scss'

const addressIcon = require("../../assets/images/address_icon.png");


interface AddressSearchItem{
    title:string;
    address:string;
    latitude:number;
    longitude:number;
}

interface AddressSelectProps {
}

interface AddressSelectState {
    longitude:number;
    latitude:number;
    address:string;
    /**
     * 搜索关键字
     */
    queryContent: string;
    /**
     * 加载中
     */
    isLoading: boolean;

    /**
     * 标记点
     */
    markers:marker[];

    /**
     * 搜索列表
     */
    addressSearchList:AddressSearchItem[],
}

export default class AddressSelect extends Component<AddressSelectProps, AddressSelectState>  {

    config: Config = {
        navigationBarTitleText: '所在位置',
        navigationBarBackgroundColor: '#FFFFFF',
        navigationBarTextStyle: 'black',
        backgroundColor: '#FFFFFF',
    }

    constructor() {
        super(...arguments)
        this.state = {
            longitude: 0,
            latitude: 0,
            address: '',
            queryContent: '',
            isLoading: true,
            markers: [],
            addressSearchList:[],
        }
    }


    async componentWillMount() {
        let { longitude,latitude } = this.$router.params;

        let lo:number;
        let la:number;
        if(longitude && latitude){
            lo = parseFloat(longitude);
            la = parseFloat(latitude);
        }else{
            let location: Location = await getLocation();
            lo = location.longitude;
            la = location.latitude;
        }

        this.setState({
            longitude: lo,
            latitude: la,
            markers: [{
                longitude: lo,
                latitude: la,
                iconPath: addressIcon,
            }],
            isLoading: false,
        });
    }

    componentDidMount() {
        Taro.chooseLocation(res=>{
            this.setState({
                latitude: res.latitude,
                longitude: res.longitude,
                address: res.longitude,
            });
        });
    }
    


    // 关键字输入
    async onInputChange(val:string){
        const { longitude, latitude,addressSearchList} = this.state; 
        if(val && val.trim().length>0){
            const searchResp = await search(val,longitude,latitude);
            const searchData:Array<any> = searchResp.data.data;
            if(searchData && searchData.length>0){
                await searchData.forEach(item=>{
                    addressSearchList.push({
                        title:item.title,
                        address:item.address,
                        latitude: item.lat,
                        longitude: item.lng,
                    });
                });
            }

            this.setState({
                queryContent: val,
                addressSearchList: addressSearchList,
            });
        }else{
            this.setState({
                queryContent:'',
                addressSearchList:[],
            });
        }
    }

    addressItemClick(item:AddressSearchItem){
        this.setState({
            longitude: item.longitude,
            latitude: item.latitude,
            markers: [{
                longitude: item.longitude,
                latitude: item.latitude,
                iconPath: addressIcon,
            }],
        });
    }

    render() {
        const { longitude, latitude,queryContent,isLoading,markers,addressSearchList } = this.state;

        if (isLoading) {
            return <View className='content'></View>
        }

        return (
            <View className="content">
                <SearchBox
                    value={queryContent}
                    placeholder='搜索地址'
                    onInput={this.onInputChange.bind(this)}
                />
                
                <Map id="map" show-location 
                markers={markers} scale={13} className="map" 
                longitude={longitude} latitude={latitude} />

                <ScrollView
                            className='addressListView'
                            scrollY
                            scrollWithAnimation>

                    {
                        addressSearchList && addressSearchList.length>0 &&
                        addressSearchList.map(item=>{
                            return (
                                <View className='addressItem' onClick={this.addressItemClick.bind(this,item)}>
                                    <View className='company'>{item.title}</View>
                                    <View className='address'>{item.address}</View>
                                </View>
                            )
                        })
                    }                                    
                </ScrollView>
            </View>
        )
    }

}