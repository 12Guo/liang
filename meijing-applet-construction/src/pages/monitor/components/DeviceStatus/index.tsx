import Taro, { PureComponent } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import FilterTabs, { FilterTabsType } from '@common/components/FilterTabs'
import MonitorItem from '@common/components/FbiItems/MonitorItem'
import EmptyHolder from '@common/components/EmptyHolder'

import './index.scss'
import isEmpty from 'lodash/isEmpty'

export interface DeviceStatusType {

}

interface DeviceStatusProps {
    onMore: () => void;
    data: any;
}

interface DeviceStatusState {
    tabId: string | number;
}

export default class DeviceStatus extends PureComponent<DeviceStatusProps, DeviceStatusState> {
    constructor(props) {
        super(props)
        this.state = {
            tabId: 'ALL'
        }
    }

    componentDidMount() {

    }

    onDepartment = () => {
        Taro.navigateTo({
            url: '/pages/department_select/index'
        })
    }

    tabChoose(item: FilterTabsType) {
        this.setState({
            tabId: item.id
        });
    }

    onMoreHandle = () => {
        const { onMore } = this.props
        onMore && onMore()
    }

    render() {
        const { tabId } = this.state
        const { data = [] } = this.props
        const list = data.filter(item => item.types.includes(tabId))
        return (
            <View className='device-status'>
                <Text className='title'>在线监测设备状态</Text>
                <View className='topTabView'>
                    <View className='tabs'>
                        <FilterTabs
                            com-class='filter-tabs'
                            isMore={false}
                            data={[{ id: 'ALL', name: '全部' }, { id: 'ONLINE', name: '在线' }, { id: 'OFFLINE', name: '离线' }]}
                            tabId={tabId}
                            rowNum={5}
                            onTab={this.tabChoose.bind(this)} />
                    </View>
                </View>
                <View className='body-list'>
                    {
                        //@ts-ignore
                        list.map((item, index) => <MonitorItem key={item.pollutionSourceId} data={item} />)
                    }
                    {isEmpty(list) && <View className='empty'><EmptyHolder text='暂无数据' /></View>}
                </View>
                {!isEmpty(list) && <Text className='more' onClick={this.onMoreHandle}>更多 ></Text>}
            </View>
        )
    }
}