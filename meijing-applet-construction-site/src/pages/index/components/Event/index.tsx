import Taro, { Component } from '@tarojs/taro';
import { AtIcon } from 'taro-ui'
import { View, Text, Image } from '@tarojs/components';
import moment from 'moment';
import { rootConstructionSourceBaseUrl } from '@common/utils/requests';
import { SimpleRichView } from "@common/components/rich-text";
import "./index.scss"

const xunchaEventImg = `${rootConstructionSourceBaseUrl}/assets/pages/statistics/xuncha-event.png`;
const duchaEventImg = `${rootConstructionSourceBaseUrl}/assets/pages/statistics/ducha-event.png`;
const shipinImg = `${rootConstructionSourceBaseUrl}/assets/pages/statistics/shipinshaobin.png`;

const eventType = {
    SENTRY: shipinImg,
    PATROL: xunchaEventImg,
    SUPERVISE: duchaEventImg
}

interface EventProps {
    event: {
        inspectId: string;
        type: string;
        content: string;
        createTimeMills: string;
        disposalTimeoutMills: string;
        pictureLink: string
    }
}

interface EventState {
    type: string;
    time: number;
    createTime: string
    timeDetail: string
}

moment.locale('zh-cn', {
    months: '一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月'.split('_'),
    monthsShort: '1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月'.split('_'),
    weekdays: '星期日_星期一_星期二_星期三_星期四_星期五_星期六'.split('_'),
    weekdaysShort: '周日_周一_周二_周三_周四_周五_周六'.split('_'),
    weekdaysMin: '日_一_二_三_四_五_六'.split('_'),
    longDateFormat: {
        LT: 'HH:mm',
        LTS: 'HH:mm:ss',
        L: 'YYYY-MM-DD',
        LL: 'YYYY年MM月DD日',
        LLL: 'YYYY年MM月DD日Ah点mm分',
        LLLL: 'YYYY年MM月DD日ddddAh点mm分',
        l: 'YYYY-M-D',
        ll: 'YYYY年M月D日',
        lll: 'YYYY年M月D日 HH:mm',
        llll: 'YYYY年M月D日dddd HH:mm'
    },
    meridiemParse: /凌晨|早上|上午|中午|下午|晚上/,
    meridiemHour: function (hour, meridiem) {
        if (hour === 12) {
            hour = 0;
        }
        if (meridiem === '凌晨' || meridiem === '早上' ||
            meridiem === '上午') {
            return hour;
        } else if (meridiem === '下午' || meridiem === '晚上') {
            return hour + 12;
        } else {
            // '中午'
            return hour >= 11 ? hour : hour + 12;
        }
    },
    meridiem: function (hour, minute, isLower) {
        const hm = hour * 100 + minute;
        if (hm < 600) {
            return '凌晨';
        } else if (hm < 900) {
            return '早上';
        } else if (hm < 1130) {
            return '上午';
        } else if (hm < 1230) {
            return '中午';
        } else if (hm < 1800) {
            return '下午';
        } else {
            return '晚上';
        }
    },
    calendar: {
        sameDay: '[今天]LT',
        nextDay: '[明天]LT',
        nextWeek: '[下]ddddLT',
        lastDay: '[昨天]LT',
        lastWeek: '[上]ddddLT',
        sameElse: 'L'
    },
    dayOfMonthOrdinalParse: /\d{1,2}(日|月|周)/,
    ordinal: function (number, period) {
        switch (period) {
            case 'd':
            case 'D':
            case 'DDD':
                return number + '日';
            case 'M':
                return number + '月';
            case 'w':
            case 'W':
                return number + '周';
            default:
                return number;
        }
    },
    relativeTime: {
        future: '%s内',
        past: '%s前',
        s: '几秒',
        ss: '%d秒',
        m: '1分钟',
        mm: '%d分钟',
        h: '1小时',
        hh: '%d小时',
        d: '1天',
        dd: '%d天',
        M: '1个月',
        MM: '%d个月',
        y: '1年',
        yy: '%d年'
    },
    week: {
        dow: 1, // Monday is the first day of the week.
        doy: 4  // The week that contains Jan 4th is the first week of the year.
    }
})
export default class Event extends Component<EventProps, EventState> {
    constructor() {
        super(...arguments);
        this.state = {
            type: "",
            time: 0,
            createTime: "",
            timeDetail: ""
        }
    }

