import Taro, { Component, Config } from '@tarojs/taro'
import { observer, inject } from '@tarojs/mobx';
import { AtAvatar, AtActionSheet, AtActionSheetItem } from 'taro-ui'
import { SimpleRichView } from '@common/components/rich-text'
import { View, Text, Image, ScrollView, Input, Button } from '@tarojs/components'
import { formatDate, inspectTypeText } from '@common/utils/common'
import { getShowContent } from '@common/utils/rich-text'
import moment from 'moment'
import './index.scss'
import TopBar from '@common/components/TopBar'
import { RecorderPlay } from '@common/components/recorder'
import { ReactiveDispatch } from '../../model/dispatch'
import { getDispatchDetailById, getComments, getForwardings, getReactiveDispatchRelated, addForwardings } from '../../service/dispatch'
import { InspectInfoType } from '../../service/inspect'
import { rootSourceBaseUrl, getUserAvatarUrl } from '@common/utils/requests'

interface DispatchMsgDetailProps {
    userStore: any;
    systemInfoStore: any;
}

interface DispatchMsgDetailState {
    replyContent: string,
    tabSelected: "REPLY" | "SHARE",
    topTabSelected: "DISPATCH_DETAIL" | "OTHER_EVENT",
    reactiveDispatch?: ReactiveDispatch,
    showReportPanel: boolean,
    replyQueryParam: {
        offset: number,
        limit: number
    },
    shareQueryParam: {
        offset: number,
        limit: number
    },
    replyList: any[],
    shareList: any[],
    relatedList: any[]
}

//图标引用
const empty = rootSourceBaseUrl + '/empty.png';
const share = `${rootSourceBaseUrl}/assets/works/share.png`;
const reply_msg = rootSourceBaseUrl + '/assets/dispatch_msg_detail/reply_msg.png';
const report_msg = rootSourceBaseUrl + '/assets/dispatch_msg_detail/report_msg.png';

@inject('userStore', 'systemInfoStore')
@observer
export default class DispatchMsgDetailSuccess extends Component<DispatchMsgDetailProps, DispatchMsgDetailState> {

    config: Config = {
        navigationBarTitleText: '响应式调度',
        navigationStyle: 'custom'
    }

    constructor(props) {
        super(props)
        this.state = {
            replyContent: "",
            tabSelected: "REPLY",
            topTabSelected: "DISPATCH_DETAIL",
            showReportPanel: false,
            replyQueryParam: {
                offset: 0,
                limit: 200
            },
            shareQueryParam: {
                offset: 0,
                limit: 200
            },
            replyList: [],
            shareList: [],
            relatedList: []
        }
    }

    componentWillMount() {
        let _this = this;
        if (this.$router.params.dispatchId) {
            let despatchResponse = getDispatchDetailById(Number(this.$router.params.dispatchId));
            despatchResponse.then((res) => {
                let detail: ReactiveDispatch = res.data;
                _this.setState({
                    reactiveDispatch: detail
                }, () => {
                    _this.getReplyInfo();
                    _this.getForwardingsInfo();
                    _this.getReactiveDispatchRelatedList();
                })
            })
        }
    }

    componentDidShow() {
        this.getReplyInfo();
        this.getForwardingsInfo();
        this.getReactiveDispatchRelatedList();
    }

    // 获取回复信息
    getReplyInfo = async () => {
        try {
            const { reactiveDispatch, replyQueryParam } = this.state;
            const res = await getComments('reactive-dispatches', reactiveDispatch.id, replyQueryParam);
            const { statusCode, data: { entries = [] } } = res;
            if (statusCode == 200) {
                this.setState({
                    replyList: entries
                })
            }

        }
        catch (error) {

        }
    }

    // 获取分享信息
    getForwardingsInfo = async () => {
        try {
            const { reactiveDispatch, shareQueryParam } = this.state;
            const res = await getForwardings('reactive-dispatches', reactiveDispatch.id, shareQueryParam);
            const { statusCode, data: { entries = [] } } = res;
            if (statusCode == 200) {
                this.setState({
                    shareList: entries
                })
            }

        }
        catch (error) {

        }
    }

    // 获取关联事件
    getReactiveDispatchRelatedList = async () => {
        try {
            const { reactiveDispatch } = this.state;
            const res = await getReactiveDispatchRelated(reactiveDispatch.id);
            const { statusCode, data: { entries = [] } } = res;
            if (statusCode == 200) {
                this.setState({
                    relatedList: entries
                })
            }

        }
        catch (error) {

        }
    }

    onReplyClick() {
        const { reactiveDispatch } = this.state;
        Taro.navigateTo({
            url: `/pages/works/reply?inspectId=${reactiveDispatch.id}&replyOrigin=dispatch`
        });
    }

    atClick() {
        Taro.navigateTo({
            url: '../person/index?dataCode=atPersons'
        });
    }

    tagClick() {
        Taro.navigateTo({
            url: '../works/labelChoose'
        });
    }

    onSelectTab(res) {
        this.setState({
            tabSelected: res,
            showReportPanel: false
        })
    }

