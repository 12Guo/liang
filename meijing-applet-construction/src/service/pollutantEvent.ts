import Taro from '@tarojs/taro'
export interface Event {
    name: string,
    code: string,
    number: number
}

/**
 * 获取各个事件详情
 */
export async function getEventsDetail(divisionCode: string, startTime: number, endTime: number) {
    let events: Event[] = [];
    try {
        let eventResponse = await Taro.request({
            url: `/meijing-inspect-server/api/v1/inspects/statistics/area-new/${divisionCode}?startTime=${startTime}&endTime=${endTime}`,
        });
        if (eventResponse.statusCode == 200) {
            events = eventResponse.data;
        }
    } catch (error) {
    }

    return events;
}

/**
 * 获取我的事件列表
 */
export async function getMyEvents() {
    return  await Taro.request({
        url: `/meijing-inspect-server/api/v1/inspects/statistics/my-new`,
    });
}

/**
 * 获取各个事件详情
 */
export async function getEventByTag(divisionCode: string, tagName: string, startTime: number, endTime: number) {
    let events: Event[] = [];
    try {
        let eventResponse = await Taro.request({
            url: `/meijing-inspect-server/api/v1/inspects/statistics/area-label-new/${divisionCode}?startTime=${startTime}&endTime=${endTime}`,
        });
        if (eventResponse.statusCode == 200) {
            eventResponse.data.map((event) => {
                if (event.name == tagName) {
                    events.push(event);
                }
            })
        }

    } catch (error) {
    }
    return events;
}