import Taro, { Component, Config } from '@tarojs/taro'
import { View, ScrollView, Text } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import FilterTabs from '@common/components/FilterTabs'
import ActionItem from '@common/components/FbiItems/ActionItem'
import EmptyHolder from '@common/components/EmptyHolder'
import isEmpty from 'lodash/isEmpty'
import { ActionType, SpecialActionItemType, getApecialActivities, countByLabel } from '../../service/spectionAction'
import ListView from '@common/components/ListView'
import './index.scss'

interface SpecialActionProps {
    userStore: any;
}

interface SpecialActionState {
    isMore: boolean,                             // 专项行动下拉图标
    actionTypeList: ActionType[]                 // 专项行动列表数据,
    actionList: SpecialActionItemType[]          // 专项行动列表内容
    paramQuery: {
        onlyMy: number,
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
}

@inject('userStore')
@observer
export default class Index extends Component<SpecialActionProps, SpecialActionState> {

    config: Config = {
        navigationBarTitleText: '专项行动'
    }

    constructor(props) {
        super(props)
        this.state = {
            isMore: false,
            actionTypeList: [{ id: 1, name: '我的' }, { id: 0, name: '全部' }],
            actionList: [],
            paramQuery: {
                onlyMy: 1,
                offset: 0,
                limit: 20
            },
            isInit: true,
            hasMore: true,
            isLoading: true
        }
    }

    componentWillMount() {

    }

    componentDidMount() {
        this.fetchList();
    }

    // 获取专项行动列表
    fetchList = async (callback?:any) => {
        try {
            const { paramQuery, isInit, actionList } = this.state;
            const res = await getApecialActivities(paramQuery);
            const { statusCode, data: { entries = [] } } = res;
            if (statusCode == 200) {
                let labelIds = entries.map(item => item.id);
                let resPatrol: any = {};
                if (!isEmpty(labelIds)) {
                    resPatrol = await countByLabel(labelIds);
                }
                let newActionList = entries.map((item, index) => ({
                    id: item.id,
                    name: item.name,
                    typeImageUrl: item.typeImageUrl,
                    beginTime: item.beginTime,
                    endTime: item.endTime,
                    patrol: isEmpty(resPatrol.data) ? 0 : resPatrol.data[index].count,
                }));
                if (isInit) {
                    newActionList = actionList.concat(newActionList);
                }

                this.setState({
                    actionList: newActionList,
                    isLoading: false,
                    isInit: false,
                    hasMore: entries.length == paramQuery.limit
                },()=>{
                    if(callback){
                        callback();
                    }
                })
            }else{
                if(callback){
                    callback();
                } 
            }
        }
        catch (error) {
            if(callback){
                callback();
            }
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
        const { paramQuery } = this.state;
        if (item.id == paramQuery.onlyMy) {
            return;
        }
        this.setState({
            paramQuery: {
                ...paramQuery,
                offset: 0,
                onlyMy: item.id
            },
            actionList: [],
            isLoading: true
        }, () => {
            this.fetchList();
        })
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
            actionList: []
        }, () => {
            this.fetchList();
        })
    }

    onAdd = () => {
        Taro.navigateTo({
            url: './edit'
        })
    }

    onClickHandle = (item) => {
        Taro.navigateTo({
            url: `./detail?id=${item.id}`
        })
    }

    render() {
        const { actionTypeList, isMore, actionList, paramQuery, hasMore, isLoading } = this.state;

        let isEmptyData = !actionList || actionList.length == 0;

        const showEmpty = (<View className='empty'><EmptyHolder text='暂无数据' /></View>)
        const showList = actionList.map((item) => (
            <ActionItem key={item.id} data={item} onClick={this.onClickHandle.bind(this, item)} />
        ));

        return (
            <View className='special-action-page'>
                {/* tabs切换栏 */}
                <FilterTabs
                    isMore={isMore}
                    data={actionTypeList}
                    tabId={paramQuery.onlyMy}
                    onMore={this.onToggleMoreHandle}
                    onTab={this.onTabItemChange}
                    rowNum={5}
                />

                {/* 列表展示部分 */}
                <ListView
                    com-class='content-container'
                    hasMore={hasMore}
                    hasData={!isEmpty(actionList)}
                    showLoading={isLoading}
                    onRefresh={this.onRefresh}
                    onEndReached={this.fetchList}
                >
                    {isEmptyData ? showEmpty : showList}
                </ListView>

                <View className='add' onClick={this.onAdd}>
                    <Text className='add_txt'>+ 新增专项行动</Text>
                </View>
            </View>
        )
    }
}