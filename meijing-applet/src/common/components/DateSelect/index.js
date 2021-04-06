import Taro, { PureComponent } from '@tarojs/taro';
import { View, Text, Button, Block, Picker } from '@tarojs/components'
import Dialog from '../Dialog/index'
import moment from 'moment'
import { AtModal } from "taro-ui"
import './index.scss'

class Index extends PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            startDate: props.startDate,
            endDate: props.endDate,
            startDateDialog: moment().startOf('day').valueOf(),
            endDateDialog: moment().endOf('day').valueOf(),
            isHidden: true,
            isActive: 1
        }
    }

    componentWillReceiveProps(nextProps) {
        if ((nextProps.startDate != this.props.startDate) || (nextProps.endDate != this.props.endDate)) {
            this.setState({
                startDate: nextProps.startDate,
                endDate: nextProps.endDate,
            })
        }
    }

    onStartDateChange = e => {
        this.setState({
            startDateDialog: e.detail.value
        })
    }
    onEndDateChange = e => {
        this.setState({
            endDateDialog: e.detail.value
        })
    }

    onConfirm = () => {
        const { startDateDialog, endDateDialog } = this.state
        if (startDateDialog > endDateDialog) {
            Taro.showToast({
                title: '开始时间不能大于结束时间',
                icon: 'none',
                duration: 2000
            })
            return;
        }
        this.props.onConfirm(moment(startDateDialog).startOf('day').valueOf(), moment(endDateDialog).endOf('day').valueOf())
        this.setState({
            isHidden: true,
            startDate: startDateDialog,
            endDate: endDateDialog
        })
    }

    onCancel = () => {
        this.setState({
            isHidden: true,
        })
    }

    onOpenDialog = () => {
        const { startDate, endDate } = this.state
        this.setState({
            isHidden: false,
            startDateDialog: startDate,
            endDateDialog: endDate
        })
    }

    render() {
        const { startDate, endDate, isHidden, startDateDialog, endDateDialog } = this.state
        return (
            <View className="flex_row">
                <View className="content content--label" onClick={this.onOpenDialog}>
                    <View>{moment(startDate).format('YYYY/MM/DD')}</View>
                    至
                    <View>{moment(endDate).format('YYYY/MM/DD')}</View>
                    <View className="arrow_down"></View>
                </View>

                <AtModal
                    onCancel={this.onCancel}
                    onClose={this.onCancel}
                    isOpened={!isHidden}>
                    <AtModalContent>
                        <View className="content min">
                            <Picker className={`${this.state.isActive === 1 ? 'picker_selected' : 'picker'}`} mode='date' start="2000-01-01" end={moment(endDateDialog).format('YYYY-MM-DD')} onChange={this.onStartDateChange} onClick={() => { this.setState({ isActive: 1 }) }}>
                                <View>
                                    {moment(startDateDialog).format('YYYY-MM-DD')}
                                </View>
                            </Picker>
                            至
                        <Picker className={`${this.state.isActive === 2 ? 'picker_selected' : 'picker'}`} mode='date' start={moment(startDateDialog).format('YYYY-MM-DD')} end={moment().format('YYYY-MM-DD')} onChange={this.onEndDateChange} onClick={() => { this.setState({ isActive: 2 }) }}>
                                <View>
                                    {moment(endDateDialog).format('YYYY-MM-DD')}
                                </View>
                            </Picker>
                        </View>
                    </AtModalContent>
                    <AtModalAction >
                        <View className="bottom_button">
                            <View className='cancel' onClick={this.onCancel}>取消</View>
                            <View className='confirm' onClick={this.onConfirm}>确定</View>
                        </View>
                    </AtModalAction>
                </AtModal>


            </View>
        )
    }
}

export default Index