    onBackHandle = () => {
        if (this.$router.params.inner) {
            Taro.navigateBack({});
        } else {
            Taro.switchTab({
                url: '/pages/task_dispatch_new/index'
            })
        }
    }

    onShareAppMessage() {
        const { reactiveDispatch } = this.state;
        const { dispatchId } = this.$router.params;

        if (dispatchId && reactiveDispatch) {
            try {
                addForwardings('reactive-dispatches', reactiveDispatch.id);
            } catch (error) {
            }

            let titile = reactiveDispatch.content && getShowContent(reactiveDispatch.content);

            let imageUrl = reactiveDispatch.pictureLinks && reactiveDispatch.pictureLinks.length > 0
                && reactiveDispatch.pictureLinks[0] || `${rootSourceBaseUrl}/share.png`;

            return {
                title: titile,
                path: `/pages/dispatch_msg_detail/index?dispatchId=${dispatchId}`,
                imageUrl: imageUrl,
            }
        }

        return {
            title: `响应式调度`,
            path: `/pages/dispatch_msg_detail/index?dispatchId=${dispatchId}`,
        }
    }

    //顶部Tab 页面切换
    onTopTabSwitch(value) {
        this.setState({
            topTabSelected: value,
            showReportPanel: false
        })
    }

    showBigImage(urls: string[]) {
        Taro.previewImage({
            urls: urls
        })
    }

    // 上报
    onReport = () => {
        this.setState({
            showReportPanel: true
        })
    }

    // 跳转到具体上报页面
    onReportChange = (type: string) => {
        const { reactiveDispatch } = this.state;
        Taro.navigateTo({
            url: `/pages/inspectReport/report?type=${type}&dispatchType=REACTIVE_DISPATCH&reactiveDispatchId=${reactiveDispatch.id}`
        }).then(() => {
            this.setState({
                showReportPanel: false
            })
        })
    }

    // 跳转到事件详情
    handleClick = (item: any) => {
        Taro.navigateTo({
            url: `/pages/works/detail?inspectId=${item.id}`
        })
    }

    onCloseMask = () => {
        this.setState({ showReportPanel: false })
    }


