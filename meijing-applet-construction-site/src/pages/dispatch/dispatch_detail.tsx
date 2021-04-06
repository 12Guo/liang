import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { AtAvatar } from "taro-ui";
import { RecorderPlay } from "../../common/components/recorder"
import { SimpleRichView } from "@common/components/rich-text";
import { InspectInfoType } from "../../service/inspect";
import FilterTabs from '@common/components/FilterTabs'
import { observer, inject } from '@tarojs/mobx';
import EmptyHolder from '@common/components/EmptyHolder';
import './dispatch_detail.scss'
import { rootSourceBaseUrl, getUserAvatarUrl, rootConstructionSourceBaseUrl } from '@common/utils/requests';
import moment from "moment";

const replyIcon = rootSourceBaseUrl + "/assets/works/reply_dt.png";
const confirmReceipt = rootConstructionSourceBaseUrl + "/assets/pages/green-construction/confirm-receipt.png";


interface IndexProps {
    userStore: any;
}

interface IndexState {
    tabId: number;
    replyPageParams: {
        list: any[],
        total: number,
        limit: number,
        offset: number,
        hasMore: true,
    },
    browsePageParams: {
        list: any[],
        total: number,
        limit: number,
        offset: number,
        hasMore: true,
    },
    dispatchId: number
}

@inject('userStore')
@observer
export default class Index extends Component<IndexProps, IndexState> {
    config: Config = {
        navigationBarTitleText: "调度详情"
    }
    constructor(props) {
        super(props)
        this.state = {
            tabId: 1,
            replyPageParams: {
                list: [
                    {
                        id: 1,

                    }
                ],
                total: 0,
                limit: 10,
                offset: 0,
                hasMore: true,
            },
            browsePageParams: {
                list: [],
                total: 0,
                limit: 10,
                offset: 0,
                hasMore: true,
            },
            dispatchId: 0
        }
    }

    showBigImage(urls: string[]) {
        Taro.previewImage({
            urls: urls
        })
    }

    tabChoose(item) {
        const { replyPageParams, browsePageParams } = this.state;
        let getMore = false;
        let tabId = item.id;
        switch (tabId) {
            case 1:
                getMore = replyPageParams.list.length > 0;
                break;
            case 2:
                getMore = browsePageParams.list.length > 0;
                break;
            default:
                getMore = replyPageParams.list.length > 0;
                break;
        }
        this.setState({
            tabId: item.id
        })
    }

    hasmore(entries: any[]) {
        return 10 == entries.length;
    }

    /**
   * 获取最新回复列表
   */
    getNewReplyList = (dispatchId: number) => {
        // let offset = 0;
        // getReplyList(dispatchId, offset, 10).then(listResp => {
        //     const { data: { entries, total } } = listResp;

        //     this.setState({
        //         replyPageParams: {
        //             list: entries,
        //             total: total,
        //             limit: 10,
        //             offset: 0,
        //             hasMore: this.hasmore(entries),
        //         }
        //     });
        // }).catch(error => { });
    }

    getMoreReplyList = () => {
        // let { dispatchId, replyPageParams: { hasMore, offset, list } } = this.state;
        // if (!hasMore) { return; }

        // let newOffset = offset + 10;

        // getReplyList(dispatchId, newOffset, 10).then(listResp => {
        //     const { data: { entries, total } } = listResp;

        //     this.setState({
        //         replyPageParams: {
        //             list: list.concat(entries),
        //             total: total,
        //             limit: 10,
        //             offset: newOffset,
        //             hasMore: this.hasmore(entries),
        //         }
        //     });
        // }).catch(error => { });
    }

    getNewAssignList = (dispatchId: number) => {
        // let offset = 0;

        // getAssignList(dispatchId, offset, 10).then(listResp => {
        //   const { data: { entries, total } } = listResp;

        //   this.setState({
        //     browsePageParams: {
        //       list: entries,
        //       total: total,
        //       limit: 10,
        //       offset: offset,
        //       hasMore: this.hasmore(entries),
        //     }
        //   });
        // }).catch(e => { });
    }

