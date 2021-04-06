import Taro, { Component, Config } from '@tarojs/taro';
import { observer, inject } from '@tarojs/mobx';
import { View, Text, ScrollView, Picker } from '@tarojs/components';
import { AtModal, AtModalHeader, AtModalContent, AtModalAction } from "taro-ui"
import LogItem from '@common/components/FbiItems/LogItem';
import ListView from '@common/components/ListView'
import { list } from '../../service/pollutionType'
import range from 'lodash/range'
import get from 'lodash/get'
import { getPageData } from '@common/utils/common'
import { listDepartmentByDivision } from '../../service/department'
import EmptyHolder from '@common/components/EmptyHolder'
import { logs, logDownload, logDownloadAsync, logDownloadLink, logFileInfo, InspectInfoTypeInWorkSearchs } from '../../service/inspect'
import moment from 'moment'
import isEmpty from 'lodash/isEmpty'
import './index.scss'


const now = new Date().getTime()
const hours = range(0, 24).map(item => ({ label: `${item}时`, value: item }))

const defaultDepartment = {
    divisionCode: "",
    code: "",
    name: "全部部门"
}

const defaultEvent = {
    code: "all",
    name: "全部类型"
}

const defaultTime = { label: '8时', value: 8 }

const defaultType = { label: '全部记录', value: '' };
const types = [defaultType, ...InspectInfoTypeInWorkSearchs];

const defaultStatus = { label: '全部状态', value: '' };

const statusList = [defaultStatus, { label: '未处置', value: 'false' }, { label: '已处置', value: 'true' }];

//定时器
let timer: any = null;
//轮询变量
let pollingTime: any = null;
//轮询时长:分钟
const pollingDuration = 3;
//文件下载地址
let fileLink = '';

interface LogProps {
    userStore: any;
}

interface LogState {
    departments: any[],
    selectedDepartment: any,
    events: any[],
    selectedEvent: any,
    startDay: string,
    endDay: string,
    startTime: any,
    endTime: any,
    dataList: any,
    isInit: boolean,
    hasMore: boolean,
    offset: number,
    limit: number,
    showPop: boolean,
    isLoading: boolean,
    selectedType: any,
    selectedStatus: any,
    typeDisabled: boolean,
}


@inject('userStore')
@observer
class LogPage extends Component<LogProps, LogState> {
    config: Config = {
        navigationBarTitleText: '工作日志'
    }

    static externalClasses = ['com-class']

    constructor(props) {
        super(props);

        this.state = {
            departments: [defaultDepartment],
            selectedDepartment: defaultDepartment,
            events: [defaultEvent],
            selectedEvent: defaultEvent,
            startDay: moment(now - 24 * 60 * 60 * 1000).format('YYYY/MM/DD'),
            endDay: moment(now).format('YYYY/MM/DD'),
            startTime: defaultTime,
            endTime: defaultTime,
            dataList: [],
            isInit: true,
            hasMore: true,
            offset: 0,
            limit: 20,
            showPop: false,
            isLoading: true,
            selectedType: defaultType,
            selectedStatus: defaultStatus,
            typeDisabled: false,
        }
    }

    componentWillUnmount() {
        clearTimeout(timer);
    }

    componentDidMount() {
        this.getPollutionType();
        this.getDepartment();
        this.onSearch(true);
    }

    // 污染类型
    getPollutionType = async () => {
        const res = await list();
        const { data } = res;
        this.setState({
            events: [
                defaultEvent,
                ...data
            ]
        })
    }

    // 部门
    getDepartment = async () => {
        const { userStore: { userDetails } } = this.props;
        const res = await listDepartmentByDivision(userDetails.divisionCode);
        const { data } = res;
        this.setState({
            departments: [
                defaultDepartment,
                ...data
            ]
        })
    }

    componentDidShow() {
        const currentPageData = getPageData()
        const { currentDepartment = {} } = currentPageData
        this.setState({
            selectedDepartment: currentDepartment
        })
    }

    onDepartmentChange = e => {
        const { userStore: { userDetails: currentUserDetails } } = this.props;
        Taro.navigateTo({
            url: `/pages/department_select/index?dataCode=currentDepartment&divisionCode=${currentUserDetails.divisionCode}`
        });
    }

