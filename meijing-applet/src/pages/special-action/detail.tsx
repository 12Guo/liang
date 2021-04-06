import Taro, { Component, Config } from '@tarojs/taro'
import { AtModal, AtModalContent, AtModalAction } from 'taro-ui'
import { View, Text, Input, Image, ScrollView } from '@tarojs/components'
import TimeLineItem, { TimeLineDataItem } from '@common/components/FbiItems/TimeLineItem'
import { observer, inject } from '@tarojs/mobx';
import { getUserAvatarUrl } from '@common/utils/requests'
import TopBar from '@common/components/TopBar'
import ListView from '@common/components/ListView'
import { getApecialActivityById, SpecialActionDetailType, listByLabel, downloadSpecialActivityAsync, downloadSpecialActivityLink } from '../../service/spectionAction'
import EmptyHolder from '@common/components/EmptyHolder'
import moment from 'moment'
import isEmpty from 'lodash/isEmpty'
import './detail.scss'

interface SpecialActionDetailProps {
    userStore: any,
    systemInfoStore: any
}

interface SpecialActionDetailState {
    timeLineList: Array<TimeLineDataItem>,            // 专项行动关联巡查记录内容
    specialActionDetail: SpecialActionDetailType,
    /**
     * 事件总数
     */
    timeLineTotal: number,
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
    showPop: boolean,
}

//定时器
let timer: any = null;
//轮询变量
let pollingTime: any = null;
//轮询时长:分钟
const pollingDuration = 3;
//文件下载地址
let fileLink = '';

@inject('userStore', 'systemInfoStore')
@observer
export default class Index extends Component<SpecialActionDetailProps, SpecialActionDetailState> {

    config: Config = {
        navigationBarTitleText: '专项行动详情',
        navigationStyle: 'custom'
    }

    constructor(props) {
        super(props)
        this.state = {
            timeLineList: [],
            timeLineTotal: 0,
            offset: 0,
            limit: 10,
            hasMore: true,
            specialActionDetail: {
                id: 0,
                beginTime: 0,
                endTime: 0,
                content: '',
                createTime: 0,
                createUserName: '',
                divisionCode: '',
                divisionName: '',
                isDeleted: false,
                name: '',
                participants: [],
                typeName: ''
            },
            isLoading: true,
            showPop: false,
        }
    }

    componentDidMount() {
        this.getApecialActivitiesDetail();
        this.getNewPatrolRecordList();
    }

    // 加载更多
    onScrollToLower = (callback) => {
        this.getMorePatrolRecordList(callback);
    }

    //下拉刷新
    onScrollToUpper = () => {
        this.setState({
            isLoading: true,
        }, () => {
            this.getNewPatrolRecordList();
        })
    }

