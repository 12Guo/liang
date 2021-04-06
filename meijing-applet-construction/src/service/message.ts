import Taro from "@tarojs/taro";

export interface Message {
  id: number;
  divisionCode: string;
  sourceType: string;
  sourceId: string;
  title: string;
  content: string;
  pictureOssKeys: string;
  pictureLinks: string[];
  createTime: number;
  viewed: boolean;
}

/**
 * 获取消息列表
 */
export async function getMessageList(offset: number, limit: number) {
  return Taro.request({
    url: `/meijing-message-server/api/v1/messages/current-user?offset=${offset}&limit=${limit}`,
    method: "GET"
  });
}

/**
 * 获取未读取的消息数目
 */
export async function getUnReadMessageCount() {
  return Taro.request({
    url: `/meijing-message-server/api/v1/messages/current-user/unread-count`,
    method: "GET"
  });
}

/**
 * 查看消息
 */
export async function viewMessage(id: number) {
  return Taro.request({
    url: `/meijing-message-server/api/v1/messages/${id}/view`,
    method: "POST"
  });
}

/**
 * 批量查看消息
 */
export async function batchViewMessage(messageIds: number[]) {
  return Taro.request({
    url: `/meijing-message-server/api/v1/messages/batch-view`,
    method: "POST",
    data: messageIds
  });
}

/**
 * 消息全部已读
 */
export async function allViewMessage() {
  return Taro.request({
    url: `/meijing-message-server/api/v1/messages/all-view`,
    method: "POST"
  });
}

/**
 * 判断用户是否已经关注公众号
 */
export async function focusOnServiceAccount() {
  return Taro.request({
    url: `/simple-user-server/api/v1/users/focus-on-service-account`,
    method: "GET"
  });
}
