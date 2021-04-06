import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import SearchBox from '@common/components/SearchBox'
import {getSiteId} from '../../service/workbench'
import EmptyHolder from '@common/components/EmptyHolder'
import { navBackWithData } from '@common/utils/common'
import {getLocation} from '../../service/userDivision'
import { Location } from '../../model'
import './selectSite.scss'

interface PollutionIndustryProps {
    userStore: any;
}

interface Site{
    name:string;
    address: string;
    distance: number;
    id:number
}

interface PollutionIndustryState {
    offset: number,                             // 当前第几页
    limit: number,                              // 每页显示数量
    queryContent: string,                       // 文本关键字
    hasMore: boolean,                           // 列表是否可以加载更多（优化）
    siteId: string,                           // 当前选中的工地id
    siteList: Array<Site>,                      // 工地列表数据
    isLoading: boolean,                          // 数据正在加载
    longitude: number;
    latitude: number;
}

@inject('userStore')
@observer
export default class Index extends Component<PollutionIndustryProps, PollutionIndustryState> {

    config: Config = {
        navigationBarTitleText: '选择工地',
        disableScroll: true
    }

    constructor(props) {
        super(props)
        this.state = {
            offset: 0,
            limit: 20,
            queryContent: '',
            hasMore: true,
            siteId: '0',
            siteList: [],
            isLoading: true,
            longitude: 0,
            latitude: 0,
        }
    }

    componentWillMount() {
        this.getSites('')
    }

    // 关键字输入
    onInputChange = (val) => {
        this.setState({
            queryContent: val,
            siteList: [],
            offset: 0,
            hasMore: true,
            isLoading: true
        }, () => {
            this.getSites(this.state.queryContent);
        })
    }

    // 获取工地数据
    getSites = async (val) => {
        try {
            const { limit, offset, siteList, hasMore } = this.state;
            // if (!hasMore) { return; }
            // 获取经纬度
            let location: Location = await getLocation();
            let ResponseId = await getSiteId({
                ...location,
                limit,
                offset
            },val)

            const { statusCode, data: { entries } } = ResponseId;
            if (statusCode == 200) {
                this.setState({
                    siteList: siteList.concat(entries),
                    offset: offset + limit,
                    hasMore: limit <= entries.length,
                    isLoading: false
                });
            }
        } catch (error) {
        }
    }

    // 加载更多
    onScrollToLower = () => {
        this.getSites('');
    }

    // 选择工地名称
    onSelectHandle = (item) => {
        navBackWithData({
            SiteData: item
        });
    }

    render() {
        const { siteList , queryContent, isLoading } = this.state;
        const isEmpty = siteList.length == 0 && !isLoading;
        const showList = siteList.map(industry => (
            <View key={industry.id} className='industry-item' onClick={this.onSelectHandle.bind(this, industry)}>
                <View className='industry'>
                    <Text className='title'>{industry.name}</Text>
                    {industry.address && <Text className='address'>{industry.address}</Text>}
                </View>
                <Text className='distance'>{_toKilometers(industry.distance)}</Text>
            </View>
        ))

        const showEmpty = (<View className='empty'>
            <EmptyHolder text='未查询到数据' />
        </View>)

        return (
            <View className='pollution-industry'>
                {/* 搜索栏 */}
                <SearchBox
                    value={queryContent}
                    placeholder='选择工地名称'
                    onInput={this.onInputChange.bind(this)}
                />

                {/* 列表展示部分 */}
                <ScrollView
                    className='content-container'
                    lowerThreshold={50}
                    onScrollToLower={this.onScrollToLower}
                    scrollY
                    scrollWithAnimation
                >
                    <View className='content'>
                        {
                            isEmpty ? showEmpty : showList
                        }
                    </View>
                </ScrollView>
            </View>
        )
    }
}

// 米转换为千米
function _toKilometers(sMeters) {
    if (!sMeters) {
        return;
    }
    if(sMeters<1000){
        return parseInt(sMeters) + 'm'
    }
    let nKiloMeters = parseInt(sMeters) / 1000;
    return nKiloMeters.toFixed(2) + 'km';
}
