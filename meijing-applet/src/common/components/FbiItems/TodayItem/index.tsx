import Taro, { Component } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { SimpleRichView } from '@common/components/rich-text'
import { rootConstructionSourceBaseUrl } from '../../../utils/requests'
import moment from 'moment'
import './index.scss'
import isEmpty from 'lodash/isEmpty'
import get from 'lodash/get'

// @ts-ignore
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

const IconUrgent = `${rootConstructionSourceBaseUrl}/assets/pages/index/jinji.png`

const SiteType = {
    SENTRY: `${rootConstructionSourceBaseUrl}/assets/pages/index/shipin.png`,
    PATROL: `${rootConstructionSourceBaseUrl}/assets/pages/index/xuncha2.png`,
    SUPERVISE: `${rootConstructionSourceBaseUrl}/assets/pages/index/ducha.png`,
    INSPECT_WORK: `${rootConstructionSourceBaseUrl}/assets/pages/index/xunchagongzuo.png`,
}

const IconComplete = `${rootConstructionSourceBaseUrl}/assets/pages/index/chuzhiwancheng.png`

const IconPlaceHolder = `${rootConstructionSourceBaseUrl}/assets/pages/index/placeHolder.png`

interface TodayItemProps {
    data: any
}

interface TodayItemState {

}

export default class TodayItem extends Component<TodayItemProps, TodayItemState> {
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    onDetail = () => {
        const { data } = this.props
        Taro.navigateTo({
            url: `/pages/works/detail?inspectId=${data.inspectId}`
        })
    }

    render() {
        const { data = {} } = this.props
        return (
            <View className='list-item' onClick={this.onDetail}>
                <View className='left'>
                    <Image className='img' src={SiteType[data.type || 'PATROL']} />
                </View>
                <View className='center'>
                    <View className='center-top'>
                        <Text className='title'>{get(data, 'pollutionSourceName', '') || ''}</Text>
                        {/* <Image className='img' src={IconUrgent} /> */}
                    </View>
                    <View className='center-center'>
                        <SimpleRichView content={data.content} onAtClick={() => { }} onTagClick={() => { }} />
                    </View>
                    <View className='center-bottom'>
                        {data.superviseDepartmentName && <Text className='tag'>{data.superviseDepartmentName}</Text>}
                        {data.inspectorName && <Text className='tag'>{`巡查员：${data.inspectorName}`}</Text>}
                    </View>
                </View>
                <View className='right'>
                    <Image className='img' src={get(data, 'pictureUrls[0]', IconPlaceHolder)} />
                    <Text className='time'>{moment(data.createTime).fromNow()}</Text>
                </View>
                {data.status && <Image className='status' src={IconComplete} />}
            </View>
        )
    }
}