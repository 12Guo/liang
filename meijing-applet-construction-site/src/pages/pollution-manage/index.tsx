import Taro, { Component, Config } from '@tarojs/taro';
import { View, Text } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import isEmpty from 'lodash/isEmpty'
import get from 'lodash/get'
import SearchBox from '@common/components/SearchBox'
import FilterTabs from '@common/components/FilterTabs'
import ListView from '@common/components/ListView'
import EmptyHolder from '@common/components/EmptyHolder'
import FpiConfirm from '@common/components/FpiConfirm';
import PollutionItem from '@common/components/FbiItems/PollutionItem'
import { PollutionType, getPollutionSourcesList, delPollutionDetail, getPollutionSourceTypeList } from '../../service/pollutionType'
import { getLocation } from '../../service/userDivision'
import './index.scss'

interface PollutionProps {
    userStore: any;
}

interface PollutionState {
    pollutionList: any[]
    paramQuery: {
        queryContent: string,
        typeId: any,
        currentLatitude: number,
        currentLongitude: number,
        offset: number,
        limit: number
    },
    /**
     * 是否初始化加载数据
     */
    isInit: boolean,
    /**
     * 是否存在更多
     */
    hasMore: boolean,
    /**
     * 是否loading中
     */
    isLoading: boolean,
    /**
     * 污染源类别切换控制字段
     */
    isMore: boolean,
    pollutionTypeList: PollutionType[],
    /**
     * 当前选中的污染源类别id
     */
    pollutionActiveId: string,
    showPopup: boolean,
    currentItem: any,
}

@inject('userStore')
@observer
class PollutionPage extends Component<PollutionProps, PollutionState> {
    config: Config = {
        navigationBarTitleText: '污染源列表'
    }

    static externalClasses = ['com-class']

    constructor(props) {
        super(props);

        this.state = {
            pollutionList: [],
            paramQuery: {
                queryContent: '',
                typeId: '',
                currentLatitude: 35.712193,
                currentLongitude: 115.029078,
                offset: 0,
                limit: 20
            },
            isInit: true,
            hasMore: true,
            isLoading: true,
            isMore: false,
            pollutionTypeList: [{
                id: 0,
                name: '全部'
            }],
            pollutionActiveId: '0',
            showPopup: false,
            currentItem: {}
        }
    }

    componentDidShow() {
        this.filterListData()
    }

    filterListData = () => {
        const pollutionId = Taro.getStorageSync('pollutionSource-delete-id')
        if (pollutionId) {
            const { pollutionList } = this.state
            this.setState({
                pollutionList: pollutionList.filter(item => item.id != pollutionId)
            }, () => {
                Taro.removeStorageSync('pollutionSource-delete-id')
            })
        }
    }

    componentDidMount() {
        this.getPollutionType();
        getLocation().then(position => {
            const { paramQuery } = this.state
            this.setState({
                paramQuery: {
                    ...paramQuery,
                    currentLatitude: position.latitude,
                    currentLongitude: position.longitude
                }
            }, this.fetchList)
        })
    }

    // 获取专项行动列表
    fetchList = (callback?:any) => {
        const { paramQuery, isInit, pollutionList } = this.state;
        getPollutionSourcesList(paramQuery).then(res=>{
            const {data: { entries = [] } } = res;
            let newPollutionList = entries;
            if (!isInit) {
                newPollutionList = pollutionList.concat(newPollutionList);
            }
            this.setState({
                pollutionList: newPollutionList,
                isLoading: false,
                isInit: false,
                hasMore: entries.length == paramQuery.limit,
                paramQuery: {
                    ...paramQuery,
                    offset: paramQuery.offset + paramQuery.limit
                }
            },()=>{
                if(callback){
                    callback();
                }
            });
        }).catch(res=> {
            if(callback){
                callback();
            }
         });
    }

    /**
     * 刷新操作
     */
    onRefresh = () => {
        const { paramQuery } = this.state;
        this.setState({
            paramQuery: {
                ...paramQuery,
                offset: 0
            },
            pollutionList: []
        }, () => {
            this.fetchList();
        })
    }