    onTypeChange = e => {
        let index = e.detail.value;
        if (index == 1) {
            //选择巡查工作
            this.setState({
                selectedType: types[e.detail.value],
                selectedEvent: defaultEvent,
                selectedStatus: defaultStatus,
                typeDisabled: true,
            });
        } else {
            this.setState({
                selectedType: types[e.detail.value],
                typeDisabled: false,
            });
        }
    }

    onEventChange = e => {
        this.setState({
            selectedEvent: this.state.events[e.detail.value]
        })
    }

    onStatusChange = e => {
        this.setState({
            selectedStatus: statusList[e.detail.value]
        })
    }

    onDateStartChange = e => {
        this.setState({
            startDay: e.detail.value.replace(/-/g, '/')
        })
    }

    onDateEndChange = e => {
        this.setState({
            endDay: e.detail.value.replace(/-/g, '/')
        })
    }

    onTimeStartChange = e => {
        this.setState({
            startTime: hours[e.detail.value]
        })
    }

    onTimeEndChange = e => {
        this.setState({
            endTime: hours[e.detail.value]
        })
    }

    fetchList = (callback?: any) => {
        const { startDay, startTime, endDay, endTime, isInit, selectedDepartment, selectedEvent,
            selectedType, selectedStatus, dataList, limit, offset, hasMore } = this.state;

        if (!hasMore) {
            if (callback) {
                callback();
            }
            return;
        }

        logs({
            startTime: new Date(`${startDay} ${startTime.value}:00:00`).getTime(),
            endTime: new Date(`${endDay} ${endTime.value}:00:00`).getTime(),
            departmentCode: get(selectedDepartment, 'code', ''),
            pollutionTypeId: get(selectedEvent, 'id', ''),
            type: get(selectedType, 'value', ''),
            status: get(selectedStatus, 'value', ''),
            offset,
            limit
        }).then(res => {
            const { data: { entries = [] } } = res;
            let newList = [];
            if (isInit) {
                newList = entries;
            } else {
                newList = dataList.concat(entries);
            }
            this.setState({
                isInit: false,
                dataList: newList,
                hasMore: limit == entries.length,
                offset: offset + limit,
                isLoading: false
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

    onSearch = (isInit: boolean = false) => {
        this.setState({
            isInit: true,
            hasMore: true,
            dataList: [],
            offset: 0,
            isLoading: isInit
        }, () => {
            this.fetchList();
        })
    }

    isMax = (size: number): boolean => {
        return size > 10 * 1024 * 1024;
    }

    downLoadFile = (params: any) => {
        Taro.showLoading({ title: '文档下载中' })
        try {
            logDownloadAsync(params).then((res) => {
                if (res.data.link) {
                    Taro.hideLoading();
                    this.setState({
                        showPop: true
                    })
                    fileLink = res.data.link;
                }
                else {
                    pollingTime = new Date().getTime();
                    this.polling(params);
                }
            })
        }
        catch (err) {
            Taro.hideLoading();
            console.log(err)
        }
    }

    onDownLoad = () => {
        const { startDay, startTime, endDay, endTime, selectedDepartment, selectedEvent,
            selectedType, selectedStatus, dataList } = this.state;

        if (isEmpty(dataList)) {
            Taro.showToast({
                title: '数据为空',
                icon: 'none',
                duration: 2000
            })
            return;
        }

        let endTimeTemp = new Date(`${endDay} ${endTime.value}:00:00`).getTime();
        let params = {
            startTime: new Date(`${startDay} ${startTime.value}:00:00`).getTime(),
            endTime: endTimeTemp,
            departmentCode: get(selectedDepartment, 'code', ''),
            departmentName: selectedDepartment.id ? selectedDepartment.name : '',
            pollutionTypeId: get(selectedEvent, 'id', ''),
            type: get(selectedType, 'value', ''),
            status: get(selectedStatus, 'value', ''),
        }
        const currentTime = moment().valueOf();
        if (endTimeTemp > currentTime) {
            params.endTime = currentTime;
            this.downLoadFile(params);
        }
        else {
            this.downLoadFile(params)
        }
    }

    // 轮询
    polling = (params: any) => {
        timer = setTimeout(() => {
            logDownloadLink(params).then((res) => {
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
        }, 1000)
    }

    toDetail = (inspctId: number) => {
        Taro.navigateTo({
            url: `../works/detail?inspectId=${inspctId}`
        })
    }

    /**
     * 复制链接
     */
    onCopy = () => {
        Taro.setClipboardData({
            data: fileLink
        }).then(() => {
            this.setState({ showPop: false })
        })
    }

    render() {
        const { departments, selectedDepartment, events, selectedEvent, selectedType, selectedStatus,
            startDay, endDay, startTime, endTime, hasMore, dataList, isInit, showPop, isLoading, typeDisabled } = this.state;
        const { userStore: { userDetails } } = this.props;
        let isEmptyData = !dataList || dataList.length == 0;

        const showEmpty = (<View className='empty'><EmptyHolder text='暂无数据' /></View>)
        const renderList = dataList.map((item, index) => (
            <LogItem roles={userDetails.roles} key={item.id + index} data={item} onClick={this.toDetail.bind(this, item.id)} />
        ));

        return (
            <View className='log-page'>
                <View className='log-page__header'>
                    <View className='header__date'>
                        <View className='date-item__container'>
                            <Picker mode='date' value={moment(startDay, 'YYYY/MM/DD').format('YYYY-MM-DD')} onChange={this.onDateStartChange}>
                                <View className='date-item'>
                                    <Text className='empty'>{startDay}</Text>
                                    <View className='icon'></View>
                                </View>
                            </Picker>
                            <Picker mode='selector' range={hours} rangeKey='label' onChange={this.onTimeStartChange}>
                                <View className='date-item time-span'>
                                    <Text className='empty'>{startTime.label}</Text>
                                    <View className='icon'></View>
                                </View>
                            </Picker>
                        </View>
                        <View className='date-space'>至</View>
                        <View className='date-item__container'>
                            <Picker mode='date' value={moment(endDay, 'YYYY/MM/DD').format('YYYY-MM-DD')} onChange={this.onDateEndChange}>
                                <View className='date-item'>
                                    <Text className='empty'>{endDay}</Text>
                                    <View className='icon'></View>
                                </View>
                            </Picker>
                            <Picker mode='selector' range={hours} rangeKey='label' onChange={this.onTimeEndChange}>
                                <View className='date-item time-span'>
                                    <Text className='empty'>{endTime.label}</Text>
                                    <View className='icon'></View>
                                </View>
                            </Picker>
                        </View>
                    </View>

                    <View className='header__switch'>
                        <View className='switch-item' onClick={this.onDepartmentChange}>
                            <Text className='switch-item__text'>{get(selectedDepartment, 'name', '全部部门')}</Text>
                            <View className='switch-item__icon'></View>
                        </View>

                        <Picker mode='selector' range={types} rangeKey='label' onChange={this.onTypeChange}>
                            <View className='switch-item'>
                                <Text className='switch-item__text'>{selectedType.label}</Text>
                                <View className='switch-item__icon'></View>
                            </View>
                        </Picker>

                        <Picker mode='selector' range={statusList} rangeKey='label' disabled={typeDisabled} onChange={this.onStatusChange}>
                            <View className='switch-item'>
                                <Text className='switch-item__text'>{selectedStatus.label}</Text>
                                <View className='switch-item__icon'></View>
                            </View>
                        </Picker>

                        <Picker mode='selector' range={events} rangeKey='name' disabled={typeDisabled} onChange={this.onEventChange}>
                            <View className='switch-item'>
                                <Text className='switch-item__text'>{selectedEvent.name}</Text>
                                <View className='switch-item__icon'></View>
                            </View>
                        </Picker>

                        <Text className='date-query' onClick={this.onSearch.bind(this, true)}>
                            查询
                        </Text>
                    </View>

                    <View className='header__time'>
                    </View>
                </View>

                <View className='log-page__space'></View>

                <ListView
                    com-class='log-page__body'
                    hasMore={hasMore}
                    hasData={!isEmpty(dataList)}
                    showLoading={isLoading}
                    onRefresh={this.onSearch}
                    onEndReached={this.fetchList}
                >
                    {isEmptyData ? isInit ? null : showEmpty : renderList}
                </ListView>

                <View className='log-page__footer'>
                    <View className='btn-item' onClick={this.onDownLoad}>
                        <View className='btn-item__icon down'></View>
                        <Text className='btn-item__text'>下载文档</Text>
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
        );
    }
}

export default LogPage;