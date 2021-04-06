import Taro, { Config } from "@tarojs/taro";
import { SimpleRichView } from "@common/components/rich-text";
import { ComponentType } from "react";
import cn from "classnames";
import EmptyHolder from "@common/components/EmptyHolder";
import isEmpty from "lodash/isEmpty";
import ListView from "@common/components/ListView";
import { View, Image, Text, OfficialAccount } from "@tarojs/components";
import {
  getMessageList,
  Message,
  viewMessage,
  allViewMessage
} from "../../service/message";
import { formatDateShort } from '@common/utils/common';
import "./index.scss";
import { rootSourceBaseUrl } from '@common/utils/requests';
import { reportDetail } from '../../service/report'
import get from "lodash/get";

interface TaskDispatchMessageProps { }

interface TaskDispatchMessageState {
  messageList: Message[];
  offset: number;
  limit: number;
  isFocus: boolean;
  hasMore: boolean;
  isLoading: boolean;
  msgListStyle: string;
  typeListStyle: string;
  msgSelectStatus: "ALL" | "READ" | "UNREAD";
  msgSelectSource: "ALL" | "report-generate" | "inspect" | "alarm-analysis";
}

interface TaskDispatchMessage {
  props: TaskDispatchMessageProps;
  state: TaskDispatchMessageState;
}

//事件上报
const eventUpload =
  rootSourceBaseUrl + "/assets/task_dispatch_message/event_up.png";
const handEvent =
  rootSourceBaseUrl + "/assets/task_dispatch_message/hand_event.png";
const warn = rootSourceBaseUrl + "/assets/task_dispatch_message/warn.png";
const dispatch =
  rootSourceBaseUrl + "/assets/task_dispatch_message/dispatch.png";
//切换消息样式
const change = rootSourceBaseUrl + "/assets/user_join/change_division.png";

class TaskDispatchMessage extends Taro.Component {
  constructor() {
    super(...arguments);
    this.state = {
      messageList: [],
      offset: 0,
      limit: 20,
      isFocus: true,
      hasMore: true,
      isLoading: true,
      msgListStyle: "hidden",
      typeListStyle: "hidden",
      msgSelectStatus: "ALL",
      msgSelectSource: "ALL"
    };
  }

  config: Config = {
    navigationBarTitleText: "消息",
    enablePullDownRefresh: true,
    backgroundTextStyle: "dark"
  };

  componentDidMount() {
    this.getNewMessages();
  }

  componentDidShow() {
  }

  onPullDownRefresh() {
    this.getNewMessages();
    Taro.stopPullDownRefresh();
  }

  //下拉刷新
  onScrollToUpper = () => {
    this.getNewMessages();
  }

  //加载更多
  onScrollToLower = (callback) => {
    this.getMoreMessages(callback);
  }

  getNewMessages() {
    const { limit, msgSelectSource, msgSelectStatus } = this.state;
    const offset = 0;
    getMessageList(offset, limit, msgSelectSource === 'ALL' ? '' : msgSelectSource, msgSelectStatus === 'ALL' ? '' : Number((msgSelectStatus === 'READ')))
      .then((resp) => {
        const { data: { entries } } = resp;
        this.setState({
          messageList: entries,
          offset,
          hasMore: limit == entries.length,
          isLoading: false
        });
      }).catch(error => {
      });
  }

  getMoreMessages(callback?: any) {
    const { limit, offset, hasMore, messageList, msgSelectSource, msgSelectStatus } = this.state;
    if (!hasMore) { return; }

    let newOffset = offset + limit;

    getMessageList(newOffset, limit, msgSelectSource === 'ALL' ? '' : msgSelectSource, msgSelectStatus === 'ALL' ? '' : Number(msgSelectStatus === 'READ'))
      .then((resp) => {
        const { data: { entries } } = resp;
        this.setState({
          messageList: messageList.concat(entries),
          offset: newOffset,
          hasMore: limit == entries.length,
          isLoading: false
        }, () => {
          if (callback) {
            callback();
          }
        });
      }).catch(error => {
        if (callback) {
          callback();
        }
      });
  }

  getImageUrlBySourceType(type: string): string {
    switch (type) {
      case "special-activities":
        return handEvent;
      case "alarm-analysis":
        return warn;
      case "inspect":
        return eventUpload;
      case "reactive-dispatches":
      default:
        return dispatch;
    }
  }