    componentDidMount() {
        const { createTimeMills, disposalTimeoutMills } = this.props.event;
        this.getCreateTime(createTimeMills);
        this.judgeTime(createTimeMills, disposalTimeoutMills);
    }
    // 创建时间
    getCreateTime(time) {
        this.setState({
            createTime: moment(time).fromNow()
        });
    }

    // 判断处置时间      done 处置超时     doing 处置未超时
    judgeTime(createTime, disposalTime) {
        const timeDifference = Date.now() - createTime;
        const residueTime = timeDifference - disposalTime;
        this.setState({
            type: residueTime > 0 ? "done" : "doing",
            time: residueTime,
            timeDetail: this.judgeHaveTime(residueTime)
        }, this.refershTime)
    }

    timer
    // 刷新时间，setTimeOut定5s
    refershTime = () => {
        this.timer = setInterval(() => {
            const newTime = this.state.time + 5000;
            this.setState({
                time: newTime,
                type: newTime > 0 ? "done" : "doing",
                timeDetail: this.judgeHaveTime(newTime)
            }, () => {
                this.getCreateTime(this.props.event.createTimeMills);
            })
        }, 5000);
    }

    // 判断剩余时间
    judgeHaveTime(ms: number) {
        ms = Math.abs(ms);
        const time = Math.floor(ms / 1000);  // 总的秒数  
        if (time > 24 * 60 * 60) {
            let day = Math.floor(time / (24 * 60 * 60));
            let hour = Math.floor(time / (60 * 60)) % 24;  // 总的小时%24  => 不满一天的
            let minute = Math.ceil(time / 60) % 60;
            return `${day}天${hour}小时${minute}分钟`;
        } else if (time > 60 * 60) {
            let hour = Math.floor(time / (60 * 60));  // 总的小时%24  => 不满一天的
            let minute = Math.ceil(time / 60) % 60;
            return `${hour}小时${minute}分钟`;
        } else {
            let minute = Math.ceil(time / 60);
            return `${minute}分钟`;
        }
    }

    navToWorksDetail(inspectId) {
        Taro.navigateTo({ url: "/pages/works/detail?inspectId=" + inspectId });
    }

    componentWillUnmount() {
        this.timer && clearInterval(this.timer);
    }
    render() {
        const { event } = this.props;
        const { type, createTime, timeDetail } = this.state;

        return (
            <View>
                {
                    event && (
                        <View className="event" onClick={this.navToWorksDetail.bind(this, event.inspectId)}>
                            <View className="left">
                                <Image src={eventType[event.type]} className="event-img"></Image>
                            </View>
                            <View className="center">
                                <View className="center-1">
                                    <Text className="center-1-title">工地扬尘</Text>
                                </View>
                                <View className="center-2">
                                    <SimpleRichView class-name="" content={event.content}></SimpleRichView>
                                </View>
                                {
                                    type && <View className={`center-3, ${type}`}>
                                        <AtIcon value='clock' size={16} color={type === "doing" ? "#7A8499" : '#e54545'}></AtIcon>
                                        <Text className="center-3-content">
                                            {`处置${type === "doing" ? "剩余时间：" : "已超时："}${timeDetail}`}
                                        </Text>
                                    </View>
                                }
                            </View>
                            <View className="right">
                                <Image className="event-pic" src={event.pictureLink}></Image>
                                <View className="event-time">{createTime}</View>
                            </View>
                        </View>
                    )
                }
            </View>
        )
    }
}