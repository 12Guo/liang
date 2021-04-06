import Taro, { Component } from '@tarojs/taro';
import { View, Text, Button, Block, Image } from '@tarojs/components'
import './acceptDispatch.scss'
import FilterTabs, { FilterTabsType } from '@common/components/FilterTabs'
import EmptyHolder from '@common/components/EmptyHolder'
import ListView from '@common/components/ListView'
import isEmpty from 'lodash/isEmpty'
import moment from 'moment';
import { SimpleRichView } from '@common/components/rich-text'
import { getEventList, getActionList, countByLabel } from '../../service/myDispatch'
import { inspectTypeText } from '@common/utils/common'
import { InspectInfoType } from '../../service/inspect';

interface Myprops { }

interface MyState {
    tabId: number,
    list: EventTpye[],
    isLoading: boolean,
    hasMore: boolean,
    actionList: ActionTpye[],
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
    supervise: boolean;
    count: number;
}

interface ActionTpye {
    id: number,
    createTime: number;
    name: string;
    typeImageUrl: string;
}



class Index extends Component<Myprops, MyState>{

    constructor(props) {
        super(props)
        this.state = {
            // 当前tab的标识id
            tabId: 1,
            // 请求的数据列表
            list: [],
            actionList: [],
            // 是否等待
            isLoading: true,
            // 是否有更多
            hasMore: true,
            offset: 0,
            limit: 20
        }
    }

    componentDidMount() {
        this.getEventList();
    }

    onScrollToLower = () => {
        if (this.state.tabId === 1) {
            this.getEventList();
        } else if (this.state.tabId === 2) {
            this.getActionList();
        } else {
            this.setState({
                list: [],
                actionList: []
            })
        }
    }

    onScrollToUpper = () => {
        if (this.state.tabId === 1) {
            this.getEventList();
        } else if (this.state.tabId === 2) {
            this.getActionList();
        } else {
            this.setState({
                list: [],
                actionList: []
            })
        }
    }

    getMoreList = async () => {
        const { tabId, limit, offset, hasMore, list, actionList } = this.state;
        if (!hasMore) { return; }

        try {
            let newOffset = offset + limit;

            if (tabId === 1) {
                const resp = await getEventList(newOffset, limit);

                const eventList = resp.data.entries;

                this.setState({
                    list: list.concat(eventList),
                    offset: newOffset,
                    hasMore: eventList.length > limit,
                });
            } else if (tabId === 2) {
                const resp = await getActionList(newOffset, limit);

                let labelIds = resp.data.entries.map(item => item.id)
                let resPatrol: any = {}
                if (!isEmpty(labelIds)) {
                    resPatrol = await countByLabel(labelIds);
                }
                resp.data.entries.forEach((element, index) => {
                    element.count = resPatrol.data[index].count
                });
                const respActionList = resp.data.entries;
                this.setState({
                    actionList: actionList.concat(respActionList),
                    offset: newOffset,
                    hasMore: actionList.length > limit,
                });
            }

        } catch (error) {
        }
    }


    atClick(event) {
    }

    tagClick(event) {
    }

    // 请求数据
    getEventList = async () => {
        const { limit } = this.state
        let offset = 0;
        try {
            const eventList = await getEventList(offset, limit);
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
    getActionList = async () => {
        const { limit } = this.state
        let offset = 0;
        try {
            const actionList = await getActionList(offset, limit);
            let labelIds = actionList.data.entries.map(item => item.id)
            let resPatrol: any = {}
            if (!isEmpty(labelIds)) {
                resPatrol = await countByLabel(labelIds);
            }
            actionList.data.entries.forEach((element, index) => {
                element.count = resPatrol.data[index].count
            });
            this.setState({
                actionList: actionList.data.entries,
                hasMore: limit < actionList.data.length,
                isLoading: false,
                offset: 0
            });
        } catch (error) {
            this.setState({
                actionList: [],
                isLoading: false,
                offset: 0
            });
        }
    }

    // 跳转到事件详情
    onNaviDetail = (inspctId) => {
        Taro.navigateTo({
            url: `/pages/works/detail?inspectId=${inspctId}`,
        });
    }

    // 跳转到专项行动
    onIncspectDetail = (inspctId) =>{
        Taro.navigateTo({
            url: `/pages/special-action/detail?id=${inspctId}`,
        });
    }

    // 传递给子组件的方法
    tabChoose = (item: FilterTabsType) => {
        this.setState({
            tabId: Number(item.id),
            isLoading: true
        }, () => {
            if (this.state.tabId === 1) {
                this.getEventList();
            } else if (this.state.tabId === 2) {
                this.getActionList();
            } else {
                this.setState({
                    list: [],
                    actionList: []
                })
            }

        })
    }

    config = {
        navigationBarTitleText: '指派/@我'
    };

    render() {

        const { tabId, isLoading, list, hasMore, actionList } = this.state

        const showEmpty = (<View className='empty'><EmptyHolder text='暂无事件' /></View>)

        let isEmptyData = !list || list.length == 0;
        let isEmptyData2 = !actionList || actionList.length == 0;
        let showInspectList
        if (tabId === 1) {
            showInspectList = list.map((inspect, index) => {
                return (
                    <Block key={inspect.id} >
                        {index > 0 ? <View className='splitView'></View> : ''}
                        {

                            <View className='workItem' onClick={this.onNaviDetail.bind(this, inspect.id)}>
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
                                        <View className="person">
                                            发布人：{inspect.reportUserName}
                                        </View>
                                    </View>                                </View>

                            </View>
                        }
                    </Block>
                );
            });
        } else {
            showInspectList = actionList.map((inspect, index) => {
                return (
                    <Block key={inspect.id}>
                        {index > 0 ? <View className='splitView'></View> : ''}
                        {

                            <View className='workItem' onClick={this.onIncspectDetail.bind(this, inspect.id)}>
                                <View className='image'>
                                    {
                                        inspect.typeImageUrl &&
                                        <Image key={inspect.typeImageUrl} className='imageItem' src={inspect.typeImageUrl} mode='aspectFill' />
                                    }
                                </View>

                                <View className='contentAndTime'>
                                    <View className='content2'>
                                        <SimpleRichView class-name='content2' content={inspect.name} onAtClick={this.atClick.bind(this)} onTagClick={this.tagClick.bind(this)} />
                                    </View>
                                    <Text className="txt2">巡查次数  {inspect.count}</Text>
                                    <View className='timeAndOperate'>
                                        <Text className='time'>
                                            {moment(inspect.createTime).format('YYYY-MM-DD')}
                                        </Text>
                                        {/* <View className="row">
                                            <View className="img-box">
                                                <Image className="img" src={share}></Image>
                                                <Text>{inspect.share}</Text>
                                            </View>

                                            <View className="img-box">
                                                <Image className="img" src={good}></Image>
                                                <Text>{inspect.good}</Text>
                                            </View>

                                        </View> */}
                                    </View>
                                </View>

                            </View>
                        }
                    </Block>
                );
            });
        }

        return (
            <View className='inspectListContent'>
                <View className='topTabView'>
                    <View className='tabs'>
                        <FilterTabs isMore={false}
                            data={[{ id: 1, name: '事件' }, { id: 2, name: '专项行动' }]}
                            tabId={tabId}
                            onMore={() => { }}
                            rowNum={4}
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

                    {isEmptyData && isEmptyData2 ? showEmpty : showInspectList}
                </ListView>

            </View>
        );
    }
}
export default Index