    onInputChange = (val) => {
        const { paramQuery } = this.state;
        this.setState({
            pollutionList: [],
            paramQuery: {
                ...paramQuery,
                queryContent: val,
                offset: 0
            },
            hasMore: true,
            isLoading: true
        }, this.fetchList)
    }

    onAdd = () => {
        Taro.navigateTo({
            url: `/pages/mark/index`
        })
    }

    onEdit = (item: any) => {
        Taro.navigateTo({
            url: `./edit?id=${item.id}`
        })
    }

    onDetail = (item: any) => {
        Taro.navigateTo({
            url: `./detail?id=${item.id}`
        })
    }

    onDel = async (item: any) => {
        this.setState({
            showPopup: true,
            currentItem: item
        })
    }

    // 获取污染源类型
    getPollutionType = async () => {
        try {
            const resPollutionType = await getPollutionSourceTypeList();
            const { statusCode, data } = resPollutionType;
            if (statusCode == 200) {
                const { pollutionTypeList } = this.state;
                this.setState({ pollutionTypeList: pollutionTypeList.concat(data) });
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
        const { paramQuery, pollutionActiveId } = this.state;
        if (item.id == pollutionActiveId) {
            return;
        }

        this.setState({
            pollutionList: [],
            paramQuery: {
                ...paramQuery,
                offset: 0,
                typeId: item.id == '0' ? '' : item.id
            },
            isMore: false,
            hasMore: true,
            isLoading: true,
            pollutionActiveId: item.id
        }, this.fetchList)
    }

    onConfirm = async () => {
        const { pollutionList, currentItem } = this.state
        const currentIndex = pollutionList.findIndex(plt => plt.id == currentItem.id)

        try {
            const res = await delPollutionDetail(currentItem.id)
            if (get(res, 'data.success')) {
                if (currentIndex > -1) {
                    pollutionList.splice(currentIndex, 1)
                    this.setState({
                        pollutionList,
                        showPopup: false
                    })
                }
            }
            else {
                Taro.showToast({
                    title: '删除失败',
                    mask: true,
                    icon: 'none',
                    duration: 2000
                });
            }
        }
        catch (e) {

        }
    }

    onCancel = () => {
        this.setState({
            showPopup: false,
            currentItem: {}
        })
    }

    render() {
        const { paramQuery, hasMore, pollutionList, isLoading, isMore, pollutionTypeList, pollutionActiveId, showPopup } = this.state;
        let isEmptyData = !pollutionList || pollutionList.length == 0;

        const showEmpty = (<View className='empty'><EmptyHolder text='暂无数据' /></View>)
        const showList = pollutionList.map(item => (
            <PollutionItem key={item.id} data={item} onEdit={this.onEdit.bind(this)} onDetail={this.onDetail.bind(this)} onDel={this.onDel.bind(this)} />
        ));

        return (
            <View className='pollution-page'>
                {/* 搜索栏 */}
                <SearchBox
                    value={paramQuery.queryContent}
                    placeholder='搜索企业'
                    onInput={this.onInputChange.bind(this)}
                />

                {/* tabs切换栏 */}
                <FilterTabs
                    isMore={isMore}
                    data={pollutionTypeList}
                    tabId={pollutionActiveId}
                    onMore={this.onToggleMoreHandle}
                    onTab={this.onTabItemChange}
                />

                {/* 列表展示部分 */}
                <ListView
                    com-class='content-container'
                    hasMore={hasMore}
                    hasData={!isEmpty(pollutionList)}
                    showLoading={isLoading}
                    onRefresh={this.onRefresh}
                    onEndReached={this.fetchList}
                >
                    {isEmptyData ? showEmpty : showList}
                </ListView>

                <View className='add' onClick={this.onAdd}>
                    <Text className='add_txt'>+ 新增污染源</Text>
                </View>

                <FpiConfirm
                    title='提示'
                    content='确定删除该条数据吗？'
                    isOpened={showPopup}
                    onConfirm={this.onConfirm}
                    onCancel={this.onCancel}
                />
            </View>
        );
    }
}

export default PollutionPage;