    render() {
        const placeholderCss = "margin-left: 0px;color: #B2B8C6;color: #B2B8C6;font-weight: Regular;font-size: 14px;";
        const { replyContent, tabSelected, topTabSelected, reactiveDispatch, showReportPanel, replyList = [], shareList = [], relatedList = [] } = this.state;

        let images: string[] = [];
        let voices: string = "";
        let duation: number = 0;
        if (reactiveDispatch) {
            images = reactiveDispatch.pictureLinks ? reactiveDispatch.pictureLinks : [];
            voices = reactiveDispatch.voiceLink ? reactiveDispatch.voiceLink : "";
            duation = reactiveDispatch.voiceDuration ? reactiveDispatch.voiceDuration : 0;
        }
        return (
            <View className='root_view'>
                <TopBar title='响应式调度' onBack={this.onBackHandle} />
                <View className='operateTabView'>
                    <View onClick={this.onTopTabSwitch.bind(this, "DISPATCH_DETAIL")} className={topTabSelected == "DISPATCH_DETAIL" ? 'operateTab selected' : 'operateTab'}>
                        <Text className='name'>调度详情</Text>
                    </View>
                    <View onClick={this.onTopTabSwitch.bind(this, "OTHER_EVENT")} className={topTabSelected == "OTHER_EVENT" ? 'operateTab selected' : 'operateTab'}>
                        <Text className='name'>关联事件</Text>
                    </View>
                </View>
                {topTabSelected == "DISPATCH_DETAIL" ?
                    <View className="dispatch_detail_content">
                        <ScrollView
                            className='scrollview'
                            scrollY
                            scrollWithAnimation>
                            <View className="body">
                                <View className="msg_body">
                                    <View className='dispatchUserName'>{reactiveDispatch.dispatchUserName}发起调度</View>
                                    <Text className="title">{reactiveDispatch ? formatDate(reactiveDispatch.dispatchTime) : ""}</Text>
                                    {reactiveDispatch ?
                                        <SimpleRichView class-name='content' content={reactiveDispatch.content} onAtClick={() => { }} onTagClick={() => { }} /> : ""}
                                    {voices &&
                                        <RecorderPlay class-name="recorderPlay" duration={duation} path={voices} />
                                    }
                                    <View className="image_group">
                                        {
                                            images.map((res) => {
                                                return (
                                                    <View key={res} className="image_item">
                                                        <Image className="image" src={res} onClick={this.showBigImage.bind(this, images)}></Image>
                                                    </View>
                                                )
                                            })
                                        }
                                    </View>
                                </View>
                                <View className='splitView'></View>
                                <View className='operateTabView'>
                                    <View onClick={this.onSelectTab.bind(this, "REPLY")} className={tabSelected == "REPLY" ? 'operateTab selected' : 'operateTab'}>
                                        <Text className='name'>回复</Text>
                                        <Text className='number'>({replyList.length})</Text>
                                    </View>
                                    <View onClick={this.onSelectTab.bind(this, "SHARE")} className={tabSelected == "SHARE" ? 'operateTab selected' : 'operateTab'}>
                                        <Text className='name'>分享</Text>
                                        <Text className='number'>({shareList.length})</Text>
                                    </View>
                                </View>
                                {tabSelected == "REPLY" ?
                                    <View className="msg_detail">
                                        {replyList.length > 0 && replyList.map((item) => {
                                            return (
                                                <View key={item} className="reply_item">
                                                    <AtAvatar circle image={getUserAvatarUrl(item.commentUserId)}></AtAvatar>
                                                    <View className="item_detail">
                                                        <View className="item_head">
                                                            <Text className="title">{item.commentUserName}</Text>
                                                            <Text className="time">{moment(item.createTime).format('MM/DD HH:mm')}</Text>
                                                        </View>
                                                        <View className="item_body">
                                                            <SimpleRichView class-name='' content={item.content} onAtClick={() => { }} onTagClick={() => { }} />
                                                        </View>
                                                        <View className='voiceView'>
                                                            {item.voiceLink && item.voiceLink.length > 0 &&
                                                                <RecorderPlay class-name="voice" duration={item.voiceDuration || 0} path={item.voiceLink} />
                                                            }
                                                        </View>
                                                        <View className='images'>
                                                            {
                                                                item.pictureLinks && item.pictureLinks.length > 0
                                                                && item.pictureLinks.map(link => {
                                                                    return <Image key={link} className='img' src={link} mode='aspectFill' onClick={this.showBigImage.bind(this, item.pictureLinks)} />
                                                                })
                                                            }
                                                        </View>
                                                    </View>
                                                </View>
                                            )
                                        })}
                                    </View>
                                    : ""}
                                {tabSelected == "SHARE" ?
                                    <View className="msg_detail">
                                        {shareList.map((item) => {
                                            return (
                                                <View key={item.id} className="reply_item">
                                                    <AtAvatar circle image={getUserAvatarUrl(item.forwardingUserId)}></AtAvatar>
                                                    <View className="item_detail">
                                                        <View className="item_head">
                                                            <Text className="title">{item.forwardingUserName}</Text>
                                                            <Text className="time">{moment(item.createTime).format('MM/DD HH:mm')}</Text>
                                                        </View>
                                                        <View className="item_body">
                                                            分享了该调度
                                                        </View>
                                                    </View>
                                                </View>
                                            )
                                        })}
                                    </View>
                                    : ""}
                            </View>
                        </ScrollView>
                        <View className="control_group">
                            <View className="content">

                                <Button plain={true} className='group group--left' open-type="share">
                                    <Image className='content_image' src={share} />
                                    <Text className='tip'>分享</Text>
                                </Button>

                                <View className='group group--mid' onClick={this.onReport}>
                                    <Image className="content_image" src={report_msg}></Image>
                                    <Text className="tip">上报事件</Text>
                                </View>


                                <View className="group" onClick={this.onReplyClick.bind(this)}>
                                    <Image className="content_image" src={reply_msg}></Image>
                                    <Text className="tip">回复</Text>
                                </View>

                                {/* <Text className="reply" onClick={this.onReplyClick.bind(this)}>输入回复内容...</Text> */}
                            </View>
                        </View>
                    </View> :
                    <View className="other_event_content">
                        <ScrollView
                            className='scrollview'
                            scrollY
                            scrollWithAnimation>
                            {relatedList.length == 0 ? <Image className="event_image" src={empty}></Image> : ""}
                            {relatedList.map((item) => {
                                return (
                                    <View key={item} className="reply_item">
                                        <AtAvatar circle image={`${getUserAvatarUrl(item.reportUserId)}`}></AtAvatar>
                                        <View className="item_detail" onClick={this.handleClick.bind(this, item)}>
                                            <View className="item_head">
                                                <Text className="title">{item.reportUserName || ''}</Text>
                                                <Text className="time">{moment(item.createTime).format('MM/DD HH:mm')}</Text>
                                            </View>
                                            <View className="item_body">
                                                <Text className='inspectType'>【{inspectTypeText(item.type, item.supervise)}】</Text>
                                                <SimpleRichView class-name='' content={item.content} onAtClick={() => { }} onTagClick={() => { }} />
                                            </View>
                                            <View className='images'>
                                                {
                                                    item.pictureLinks && item.pictureLinks.length > 0
                                                    && item.pictureLinks.map(link => {
                                                        return <Image key={link} className='img' src={link} mode='aspectFill' onClick={this.showBigImage.bind(this, item.pictureLinks)} />
                                                    })
                                                }
                                            </View>
                                        </View>
                                    </View>
                                )
                            })}
                        </ScrollView>
                    </View>
                }

                <AtActionSheet isOpened={showReportPanel} onCancel={this.onCloseMask} onClose={this.onCloseMask}>
                    <AtActionSheetItem onClick={this.onReportChange.bind(this, InspectInfoType.PATROL)}>
                        例行巡查
                    </AtActionSheetItem>
                    <AtActionSheetItem onClick={this.onReportChange.bind(this, InspectInfoType.INCIDENT)}>
                        事件上报
                    </AtActionSheetItem>
                </AtActionSheet>
            </View>
        )
    }
}
