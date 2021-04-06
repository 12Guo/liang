import Taro, { Component } from '@tarojs/taro';
import { View, Text, Button, Block, Image } from '@tarojs/components'
import './acceptDispatch.scss'
import FilterTabs, { FilterTabsType } from '@common/components/FilterTabs'
import EmptyHolder from '@common/components/EmptyHolder'
import ListView from '@common/components/ListView'
import isEmpty from 'lodash/isEmpty'
import moment from 'moment';
import { SimpleRichView } from '@common/components/rich-text'
import { getShareList, getGoodList } from '../../service/myDispatch'
import { InspectInfoType } from '../../service/inspect';
import { inspectTypeText } from '@common/utils/common'

interface Myprops { }

interface MyState {
    tabId: number,
    list: EventTpye[],
    isLoading: boolean,
    hasMore: boolean,
    offset: number;
    limit: number;
}

interface EventTpye {
    id: number,
    content: string;
    createTime: number;
    pictureLinks: string[];
    pollutionTypeId?: string | undefined;
    pollutionTypeName?: string | undefined;
    reportUserId: number;
    reportUserName: string;
    type: InspectInfoType;
    supervise:boolean;
}

class Index extends Component<Myprops, MyState>{

    constructor(props) {
        super(props)
        this.state = {
            // 当前tab的标识id
            tabId: 1,
            // 请求的数据列表
            list: [],
            // 是否等待
            isLoading: true,
            // 是否有更多
            hasMore: true,
            offset: 0,
            limit: 20
        }
    }
    componentDidMount() {
        this.getShareList();
    }

    onScrollToLower = () => {

        if (this.state.tabId === 1) {
            this.getShareList();
        } else if (this.state.tabId === 2) {
            this.getGoodList();
        } else {
            this.setState({
                list: [],
            })
        }
    }

    onScrollToUpper = () => {
        if (this.state.tabId === 1) {
            this.getShareList();
        } else if (this.state.tabId === 2) {
            this.getGoodList();
        } else {
            this.setState({
                list: [],
            })
        }
    }

    atClick(event) {
    }

    tagClick(event) {
    }

    // 跳转到事件详情
    onNaviDetail = (inspctId) =>{
        Taro.navigateTo({
            url: `/pages/works/detail?inspectId=${inspctId}`,
        });
    }

    // 请求数据
    getGoodList = async () => {
        const { limit } = this.state
        let offset = 0;
        try {
            const eventList = await getGoodList(offset, limit);
            console.log('data', eventList.data)
            this.setState({
                list: eventList.data.entries,
                hasMore: limit < eventList.data.length,
                isLoading: false,
                offset: 0
            });
        } catch (error) {
            this.setState({
                list: [],
                isLoading: false,
                offset: 0
            });
        }
    }

    // 请求数据
    getShareList = async () => {
        const { limit } = this.state
        let offset = 0;
        try {
            const eventList = await getShareList(offset, limit);
            this.setState({
                list: eventList.data.entries,
                hasMore: limit < eventList.data.length,
                isLoading: false,
                offset: 0
            });
        } catch (error) {
            this.setState({
                list: [],
                isLoading: false,
                offset: 0
            });
        }
    }

    // 传递给子组件的方法
    tabChoose = (item: FilterTabsType) => {
        this.setState({
            tabId: Number(item.id),
            isLoading: true
        }, () => {
            if (this.state.tabId === 1) {
                this.getShareList();
            } else if (this.state.tabId === 2) {
                this.getGoodList();
            } else {
                this.setState({
                    list: [],
                })
            }

        })
    }

    config = {
        navigationBarTitleText: '我的点赞/分享'
    };

    render() {

        const { tabId, isLoading, list, hasMore } = this.state

        console.log(this.state)
        const showEmpty = (<View className='empty'><EmptyHolder text='暂无事件' /></View>)

        let isEmptyData = !list || list.length == 0;
        let showInspectList = list.map((inspect, index) => {
            return (
                <Block key={inspect.id}>
                    {index > 0 ? <View className='splitView'></View> : ''}
                    {

                        <View className='workItem' onClick={this.onNaviDetail.bind(this,inspect.id)}>
                            <View className='image'>
                                {
                                    inspect.pictureLinks && inspect.pictureLinks.length > 0 &&
                                    <Image key={inspect.pictureLinks[0]} className='imageItem' src={inspect.pictureLinks[0]} mode='aspectFill' />
                                }
                            </View>

                            <View className='contentAndTime'>
                                <View className='content'>

                                    <Text className='inspectType'>{inspectTypeText(inspect.type, inspect.supervise)}</Text>

                                    <SimpleRichView class-name='' content={inspect.content} onAtClick={this.atClick.bind(this)} onTagClick={this.tagClick.bind(this)} />
                                </View>
                                <View className='timeAndOperate'>
                                    <Text className='time'>
                                        {moment(inspect.createTime).format('MM/DD HH:mm')}
                                    </Text>
                                    <Text>发布人：{inspect.reportUserName}</Text>
                                </View>
                            </View>

                        </View>
                    }
                </Block>
            );
        });



        return (
            <View className='inspectListContent'>
                <View className='topTabView'>
                    <View className='tabs'>
                        <FilterTabs isMore={false}
                            data={[{ id: 1, name: '我的分享' }, { id: 2, name: '我的点赞' }]}
                            tabId={tabId}
                            onMore={() => { }}
                            rowNum={3}
                            showFilter={false}
                            onTab={this.tabChoose.bind(this)} />

                    </View>
                </View>
                <ListView
                    com-class='workListView'
                    hasMore={hasMore}
                    hasData={!isEmpty(list)}
                    onEndReached={this.onScrollToLower}
                    onRefresh={this.onScrollToUpper}
                    showLoading={isLoading}
                >

                    {isEmptyData ? showEmpty : showInspectList}
                </ListView>
            </View>
        );
    }
}
export default Index