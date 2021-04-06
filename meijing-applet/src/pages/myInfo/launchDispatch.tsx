import Taro, { Component } from '@tarojs/taro';
import { View, Text, Button, Block, Image } from '@tarojs/components'
import './acceptDispatch.scss'
import EmptyHolder from '@common/components/EmptyHolder'
import ListView from '@common/components/ListView'
import isEmpty from 'lodash/isEmpty'
import moment from 'moment';
import { SimpleRichView } from '@common/components/rich-text'
import { getLaunchList } from '../../service/myDispatch'
import { InspectInfoType } from '../../service/inspect';
import { inspectTypeText } from '@common/utils/common'

interface Myprops { }

interface MyState {
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
    disposalUserId: number;
    disposalUserName: string;
    type: InspectInfoType;
    supervise: boolean;
}

class Index extends Component<Myprops, MyState>{

    constructor(props) {
        super(props)
        this.state = {
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

    getMoreList = async () => {
        const { limit, offset, hasMore, list } = this.state;
        if (!hasMore) { return; }

        try {
            let newOffset = offset + limit;

            const resp = await getLaunchList(newOffset, limit);

            const eventList = resp.data.entries;

            this.setState({
                list: list.concat(eventList),
                offset: newOffset,
                hasMore: eventList.length > limit,
            });


        } catch (error) {
        }
    }

    componentDidMount() {
        this.getNewInspectList();
    }

    onScrollToLower = () => {
        this.getNewInspectList();

    }

    onScrollToUpper = () => {
        this.getNewInspectList();

    }

    atClick(event) {
    }

    tagClick(event) {
    }

    // 跳转到事件详情
    onNaviDetail = (inspctId) => {
        Taro.navigateTo({
            url: `/pages/works/detail?inspectId=${inspctId}`,
        });
    }

    // 请求数据
    getNewInspectList = async () => {
        const { limit } = this.state
        let offset = 0;
        try {
            const eventList = await getLaunchList(offset, limit);
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

    config = {
        navigationBarTitleText: '我的指派'
    };

    render() {

        const { isLoading, list, hasMore } = this.state

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
                                    <Text>指派：{inspect.disposalUserName}</Text>
                                </View>
                            </View>
                        </View>
                    }
                </Block>
            );
        });


        return (
            <View className='inspectListContent'>
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