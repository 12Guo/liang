import Taro, { PureComponent } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import range from 'lodash/range'
import moment from 'moment'
import cn from 'classnames'

import './index.scss'

interface DateCycleProps {
    dateType: number;
    onChange: (options: any) => void;
}

interface DateCycleState {
    currentDate: number;
    dayList: number[];
}

export default class DateCycle extends PureComponent<DateCycleProps, DateCycleState> {
    constructor(props) {
        super(props)
        const now = moment().valueOf()
        this.state = {
            currentDate: now,
            dayList: range(-5, 1).map(item => moment(now).add(item, 'day').valueOf())
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.dateType !== this.props.dateType) {
            const now = moment().valueOf()
            this.setState({
                currentDate: now,
                dayList: range(-5, 1).map(item => moment(now).add(item, 'day').valueOf())
            }, this.onChangeHandle)
        }
    }

    onChangeHandle = () => {
        const { onChange, dateType } = this.props
        const { currentDate } = this.state
        let startTime = 0
        let endTime = 0
        switch (dateType) {
            case 0:
                startTime = moment(currentDate).startOf('day').valueOf()
                endTime = moment(currentDate).endOf('day').valueOf()
                break;
            case 1:
                const weekOfday = parseInt(moment(currentDate).format('E'))
                startTime = moment(currentDate).subtract(weekOfday - 1, 'days').startOf('day').valueOf()
                endTime = moment(currentDate).add(7 - weekOfday, 'days').endOf('day').valueOf()
                break;
            case 2:
                startTime = moment(currentDate).startOf('month').valueOf()
                endTime = moment(currentDate).endOf('month').valueOf()
                break;
        }
        onChange && onChange({ startTime, endTime })
    }

    componentDidMount() {
        this.onChangeHandle()
    }

    onStep = (step) => {
        const { dateType } = this.props
        const { dayList, currentDate } = this.state
        switch (dateType) {
            case 0:
                this.setState({
                    dayList: dayList.map(item => item + step * 24 * 60 * 60 * 1000),
                }, this.onChangeHandle)
                break;
            case 1:
                this.setState({
                    currentDate: moment(currentDate).add(step * 7, 'day').valueOf()
                }, this.onChangeHandle)
                break;
            case 2:
                this.setState({
                    currentDate: moment(currentDate).add(step, 'month').valueOf()
                }, this.onChangeHandle)
        }
    }

    onItemClick = (day) => {
        this.setState({
            currentDate: day
        }, this.onChangeHandle)
    }

    getCycleString = () => {
        const { dateType } = this.props
        const { currentDate } = this.state
        let str = ''
        if (dateType === 1) {
            const weekOfday = parseInt(moment(currentDate).format('E'))
            const lastMonday = moment(currentDate).subtract(weekOfday - 1, 'days').format('MM-DD')
            const lastSunday = moment(currentDate).add(7 - weekOfday, 'days').format('MM-DD')
            str = moment(currentDate).format('YYYY年第w周') + `(${lastMonday}至${lastSunday})`
        }
        else {
            str = moment(currentDate).format('YYYY年MM月')
        }
        return str
    }

    render() {
        const { dateType } = this.props
        const { currentDate, dayList } = this.state
        return (
            <View className='date-cycle'>
                <View className='img img--left' onClick={this.onStep.bind(this, -1)}></View>
                <View className='content'>
                    {dateType !== 0 ?
                        <Text className='cycle-txt'>{this.getCycleString()}</Text> :
                        (
                            <View className='days-container'>
                                {
                                    dayList.map((item, index) => <Text onClick={this.onItemClick.bind(this, item)} className={cn('day', { 'day--active': currentDate === item })} key={index + item}>{moment(item).format('DD')}</Text>)
                                }
                            </View>
                        )}
                </View>
                <View className='img' onClick={this.onStep.bind(this, 1)}></View>
            </View>
        )
    }
}