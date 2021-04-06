import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, Image, Block, Button } from '@tarojs/components'
import { AtModal, AtModalContent, AtModalAction } from 'taro-ui'
import { observer, inject } from '@tarojs/mobx';
import { MyInspectSearchType, myInspects, deleteMyInspect, InspectInfoInList } from '../../service/inspect'
import { SimpleRichView } from '@common/components/rich-text'
import FilterTabs, { FilterTabsType } from '@common/components/FilterTabs'
import { inspectTypeText } from '@common/utils/common'
import EmptyHolder from '@common/components/EmptyHolder'
import ListView from '@common/components/ListView'
import isEmpty from 'lodash/isEmpty'
import moment from 'moment';

import './inspectList.scss'

interface WorksProps {
    userStore: any;
}

interface WorksState {
    /**
     * tab选项id
     */
    tabId: number;
    /**
     * 事件列表
     */
    inspectList: InspectInfoInList[],

    /**
     * 当前第几页
     */
    offset: number;
    /**
     * 每页显示数量
     */
    limit: number;
    /**
     * 列表是否可以加载更多（优化）
     */
    hasMore: boolean,
    /**
     * 是否正在加载数据
     */
    isLoading: boolean,
    /**
     * 展示操作悬浮框对应的事件id
     */
    showOperateInspectId: number,
    /**
     * 删除事件提示模态框显示控制 
     */
    deleteModelShow:boolean,
    /**
     * 已删除的事件id
     */
    deletedInspectIds: number[],
}

const tabTypes: MyInspectSearchType[] = ['PATROL', 'INCIDENT',  'INCIDENT_FINISHED'];

@inject('userStore')
@observer
export default class Index extends Component<WorksProps, WorksState> {

    config: Config = {
        navigationBarTitleText: '我的事件',
        navigationBarBackgroundColor: '#FFFFFF',
        navigationBarTextStyle: 'black',
        backgroundColor: '#FFFFFF',
        backgroundTextStyle: 'dark',
        enablePullDownRefresh: false,
    }

    constructor(props) {
        super(props)
        let { tabType } = this.$router.params;

        let tabId:number = 0;
        if(tabType && tabType.length>0){
            tabTypes.forEach((t,index)=>{
                if(t == tabType){
                    tabId = index;
                }
            })
        }

        this.state = {
            offset: 0,
            limit: 10,
            hasMore: true,
            tabId,
            inspectList: [],
            isLoading: true,
            showOperateInspectId: 0,
            deleteModelShow: false,
            deletedInspectIds: [],
        }
    }

    componentDidMount() {
        this.getNewInspectList();
    }