  //查看详情
  showDetail(msg: Message) {
    const { messageList } = this.state;
    messageList.forEach(message => {
      if (message.id == msg.id) {
        message.viewed = true;
      }
    });
    this.setState({
      messageList: messageList
    });
    viewMessage(msg.id);
    switch (msg.sourceType) {
      case "special-activities":
        Taro.navigateTo({
          url: `/pages/special-action/detail?id=${msg.sourceId}`
        });
        break;
      case "alarm-analysis":
      case "alarm-analysis-construction":
        Taro.navigateTo({
          url: `/pages/alarm/site_alarm_detail?alarmId=${msg.sourceId}`
        });
        break;
      case "inspect":
        Taro.navigateTo({
          url: `/pages/works/detail?inspectId=${msg.sourceId}`
        });
        break;
      case "report-generate":
        reportDetail({ id: msg.sourceId }).then(result => {
          const data = get(result, 'data', {})
          Taro.navigateTo({
            url: `/pages/report/index?reportId=${msg.sourceId}&reportType=${data.reportType}&reportCategory=${data.reportCategory}&title=${encodeURIComponent(data.name)}`
          });
        });
        break;
      case "reactive-dispatches":
        Taro.navigateTo({
          url: `/pages/dispatch_msg_detail/index?dispatchId=${msg.sourceId}&inner=true`
        });
      case "user-join-requests-confirming":
      case "user-join-requests-pass":
      case "user-join-requests-reject":
      case "user-active-requests-pass":
      case "user-active-requests-reject":
      case "user-active-requests-confirming":
        Taro.navigateTo({
          url: `/pages/task_dispatch_new/index`
        });
      default:
        break;
    }
  }

  onShowMsgControl() {
    const { msgListStyle } = this.state;
    if (msgListStyle == "hidden") {
      this.setState({
        msgListStyle: "visible"
      });
    } else {
      this.setState({
        msgListStyle: "hidden"
      });
    }
  }

  onShowTypeControl() {
    const { typeListStyle } = this.state;
    if (typeListStyle == "hidden") {
      this.setState({
        typeListStyle: "visible"
      });
    } else {
      this.setState({
        typeListStyle: "hidden"
      });
    }
  }

  //选择消息状态
  onSelectMsgStatus(msgStatus: string) {
    this.setState({
      msgSelectStatus: msgStatus,
      typeListStyle: "hidden",
      msgListStyle: "hidden",
      messageList: [],
      offset: 0,
      limit: 20,
      hasMore: true,
      isLoading: true,
    }, () => {
      this.getNewMessages()
    });
  }

  onSelectMsgType(sourceType: string) {
    this.setState({
      msgSelectSource: sourceType,
      typeListStyle: "hidden",
      msgListStyle: "hidden",
      messageList: [],
      offset: 0,
      limit: 20,
      hasMore: true,
      isLoading: true,
    }, () => {
      this.getNewMessages()
    });
  }

  //全部已读
  onAllRead() {
    const { messageList } = this.state;
    let readMessageList: Message[] = [];
    let messageIds: number[] = [];
    messageList.forEach(msg => {
      msg.viewed = true;
      readMessageList.push(msg);
      messageIds.push(msg.id);
    });
    allViewMessage();
    this.setState({
      messageList: readMessageList
    });
    Taro.showToast({
      title: "消息标记已读成功",
      mask: true,
      icon: "none",
      duration: 2000
    });
  }

