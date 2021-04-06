import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import { PollutionType, PollutionSource, getPollutionSourceTypeList, getPollutionSourcesList } from '../../service/pollutionType'
import SearchBox from '@common/components/SearchBox'
import FilterTabs from '@common/components/FilterTabs'
import EmptyHolder from '@common/components/EmptyHolder'
import { navBackWithData } from '@common/utils/common'
import './index.scss'

interface PollutionIndustryProps {
    userStore: any;
}

interface PollutionIndustryState {
    offset: number,                             // 当前第几页
    limit: number,                              // 每页显示数量
    queryContent: string,                       // 文本关键字
    hasMore: boolean,                           // 列表是否可以加载更多（优化）
    isMore: boolean,                            // 污染源类别切换控制字段
    pollutionList: Array<PollutionType>                  // 污染源类别列表数据>,
    pollutionActiveId: string,                           // 当前选中的污染源类别id
    pollutionIndustryList: Array<PollutionSource>,    // 污染企业列表数据
    isLoading: boolean,                          // 数据正在加载
    longitude: number;
    latitude: number;
}

@inject('userStore')
@observer
export default class Index extends Component<PollutionIndustryProps, PollutionIndustryState> {

    config: Config = {
        navigationBarTitleText: '选择污染源企业',
        disableScroll: true
    }

    constructor(props) {
        super(props)
        this.state = {
            offset: 0,
            limit: 20,
            queryContent: '',
            hasMore: true,
            isMore: false,
            pollutionList: [{
                id: 0,
                name: '全部'
            }],
            pollutionActiveId: '0',
            pollutionIndustryList: [],
            isLoading: true,
            longitude: 0,
            latitude: 0,
        }
    }

    componentWillMount() {
        
    }

    async componentDidMount() {
        let { latitude,longitude } = this.$router.params;

        this.getPollutionType();

        let latitudeNum = 0;
        let longitudeNum = 0;
        if(latitude && longitude){
            latitudeNum = Number(latitude);
            longitudeNum = Number(longitude);
        }

        this.setState({
            latitude : latitudeNum,
            longitude: longitudeNum,
        },()=>{
            this.getPollutionSources();
        })
    }

    // 关键字输入
    onInputChange = (val) => {
        this.setState({
            queryContent: val,
            pollutionIndustryList: [],
            offset: 0,
            hasMore: true,
            isLoading: true
        }, () => {
            this.getPollutionSources();
        })
    }

    // 获取污染源类型
    getPollutionType = async () => {
        try {
            const resPollutionType = await getPollutionSourceTypeList();
            const { statusCode, data } = resPollutionType;
            if (statusCode == 200) {
                const { pollutionList } = this.state;
                this.setState({ pollutionList: pollutionList.concat(data) });
            }
        } catch (error) {
        }
    }

    // 获取污染源数据
    getPollutionSources = async () => {
        try {
            const { limit, offset, queryContent, pollutionActiveId, pollutionIndustryList, hasMore
            ,longitude,latitude } = this.state;
            if (!hasMore) { return; }

            const resPollutionSource = await getPollutionSourcesList({
                queryContent,
                typeId: pollutionActiveId == '0' ? '' : pollutionActiveId,
                limit,
                offset,
                currentLatitude: latitude,
                currentLongitude: longitude,
            });
            const { statusCode, data: { entries } } = resPollutionSource;
            if (statusCode == 200) {
                this.setState({
                    pollutionIndustryList: pollutionIndustryList.concat(entries),
                    offset: offset + limit,
                    hasMore: limit <= entries.length,
                    isLoading: false
                });
            }
        } catch (error) {
        }
    }

    // 更多切换
    onToggleMoreHandle = () => {
        const isMore = this.state.isMore;
        this.setState({
            isMore: !isMore
        })
    }

    // 栏目切换
    onTabItemChange = (item) => {
        if (item.id == this.state.pollutionActiveId) {
            return;
        }
        this.setState({
            pollutionActiveId: item.id,
            isMore: false,
            pollutionIndustryList: [],
            offset: 0,
            hasMore: true,
            isLoading: true
        }, () => {
            this.getPollutionSources();
        })
    }

    // 加载更多
    onScrollToLower = () => {
        this.getPollutionSources();
    }

    // 选择污染源
    onSelectHandle = (item) => {
        navBackWithData({
            pollutionSourceData: item
        });
    }

    render() {
        const { isMore, pollutionList, pollutionActiveId, pollutionIndustryList = [], queryContent, isLoading } = this.state;
        const isEmpty = pollutionIndustryList.length == 0 && !isLoading;

        const showList = pollutionIndustryList.map(industry => (
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
                    placeholder='选择企业'
                    onInput={this.onInputChange.bind(this)}
                />

                {/* tabs切换栏 */}
                <FilterTabs
                    isMore={isMore}
                    data={pollutionList}
                    tabId={pollutionActiveId}
                    onMore={this.onToggleMoreHandle}
                    onTab={this.onTabItemChange}
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
                            isEmpty? showEmpty: showList
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
    let nKiloMeters = parseInt(sMeters) / 1000;
    return nKiloMeters.toFixed(2) + 'km';
}
