import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, Image, Block, Button } from '@tarojs/components'
import { AtAvatar } from 'taro-ui'
import { observer, inject } from '@tarojs/mobx';
import { unionWorkInspects as getInspectList, InspectInfoInList, praise, assign, share, InspectInWorkSearchType } from '../../service/inspect'
import { SimpleRichView } from '@common/components/rich-text'
import FilterTabs, { FilterTabsType } from '@common/components/FilterTabs'
import { rootSourceBaseUrl, getUserAvatarUrl } from '@common/utils/requests'
import EmptyHolder from '@common/components/EmptyHolder'
import ListView from '@common/components/ListView'
import { RecorderPlay } from '@common/components/recorder'
import { clearValueInPageData, getPageData, inspectTypeText, isOnlyInspector } from '@common/utils/common'
import { SimpleUser } from '@common/service/user'
import { getShowContent } from '@common/utils/rich-text'
import cloneDeep from 'lodash/cloneDeep';
import isEmpty from 'lodash/isEmpty'
import moment from 'moment';

import './index.scss'

const person = rootSourceBaseUrl + "/assets/works/person.png";
const gray_person = rootSourceBaseUrl + "/assets/works/gray_person.png";

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
     * 指派的事件
     */
    assignInspect?: InspectInfoInList,
    /**
     * 指派的事件在列表中的索引
     */
    assignInspectIndex?: number;/**
    * 是否允许指派他人
    */
    canAssign: boolean,
    /**
     * 是否正在加载数据
     */
    isLoading: boolean,
}

const tabTypes: InspectInWorkSearchType[] = ['ALL', 'MY', 'DEPARTMENT'];

@inject('userStore')
@observer
export default class Index extends Component<WorksProps, WorksState> {

    config: Config = {
        navigationBarTitleText: '工作圈',
        navigationBarBackgroundColor: '#FFFFFF',
        navigationBarTextStyle: 'black',
        backgroundColor: '#FFFFFF',
        backgroundTextStyle: 'dark',
        enablePullDownRefresh: false,
    }

    constructor(props) {
        super(props)
        this.state = {
            offset: 0,
            limit: 10,
            hasMore: true,
            tabId: 0,
            inspectList: [],
            canAssign: true,
            isLoading: true
        }
    }

    componentDidMount() {
        let { share } = this.$router.params;
        let { userStore: { userDetails } } = this.props;
        if (isOnlyInspector(userDetails.roles)) {
            this.setState({
                canAssign: false
            })
        }
        try {
            this.getNewInspectList();
        } catch (error) {
            //从分享地址进来的时候，如果403，则跳转到权限受限页面
            if ('true' == share && error.statusCode == 403) {
                const message = error.data && error.data.message || '';
                Taro.redirectTo({
                    url: `/pages/default/limitedAccess?message=${message}`,
                });
            }
        }
    }

    componentDidShow() {
        const { assignInspect, assignInspectIndex, inspectList, tabId } = this.state;
        const { assignPerson } = getPageData();
        const workSearchFilter = Taro.getStorageSync('work-search-filter')

        if (assignPerson) {
            let personsList: SimpleUser[] = assignPerson.choosedUsers;

            if (personsList && personsList.length > 0 && assignInspect) {
                //指派
                assign({
                    inspectId: assignInspect.id,
                    userId: personsList[0].id,
                    userName: personsList[0].name,
                    departmentId: personsList[0].departmentId,
                    departmentCode: personsList[0].departmentCode,
                    departmentName: personsList[0].departmentName,
                }).then(() => {
                    let temInspectList = cloneDeep(inspectList);
                    if (assignInspectIndex != undefined) {
                        temInspectList[assignInspectIndex] =
                            {
                                ...assignInspect,
                                disposalUserId: personsList[0].id,
                                disposalUserName: personsList[0].name,
                            };
                    }
                    this.setState({
                        inspectList: temInspectList,
                        assignInspect: undefined,
                        assignInspectIndex: undefined,
                    });
                }).catch(() => {
                    this.setState({
                        assignInspect: undefined,
                        assignInspectIndex: undefined,
                    });
                });
            }
            clearValueInPageData(['assignPerson']);
        }
        else if (tabTypes[tabId] === 'ALL' && !isEmpty(Taro.getStorageSync('work-search-filter'))) {
            this.getNewInspectList();
        }
    }


