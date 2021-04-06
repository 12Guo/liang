import Taro, { Component, Config } from '@tarojs/taro'
import { View, ScrollView, Text } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import { listDepartmentByDivision } from '../../service/department'
import { list } from '../../service/pollutionType'
import { getChildren, inspectSourceByDivision, EnumSourcList } from '../../service/division'
import { getLocation } from '../../service/userDivision'
import cn from 'classnames'
import './filter.scss'
import isEmpty from 'lodash/isEmpty';

interface FilterProps {
    userStore: any;
}

interface FilterState {
    configList: any[],
    configChecked: any,
}

@inject('userStore')
@observer
export default class Filter extends Component<FilterProps, FilterState> {

    config: Config = {
        navigationBarTitleText: '筛选'
    }

    constructor(props) {
        super(props)
        const workSearchFilter = Taro.getStorageSync('work-search-filter')
        this.state = {
            configList: [
                {
                    name: 'order', title: '排序方式', items: [
                        { label: '按时间', value: 'TIME' },
                        { label: '按距离', value: 'POSITION' }
                    ]
                },
                {
                    name: 'status', title: '事件状态', items: [
                        { label: '未处置', value: 'UNDO' },
                        { label: '已处置', value: 'DONE' },
                        { label: '未指派', value: 'UNASSIGNED' }
                    ]
                },
                {
                    name: 'pollutionTypeId', title: '污染类型', items: []
                },
                {
                    name: 'departmentId', title: '部门', items: []
                },
                {
                    name: 'type', title: '巡查类型', items: [
                        { label: '巡查事件', value: 'INCIDENT' },
                        { label: '巡查工作', value: 'PATROL' },
                        { label: '督查事件', value: 'SUPERVISE' }
                    ]
                },
                {
                    name: 'divisionCode', title: '区域', items: []
                },
                {
                    name: 'sourceList', title: '来源', items: []
                },
            ],
            configChecked: workSearchFilter || {}
        }
    }

    // 部门
    getDepartment = async () => {
        const { userStore: { userDetails } } = this.props;
        try {
            const { configList } = this.state;
            const res = await listDepartmentByDivision(userDetails.divisionCode);
            const { data } = res;
            const currentDepartment = configList.find(cfg => cfg.name === 'departmentId')
            if (currentDepartment) {
                currentDepartment.items = data.map(dpt => ({
                    label: dpt.name,
                    value: dpt.id.toString()
                }))
                this.setState({
                    configList
                })
            }
        }
        catch (err) { }
    }

    // 获取来源
    getInspectSourceByDivision = async () => {
        try {
            const { configList } = this.state;
            const res = await inspectSourceByDivision();
            const { data = [] } = res;
            if (data.length > 1) {
                const currentSource = configList.find(cfg => cfg.name === 'sourceList')
                if (currentSource) {
                    currentSource.items = data.map(sc => ({
                        label: EnumSourcList[sc],
                        value: sc
                    }))
                }
            }
            this.setState({
                configList
            })
        }
        catch (err) { }
    }

    // 污染类型
    getPollutionType = async () => {
        try {
            const { configList } = this.state;
            const res = await list();
            const { data } = res;
            const currentPollutionType = configList.find(cfg => cfg.name === 'pollutionTypeId')
            if (currentPollutionType) {
                currentPollutionType.items = data.map(pt => ({
                    label: pt.name,
                    value: pt.id.toString()
                }))
                this.setState({
                    configList
                })
            }
        }
        catch (err) { }
    }

    // 区域
    getArea = async () => {
        const { userStore: { userDetails } } = this.props;
        try {
            const { configList } = this.state;
            const res = await getChildren(userDetails.divisionCode);
            const { data } = res;
            const currentArea = configList.find(cfg => cfg.name === 'divisionCode')
            if (currentArea) {
                currentArea.items = data.map(ca => ({
                    label: ca.name,
                    value: ca.code
                }))
                this.setState({
                    configList
                })
            }
        }
        catch (err) { }
    }

    // 选择
    onCheck = (name: string, item: any) => {
        const { configChecked } = this.state
        const arrOnlySelect = ['order', 'status', 'divisionCode']
        let currentChecked = configChecked[name]
        if (isEmpty(currentChecked)) {
            currentChecked = item.value
        }
        else {
            const arrCurrent = currentChecked.split(',')
            const findIndex = arrCurrent.findIndex(cfg => cfg == item.value)
            if (findIndex > -1) {
                arrCurrent.splice(findIndex, 1)
            }
            else {
                if (arrOnlySelect.includes(name) && arrCurrent.length > 0) {
                    arrCurrent.splice(findIndex, 1)
                }
                arrCurrent.push(item.value)
            }
            currentChecked = arrCurrent.join(',')
        }
        configChecked[name] = currentChecked
        if (!configChecked[name]) {
            delete configChecked[name]
        }
        this.setState({
            configChecked
        })
    }

    componentWillMount() {
        this.getDepartment()
        this.getPollutionType()
        this.getArea()
        this.getInspectSourceByDivision()
    }

    saveBack = () => {
        const { configChecked } = this.state
        Taro.setStorageSync('work-search-filter', configChecked)
        Taro.navigateBack()
    }

    onOk = async () => {
        const { configChecked } = this.state
        if (configChecked.order == 'POSITION') {
            const position = await getLocation()
            configChecked.latitude = position.latitude
            configChecked.longitude = position.longitude
        }
        else {
            delete configChecked.latitude
            delete configChecked.longitude
        }
        this.setState({
            configChecked
        }, this.saveBack)
    }

    onReset = () => {
        Taro.setStorageSync('work-search-filter', {})
        this.setState({
            configChecked: {}
        })
    }

    render() {
        const { configList, configChecked } = this.state;

        return (
            <View className='filter'>
                <ScrollView
                    className='filter__body'
                    scrollY
                >
                    <View className='container'>
                        {
                            configList.filter(cfg => !isEmpty(cfg.items)).map(config => (
                                <View key={config.name} className='module-item'>
                                    <Text className='title'>{config.title}</Text>
                                    <View className='list'>
                                        {
                                            config.items.map(item => (
                                                <Text key={item.value}
                                                    className={cn('list-item', { active: configChecked[config.name] && configChecked[config.name].split(',').includes(item.value) })}
                                                    onClick={this.onCheck.bind(this, config.name, item)}>{item.label}</Text>
                                            ))
                                        }
                                    </View>
                                </View>
                            ))
                        }
                    </View>
                </ScrollView>
                <View className='filter__footer'>
                    <Text className='btn' onClick={this.onReset}>重置</Text>
                    <Text className='btn confirm' onClick={this.onOk}>确认</Text>
                </View>
            </View>
        )
    }
}