    getMoreAssignList = () => {
        // let { dispatchId, browsePageParams: { hasMore, offset, list } } = this.state;
        // if (!hasMore) { return; }

        // let newOffset = offset + 10;

        // getAssignList(dispatchId, newOffset, 10).then(listResp => {
        //   const { data: { entries, total } } = listResp;

        //   this.setState({
        //     browsePageParams: {
        //       list: list.concat(entries),
        //       total: total,
        //       limit: 10,
        //       offset: newOffset,
        //       hasMore: this.hasmore(entries),
        //     }
        //   });
        // }).catch(e => { });
    }

    reply() {
        const { dispatchId } = this.state;
        if (dispatchId) {
            Taro.navigateTo({
                url: `/pages/works/reply?inspectId=${dispatchId}`
            })
        }
    }

    render() {
        const { replyPageParams, browsePageParams, tabId } = this.state;
        const showEmpty = (<View className='empty'><EmptyHolder text='暂无数据' /></View>);
        let tabsData = [{ id: 1, name: `回复(${replyPageParams.total})` }, { id: 2, name: `指派(${browsePageParams.total})` },]

        return (
            <View className="root">
                <View className="detail">
                    <View className="detail-text">
                        <View className="detail-title">马局长发起调度</View>
                        <View className="detail-time">2019/07/27 16:53</View>
                        <View className="detail-content">
                            根据热区实时变化，发现目前热区与今天调度报告中的预测热区相比较变动较大，请相关部门及时前往相应的地点进行巡查工作和处置相关问题。
                    </View>
                        <View className="detail-receive">
                            <Text className="detail-receive-title">调度接收人： </Text>
                            <Text className="detail-receive-people">恒源锦绣城</Text>
                        </View>
                    </View>
                    <View className="detail-img-box">
                        <Text className="img"></Text>
                        <Text className="img"></Text>
                    </View>
                </View>
                <View className="division"></View>
                <View className='tabs'>
                    <FilterTabs
                        isMore={false}
                        data={tabsData}
                        tabId={tabId}
                        onMore={() => { }}
                        onTab={this.tabChoose.bind(this)}
                    />
                    <View className='behaviorList'>
                        {
                            replyPageParams.list.length == 0 ?
                                showEmpty :
                                replyPageParams.list.map(inspectReplyInList => {
                                    return (
                                        <View key={inspectReplyInList.id} className='operateItem'>
                                            <View className='personalInfo'>
                                                <AtAvatar className='avatar' circle image={`${getUserAvatarUrl(1)}`} />
                                            </View>
                                            <View className='operateContent'>
                                                <View className='nameAndTime'>
                                                    <View className='nameAndStatus'>
                                                        <Text className='name'>{"的肌肤的"}</Text>
                                                        {
                                                            // inspectDetail.type == InspectInfoType.INCIDENT && inspectReplyInList.replyType == 'DISPOSAL' &&
                                                            // <Text className={inspectDetail.status && lastDisposalReplyId == inspectReplyInList.id ? 'replyStatus' : 'replyStatus gray'}>完成处置</Text>
                                                        }
                                                    </View>
                                                    <Text className='time'>
                                                        {moment().format('MM/DD HH:mm')}
                                                    </Text>
                                                </View>
                                                <View className='contentItem pd'>
                                                    {/* {inspectReplyInList.voiceLink &&
                                                        <RecorderPlay class-name="voice" duration={inspectReplyInList.voiceDuration || 0} path={inspectReplyInList.voiceLink} />
                                                    } */}
                                                </View>
                                                <View className='replyContent'>
                                                    <SimpleRichView class-name='' content={"inspectReplyInList.content"} />
                                                </View>
                                                <View className='images'>
                                                    {/* {
                                                        inspectReplyInList.pictureLinks && inspectReplyInList.pictureLinks.length > 0
                                                        && inspectReplyInList.pictureLinks.map(link => {
                                                            return <Image key={link} className='img' src={link} mode='aspectFill' onClick={this.showBigImage.bind(this, inspectReplyInList.pictureLinks)} />
                                                        })
                                                    } */}
                                                </View>
                                            </View>
                                        </View>
                                    )
                                })
                        }
                    </View>
                    <View className='perateButtonView'>
                        <View className='buttonView' onClick={this.reply.bind(this)}>
                            <Image className='icon' src={replyIcon} />
                            <Text className='text'>回复</Text>
                        </View>
                        <View className='sure' onClick={this.reply.bind(this)}>
                            <Image className='sure-icon' src={confirmReceipt} />
                            <Text className='sure-text'>确认收到</Text>
                        </View>
                    </View>
                </View>
            </View>
        )
    }
}