    /**
     * 获取更多事件列表
     */
    getMoreInspectList = (callback) => {
        const { limit, offset, hasMore, inspectList, tabId } = this.state;
        if (!hasMore) { return; }

        let newOffset = offset + limit;

        const type:MyInspectSearchType = tabTypes[tabId];
        myInspects(type,newOffset,limit).then(inspectListResp => {
            const { data: { entries } } = inspectListResp;
            this.setState({
                inspectList: inspectList.concat(entries),
                offset: newOffset,
                hasMore: limit == entries.length,
                isLoading: false
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
     * 获取最新事件列表
     */
    getNewInspectList = () => {
        const { tabId, limit } = this.state;
        let offset = 0;

        const type:MyInspectSearchType = tabTypes[tabId];
        myInspects(type,offset,limit)
            .then((resp) => {
                const { data: { entries } } = resp;
                this.setState({
                    inspectList: entries,
                    offset: offset,
                    hasMore: limit == entries.length,
                    limit: limit,
                    isLoading: false
                }, () => {
                    Taro.hideLoading();
                });
            }).catch(error => {
                Taro.showToast({
                    title: "数据加载失败，请重试！",
                    icon: 'none'
                })
            });
    }


    // 加载更多
    onScrollToLower = (callback) => {
        this.getMoreInspectList(callback);
    }

    //下拉刷新
    onScrollToUpper = () => {
        this.getNewInspectList();
    }

    //下拉刷新
    onPullDownRefresh() {
        this.getNewInspectList();
        Taro.stopPullDownRefresh();
    }

    atClick(event) {
    }

    tagClick(event) {
    }

    tabChoose(item: FilterTabsType) {
        this.setState({
            tabId: Number(item.id),
            inspectList: [],
            isLoading: true,
            showOperateInspectId: 0,
            deleteModelShow: false,
        }, () => {
            this.getNewInspectList();
        });
    }

    /**
     * 事件详情
     * @param inspctId  事件id
     */
    detail(inspctId: number) {
        this.setState({
            showOperateInspectId: 0,
            deleteModelShow: false,
        });
        Taro.navigateTo({
            url: `/pages/works/detail?inspectId=${inspctId}`,
        });
    }

    showOperateWindow(inspectId:number, event){
        event.stopPropagation();
        this.setState({
            showOperateInspectId: inspectId,
            deleteModelShow: false,
        }, ()=> {
            
        });
    }

    edit(inspect:InspectInfoInList, event){
        event.stopPropagation();
    }

    delete(inspect:InspectInfoInList, event){
        event.stopPropagation();
        this.setState({
            deleteModelShow: true,
        });
    }

    onDeleteTipCancel(){
        this.setState({
            showOperateInspectId: 0,
            deleteModelShow: false,
        },()=>{
            
        });
    }

    onDeleteTipConfirm(){
        const {showOperateInspectId, deletedInspectIds} = this.state;
        this.setState({
            deleteModelShow: false,
        },()=>{
            deleteMyInspect(showOperateInspectId).then(()=>{
                deletedInspectIds.push(showOperateInspectId);
                this.setState({
                    showOperateInspectId: 0,
                    deletedInspectIds,
                })
            });
        });
    }

    isDelete(inspectId:number): boolean {
        const {deletedInspectIds} = this.state;
        if(deletedInspectIds.length>0) {
            return deletedInspectIds.filter(id=>(id == inspectId)).length > 0;
        }
        return false;
    }

    onMask(){
        this.setState({
            showOperateInspectId: 0,
            deleteModelShow: false,            
        })
    }

    render() {
        const { tabId, inspectList, hasMore, isLoading, showOperateInspectId,deleteModelShow } = this.state;
        let isEmptyData = !inspectList || inspectList.length == 0;

        const showEmpty = (<View className='empty'><EmptyHolder text='暂无事件' /></View>)

        const showInspectList = inspectList.map((inspect, index) => {
            return (
                <Block key={inspect.id}>
                    {index > 0 ? <View className='splitView'></View> : ''}
                    {
                        !this.isDelete(inspect.id) && 
                        <View className='workItem' onClick={this.detail.bind(this, inspect.id)}>
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
                                    {
                                    tabId!=2 && 
                                    <View className='operate' onClick={this.showOperateWindow.bind(this, inspect.id)}>
                                        <View className={inspect.id == showOperateInspectId ? 'operateWindow' : 'operateWindow hidden'} >
                                            {/* <View className='iconAndTxt' onClick={this.edit.bind(this, inspect)}>
                                                <View className='icon edit'></View>
                                                <Text className='txt'>编辑</Text>
                                            </View> 
                                            */}
                                            <View className='iconAndTxt' onClick={this.delete.bind(this, inspect)}>
                                                <View className='icon delete'></View>
                                                <Text className='txt'>删除</Text>
                                            </View>
                                        </View>
                                    </View>                                        
                                    }
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
                            data={[{ id: 0, name: '巡查工作' }, { id: 1, name: '上报事件' }, { id: 2, name: '处置事件'}]}
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
                    hasData={!isEmpty(inspectList)}
                    onEndReached={this.onScrollToLower}
                    onRefresh={this.onScrollToUpper}
                    showLoading={isLoading}
                >
                    {isEmptyData ? showEmpty : showInspectList}
                    <View className={showOperateInspectId>0? 'operateMask show':'operateMask'} onClick={this.onMask}></View>
                </ListView>

                <AtModal isOpened={deleteModelShow} className='modelStyle'>
                    <AtModalContent>
                        <View className='model_body'>确认删除这条事件吗?</View>
                    </AtModalContent>
                    <AtModalAction>
                        <Button onClick={this.onDeleteTipCancel}>
                            <View className='model_cancel'>取消</View>
                        </Button>
                        <Button onClick={this.onDeleteTipConfirm}>
                            <View className='model_confirm'>确定</View>
                        </Button>
                    </AtModalAction>
                </AtModal>

            </View>
        )
    }
}