    /**
     * 获取更多巡查记录
     */
    getMorePatrolRecordList = (callback) => {
        const { id } = this.$router.params;
        const { limit, offset, hasMore, timeLineList } = this.state;
        if (!hasMore) { return; }

        let newOffset: number = offset + limit;

        listByLabel('special-activity', id, newOffset, limit).then(res => {
            const { data: { entries = [], total = 0 } } = res;

            const tempTimeLineList = entries.map(item => ({
                id: item.id,
                title: item.address,
                time: item.createTime,
                img_url: item.pictureLinks && item.pictureLinks.length > 0 && item.pictureLinks[0],
                content: item.content,
                disposalDepartmentName: item.disposalDepartmentName,
                disposalUserName: item.disposalUserName,
                status: (item.type == 'INCIDENT' && item.status == false)
            }));

            this.setState({
                timeLineTotal: total,
                offset: newOffset,
                hasMore: limit == entries.length,
                timeLineList: timeLineList.concat(tempTimeLineList),
                isLoading: false,
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
     * 获取最新巡查记录
     */
    getNewPatrolRecordList = async () => {
        const { limit } = this.state;
        const offset = 0;
        const { id } = this.$router.params;
        try {
            const res = await listByLabel('special-activity', id, offset, limit);
            const { data: { entries = [], total = 0 } } = res;
            this.setState({
                offset,
                timeLineTotal: total,
                hasMore: limit == entries.length,
                isLoading: false,
                timeLineList: entries.map(item => ({
                    id: item.id,
                    title: item.address,
                    time: item.createTime,
                    img_url: item.pictureLinks && item.pictureLinks.length > 0 && item.pictureLinks[0],
                    content: item.content,
                    disposalDepartmentName: item.disposalDepartmentName,
                    disposalUserName: item.disposalUserName,
                    status: (item.type == 'INCIDENT' && item.status == false)
                }))
            })
        }
        catch (error) {
            Taro.showToast({
                title: "数据加载失败，请重试！",
                icon: 'none'
            })
        }
    }

    // 获取专项行动详情
    getApecialActivitiesDetail = async () => {
        const { id } = this.$router.params;
        try {
            const res = await getApecialActivityById(id);
            const { statusCode, data = {} } = res;
            if (statusCode == 200) {
                this.setState({
                    specialActionDetail: data
                })
            }
        }
        catch (error) { }
    }

    onBackHandle = () => {
        const { share } = this.$router.params;
        if (share) {
            Taro.switchTab({
                url: '/pages/task_dispatch_new/index'
            })
        }
        Taro.navigateBack({});
    }

    onShareAppMessage() {
        const { id } = this.$router.params;
        console.log(`/pages/special-action/detail?share=true&id=${id}`)
        return {
            title: '专项行动详情',
            path: `/pages/special-action/detail?share=true&id=${id}`
        }
    }

    handleClick = (item: any) => {
        Taro.navigateTo({
            url: `/pages/works/detail?inspectId=${item.id}`
        })
    }

    onCopy = () => {
        Taro.setClipboardData({
            data: fileLink
        }).then(() => {
            this.setState({ showPop: false })
        })
    }

    downLoadFile = (params: any) => {
        Taro.showLoading({ title: '文档下载中' })
        try {
            downloadSpecialActivityAsync(params).then((res) => {
                if (res.data) {
                    pollingTime = new Date().getTime();
                    this.polling({ ...params, searchKey: res.data });
                }
            })
        }
        catch (err) {
            Taro.hideLoading();
            console.log(err)
        }
    }

    onDownLoad = (type) => {
        const { id } = this.$router.params;
        let params = {
            labelType: 'special-activity',
            labelId: id,
            type
        }
        this.downLoadFile(params)
    }

    // 轮询
    polling = (params: any) => {
        timer = setTimeout(() => {
            downloadSpecialActivityLink(params).then((res) => {
                let endPollingTime = new Date().getTime();
                if (res.data.link) {
                    clearTimeout(timer);
                    Taro.hideLoading();
                    this.setState({
                        showPop: true
                    })
                    fileLink = res.data.link;
                }
                else {
                    this.polling(params)
                }
                if (endPollingTime - pollingTime > pollingDuration * 60 * 1000) {
                    clearTimeout(timer)
                    Taro.hideLoading();
                }
            })
        }, 2000)
    }

    componentWillUnmount() {
        clearTimeout(timer);
    }

    render() {
        const { timeLineList, specialActionDetail, timeLineTotal, hasMore, isLoading, showPop } = this.state;
        const { systemInfoStore } = this.props;
        const statusBarHeight = systemInfoStore.systemInfo.statusBarHeight;

        const showInspectList = timeLineList.map(item => (
            <TimeLineItem key={item.id} data={item} onClick={this.handleClick.bind(this, item)} />
        ));

        return (
            <View className={`device_pd_${statusBarHeight}`}>
                <TopBar title='专项行动详情' onBack={this.onBackHandle} />
                <View className='action-detail-page'>
                    <View className='header'>
                        <View className='header_top'>
                            <Text className='title'>{specialActionDetail.name}</Text>
                            <Text className='tag'>{specialActionDetail.typeName}</Text>
                        </View>
                        <View className='header_bottom'>
                            <Text className='sub_title'>{specialActionDetail.content}</Text>
                        </View>
                    </View>


                    <View className='content'>
                        <View className='content_top'>
                            <Text className='time'></Text>
                            <Text className='count'>{`巡查记录(${timeLineTotal})`}</Text>
                        </View>

                        <ListView
                            com-class='content-container'
                            hasMore={hasMore}
                            hasData={!isEmpty(timeLineList)}
                            onEndReached={this.onScrollToLower}
                            onRefresh={this.onScrollToUpper}
                            showLoading={isLoading}
                        >
                            {
                                timeLineList.length == 0 ? (<EmptyHolder text='暂无相关巡查事件上报' />)
                                    : showInspectList
                            }
                        </ListView>

                        {/* {
                                timeLineList.length == 0 ?
                                (<EmptyHolder text='暂无相关巡查事件上报' />) :
                                (
                                    <ScrollView className='content-container' scrollY scrollWithAnimation >
                                        {showInspectList}
                                    </ScrollView>
                                )
                            } */}

                        <View className='action-time'>
                            <Image className='icon' src={require('./time.png')} />
                            <Text className='label'>行动时间</Text>
                            <Text className='time'>{specialActionDetail.beginTime ? moment(specialActionDetail.beginTime).format("YYYY/MM/DD") : ''}至{specialActionDetail.endTime ? moment(specialActionDetail.endTime).format("YYYY/MM/DD") : ''}</Text>
                        </View>

                        <View className='action-user'>
                            <View className='action-user_top'>
                                <Image className='icon' src={require('./user.png')} />
                                <Text className='label'>参与人（{specialActionDetail.participants.length}人）</Text>
                            </View>
                            <View className='action-user_content'>
                                {
                                    specialActionDetail.participants.map((item => (
                                        <View className='content_item' key={item.participantUserId}>
                                            <Image className='img' src={`${getUserAvatarUrl(item.participantUserId)}`} />
                                            <Text className='name'>{item.participantUserName}</Text>
                                        </View>
                                    )))
                                }
                            </View>
                        </View>
                    </View>
                    {/* <View className='bottom'>
                        <Input className='input' type='text' placeholderClass='placeholder' placeholder='请输入回复内容...' />
                        <View className='icon_container'>
                            <Image className='icon' src={require('./star.png')} />
                            <Text className='txt'>分享</Text>
                        </View>
                        <View className='icon_container'>
                            <Image className='icon' src={require('./share.png')} />
                            <Text className='txt'>点赞</Text>
                        </View>
                    </View> */}
                </View>
                <View className='action-detail-download'>
                    <View className='btn-item' onClick={this.onDownLoad.bind(this, 'PROBLEM')}>
                        <View className='img'></View>
                        <Text className='txt'>下载问题文档</Text>
                    </View>
                    <View className='btn-item' onClick={this.onDownLoad.bind(this, 'ACTIVITY')}>
                        <View className='img img--right'></View>
                        <Text className='txt'>下载处置文档</Text>
                    </View>
                </View>

                <AtModal
                    className='popUp'
                    isOpened={showPop}>
                    <AtModalContent>
                        <View className='popUp_body'>
                            <Text className='tip'>请点击下方复制链接按钮，</Text>
                            <Text className='tip'>粘贴到浏览器中下载</Text>
                            <Text className='sub'>（链接7天有效）</Text>
                        </View>
                    </AtModalContent>
                    <AtModalAction>
                        <View className='popUp_footer'>
                            <Text className='btn copy' onClick={this.onCopy}>复制链接</Text>
                        </View>
                    </AtModalAction>
                </AtModal>
            </View>
        )
    }
}