    /**
     * 获取更多事件列表
     */
    getMoreInspectList = (callback) => {
        const { userStore: { userDetails } } = this.props;
        const { limit, offset, hasMore, inspectList, tabId } = this.state;
        if (!hasMore) { return; }

        let newOffset = offset + limit;
        let departmentId = userDetails && userDetails.departmentInfo && userDetails.departmentInfo.id || 0;

        const workSearchFilter = Taro.getStorageSync('work-search-filter')
        const params = {
            tabType: tabTypes[tabId],
            offset: newOffset,
            limit,
            departmentId: tabTypes[tabId] == 'ALL' ? 0 : departmentId,
            ...workSearchFilter
        }

        getInspectList(params).then(inspectListResp => {
            const { data: { entries } } = inspectListResp;
            this.setState({
                inspectList: inspectList.concat(entries),
                offset: newOffset,
                hasMore: limit == entries.length,
                isLoading: false
            }, () => {
                if (callback) {
                    callback();
                }
            });
        }).catch(res => {
            if (callback) {
                callback();
            }
        });
    }

    /**
     * 获取最新事件列表
     */
    getNewInspectList = () => {
        const { userStore: { userDetails } } = this.props;
        const { tabId, limit } = this.state;
        let offset = 0;
        let departmentId = userDetails && userDetails.departmentInfo && userDetails.departmentInfo.id || 0;

        const workSearchFilter = Taro.getStorageSync('work-search-filter')
        const params = {
            tabType: tabTypes[tabId],
            offset,
            limit,
            departmentId: tabTypes[tabId] == 'ALL' ? 0 : departmentId,
            ...workSearchFilter
        }

        getInspectList(params)
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

    //加载更多
    onPullDownRefresh() {
        this.getNewInspectList();
        Taro.stopPullDownRefresh();
    }


    /**
     * 事件详情
     * @param inspctId  事件id
     */
    detail(inspctId: number) {
        Taro.navigateTo({
            url: `./detail?inspectId=${inspctId}`
        })
    }

    atClick(event) {
    }

    tagClick(event) {
    }

    tabChoose(item: FilterTabsType) {
        this.setState({
            tabId: Number(item.id),
            inspectList: [],
            isLoading: true
        }, () => {
            if (item.id != 0) {
                Taro.setStorageSync('work-search-filter', {})
            }
            this.getNewInspectList();
        });
    }

    /**
     * 点赞
     * @param inspectInfo 事件信息
     * @param index 事件在列表中的索引
     */
    async praise(inspectInfo: InspectInfoInList, index: number, event) {
        event.stopPropagation();

        if (inspectInfo.praised) {
            return;
        }
        try {
            await praise(inspectInfo.id);

            inspectInfo.praised = true;
            inspectInfo.praiseNum = inspectInfo.praiseNum + 1;

            const { inspectList } = this.state;
            inspectList[index] = inspectInfo;

            this.setState({
                inspectList: inspectList
            });
        } catch (error) {
        }
    }


    /**
     * 指派
     */
    async assign(inspectInfo: InspectInfoInList, index: number, event) {
        event.stopPropagation();
        const { canAssign } = this.state;
        if (!canAssign) {
            return false;
        }
        this.setState({
            assignInspect: inspectInfo,
            assignInspectIndex: index,
        });
        Taro.navigateTo({
            url: '../person/index?dataCode=assignPerson&radio=true&type=4&only=true'
        });
    }

    shareButton(event) {
        event.stopPropagation();
    }

    /**
     * 分享
     */
    onShareAppMessage(res) {
        let inspectInfo: InspectInfoInList = res.target.dataset.shareinfo;
        let index = res.target.dataset.shareindex;

        try {
            share(inspectInfo.id);
            inspectInfo.shareNum = inspectInfo.shareNum + 1;

            const { inspectList } = this.state;
            inspectList[index] = inspectInfo;

            this.setState({
                inspectList: inspectList
            });
        } catch (error) {
        }

        let titile = inspectInfo.content && getShowContent(inspectInfo.content) ||
            inspectTypeText(inspectInfo.type, inspectInfo.supervise);

        if (inspectInfo.pollutionTypeName) {
            titile = `【${inspectInfo.pollutionTypeName}】` + titile;
        }

        let imageUrl = inspectInfo.pictureLinks && inspectInfo.pictureLinks.length > 0
            && inspectInfo.pictureLinks[0] || `${rootSourceBaseUrl}/share.png`;

        return {
            title: titile,
            path: `/pages/works/detail?inspectId=${inspectInfo.id}&share=true`,
            imageUrl: imageUrl,
        };
    }

    onFilter = () => {
        Taro.navigateTo({
            url: './filter'
        })
    }

    toThousand = (val) => {
        if (!val || isNaN(val)) {
            return ''
        }
        else if (val < 1000) {
            return `(${val})m`
        }
        else {
            return `(${(val / 1000).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,')}km)`
        }
    }

    render() {
        const { userStore: { userDetails } } = this.props;
        let { tabId, inspectList, hasMore, canAssign, isLoading } = this.state;
        let isEmptyData = !inspectList || inspectList.length == 0;
        let departmentName = userDetails && userDetails.departmentInfo && userDetails.departmentInfo.name || '我的部门';
        if (departmentName.length >= 5) {
            departmentName = '我的部门';
        }

        const showEmpty = (<View className='empty'><EmptyHolder text='暂无事件' /></View>)

        const showInspectList = inspectList.map((inspect, index) => {
            return (
                <Block key={inspect.id}>
                    {index > 0 ? <View className='splitView'></View> : ''}
                    <View className='workItem' onClick={this.detail.bind(this, inspect.id)}>
                        <View className='personalInfo'>
                            <AtAvatar className='avatar' circle image={inspect.anonymous ? `${rootSourceBaseUrl}/assets/works/anonymous.png` : `${getUserAvatarUrl(inspect.reportUserId)}`} />
                            <View className='userInfo'>
                                <View className='userNameAndDepartment'>
                                    <Text className='username'>{inspect.anonymous ? '匿名用户' : (inspect.sourceName || inspect.reportUserName || '')}</Text>
                                    {
                                        !inspect.anonymous && inspect.reportDepartmentName && 
                                        <View className='department'>{inspect.reportDepartmentName || ''}</View>
                                    }
                                </View>
                                <Text className='time'>
                                    {moment(inspect.createTime).format('MM/DD HH:mm')}
                                </Text>
                            </View>
                            {
                                inspect.status ?
                                    <Image className='doneIcon' src={`${rootSourceBaseUrl}/assets/works/done2.png`} />
                                    : ''
                            }
                        </View>
                        <View className='content'>
                            <Text className='inspectType'>{inspectTypeText(inspect.type, inspect.supervise)}</Text>
                            <SimpleRichView class-name='' content={inspect.content} onAtClick={this.atClick.bind(this)} onTagClick={this.tagClick.bind(this)} />
                        </View>

                        <View className='voiceView'>
                            {inspect.voiceLink && inspect.voiceLink.length > 0 &&
                                <RecorderPlay class-name="voice" duration={inspect.voiceDuration || 0} path={inspect.voiceLink} />
                            }
                        </View>

                        <View className='images'>
                            {
                                inspect.pictureLinks && inspect.pictureLinks.length > 0 &&
                                inspect.pictureLinks.slice(0, 9).map((link) => {
                                    return <Image key={link} className='imageItem' src={link} mode='aspectFill' />
                                })
                            }
                        </View>
                        <View className='address'>
                            <Image className='addressIcon' src={`${rootSourceBaseUrl}/assets/works/address.png`} />
                            <Text className='text'>{inspect.address || ''}{this.toThousand(inspect.distance)}</Text>
                        </View>
                        <View className='operate'>
                            <View className='buttonView' onClick={this.praise.bind(this, inspect, index)}>
                                <Image className='icon' src={inspect.praised ? `${rootSourceBaseUrl}/assets/works/praised.png` : `${rootSourceBaseUrl}/assets/works/praise.png`} />
                                <Text className='text'>{inspect.praiseNum}</Text>
                            </View>

                            <Button plain={true} className='buttonView shareButton' open-type="share" data-shareInfo={inspect} data-shareIndex={index} onClick={this.shareButton.bind(this)}>
                                <Image className='icon' src={`${rootSourceBaseUrl}/assets/works/share.png`} />
                                <Text className='text'>{inspect.shareNum}</Text>
                            </Button>

                            <View className='buttonView width180' onClick={this.assign.bind(this, inspect, index)}>
                                <Image className='icon' src={canAssign ? person : gray_person} />
                                {
                                    inspect.disposalUserId && inspect.disposalUserName ?
                                        (
                                            userDetails.id == inspect.disposalUserId ?
                                                <Block>
                                                    <Text className={canAssign ? 'text' : 'gray_text'}>指派:</Text>
                                                    <Text className='me'>我</Text>
                                                </Block>
                                                :
                                                <Text className={canAssign ? 'text' : 'gray_text'}>指派:{inspect.disposalUserName}</Text>
                                        ) :
                                        <Text className={canAssign ? 'text' : 'gray_text'}>未指派</Text>
                                }
                            </View>
                            <View className='buttonView rightButton'>
                                <Text className='text'>{inspect.replyNum}</Text>
                                <Image className='icon' src={`${rootSourceBaseUrl}/assets/works/reply.png`} />
                            </View>
                        </View>
                    </View>
                </Block>
            );
        });

        return (
            <View className='content'>
                <View className='topTabView'>
                    <View className='tabs'>
                        <FilterTabs isMore={false}
                            data={[{ id: 0, name: '全部' }, { id: 1, name: '我的' }, { id: 2, name: departmentName }]}
                            tabId={tabId}
                            onMore={() => { }}
                            rowNum={5}
                            showFilter={tabId == 0}
                            onFilter={this.onFilter}
                            onTab={this.tabChoose.bind(this)} />
                    </View>
                    {/* <Text className='addButton'>+</Text> */}
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
                </ListView>
            </View>
        )
    }
}