  render() {
    let {
      messageList,
      isFocus,
      hasMore,
      isLoading,
      msgListStyle,
      typeListStyle,
      msgSelectStatus,
      msgSelectSource
    } = this.state;
    let isEmptyData = !messageList || messageList.length == 0;
    let msgStatusContent =
      msgSelectStatus == "ALL"
        ? "全部消息"
        : msgSelectStatus == "READ"
          ? "全部已读"
          : "全部未读";
    let msgTypeContent = "全部类型";
    switch (msgSelectSource) {
      case "alarm-analysis":
        msgTypeContent = "报警消息";
        break;
      case "inspect":
        msgTypeContent = "事件消息";
        break;
      case "report-generate":
        msgTypeContent = "报告消息";
        break;
      case "ALL":
      default:
        msgTypeContent = "全部类型";
        break;
    }

    const showEmpty = (
      <View className="empty">
        <EmptyHolder text="暂无消息" />
      </View>
    );
    let messageListData = messageList
      .filter(msg => {
        if (msgSelectStatus == "ALL") {
          return true;
        } else if (msgSelectStatus == "READ") {
          return msg.viewed;
        } else {
          return !msg.viewed;
        }
      })
      .filter(msg => {
        if (msgSelectSource == "ALL") {
          return true;
        } else {
          return msg.sourceType == msgSelectSource;
        }
      });
    isEmptyData = messageListData.length == 0;
    const showInspectList = messageListData
      .map((msg: Message) => {
        return (
          <View
            key={msg.id}
            className="view_item"
            onClick={this.showDetail.bind(this, msg)}
          >
            <View className="view_head">
              <View className="icon_group">
                <Image
                  className="message_icon"
                  src={this.getImageUrlBySourceType(msg.sourceType)}
                ></Image>
                {!msg.viewed && <Text className="read_tag"></Text>}
              </View>
              <View className="message_title">
                <Text className="title">{msg.title}</Text>
              </View>
            </View>
            <View className="message_time">
              <Text className="time">{formatDateShort(msg.createTime)}</Text>
            </View>
            <View className="view_body">
              <View className="view_detail">
                <SimpleRichView
                  class-name=""
                  content={(msg && msg.content.trim()) || ""}
                  onAtClick={() => { }}
                  onTagClick={() => { }}
                />
              </View>
            </View>
            <View className="view_body">
              <View className="image_group">
                {msg.pictureLinks.slice(0, 3).map(res => {
                  return <Image key={res} className="image" src={res}></Image>;
                })}
              </View>
            </View>
          </View>
        );
      });

    return (
      <View className={cn("root", { notfocus: !isFocus })}>
        <View className="message_control_head">
          <View className="control_group">
            <View className="select_group">
              <View
                className="selected"
                onClick={this.onShowMsgControl.bind(this)}
              >
                <Text className="content">{msgStatusContent}</Text>
                <Image src={change} className="icon"></Image>
              </View>
              <View
                className="select_list"
                style={{ visibility: `${msgListStyle}` }}
              >
                <Text
                  className="tip"
                  onClick={this.onSelectMsgStatus.bind(this, "ALL")}
                >
                  全部消息
                </Text>
                <Text
                  className="tip"
                  onClick={this.onSelectMsgStatus.bind(this, "UNREAD")}
                >
                  未读消息
                </Text>
                <Text
                  className="tip"
                  onClick={this.onSelectMsgStatus.bind(this, "READ")}
                >
                  已读消息
                </Text>
              </View>
            </View>
            <View className="select_group">
              <View
                className="selected"
                onClick={this.onShowTypeControl.bind(this)}
              >
                <Text className="content">{msgTypeContent}</Text>
                <Image src={change} className="icon"></Image>
              </View>
              <View
                className="select_list"
                style={{ visibility: `${typeListStyle}` }}
              >
                <Text
                  className="tip"
                  onClick={this.onSelectMsgType.bind(this, "ALL")}
                >
                  全部类型
                </Text>
                <Text
                  className="tip"
                  onClick={this.onSelectMsgType.bind(this, "report-generate")}
                >
                  报告消息
                </Text>
                <Text
                  className="tip"
                  onClick={this.onSelectMsgType.bind(this, "inspect")}
                >
                  事件消息
                </Text>
                <Text
                  className="tip"
                  onClick={this.onSelectMsgType.bind(this, "alarm-analysis")}
                >
                  报警消息
                </Text>
              </View>
            </View>
          </View>
          <View className="read_btn" onClick={this.onAllRead.bind(this)}>
            全部标记已读
          </View>
        </View>
        <View className="space"></View>
        <View className="message_group">
          <ListView
            com-class="scrollview"
            hasMore={hasMore}
            hasData={!isEmpty(messageListData)}
            onEndReached={this.onScrollToLower}
            onRefresh={this.onScrollToUpper}
            showLoading={isLoading}
          >
            {isEmptyData ? showEmpty : showInspectList}
          </ListView>
        </View>
        <OfficialAccount className="focus-comp" />
      </View>
    );
  }
}
export default TaskDispatchMessage as ComponentType;
