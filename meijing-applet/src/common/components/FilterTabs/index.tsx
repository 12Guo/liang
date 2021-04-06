import Taro, { Component } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import cn from 'classnames'
import { rootSourceBaseUrl } from '@common/utils/requests'

import './index.scss'
import isEmpty from 'lodash/isEmpty'

const arrowImg = `${rootSourceBaseUrl}/assets/common/arrow.png`

export interface FilterTabsType {
    id: string | number,
    name: string
}

interface FilterTabsProps {
    currentDepart?:string                                   //当前部门
    isMore: boolean                                         // 当前more图标状态（默认下）
    data: Array<FilterTabsType>,                            // 默认占位显示
    tabId: string | number,                                 // 当前选中的tabId
    onMore?: (value: void) => void,                          // 下拉图标点击切换
    onTab: (value: any) => void,                            // 栏目切换
    rowNum?: number,                                         // 每列显示数量
    showFilter?: boolean,
    onFilter?: () => void,
    showDepartment?: boolean,
    onDepartment?: () => void,
    storageKey?: string,
}

interface FilterTabsState {

}

export default class FilterTabs extends Component<FilterTabsProps, FilterTabsState> {
    static externalClasses = ['com-class']
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    onToggleMoreHandle = () => {
        this.props.onMore && this.props.onMore()
    }

    onTabItemChange = (item) => {
        this.props.onTab(item);
    }

    onFilterHandle = () => {
        const { onFilter } = this.props
        onFilter && onFilter()
    }

    onDepartmentHandle = () => {
        const { onDepartment } = this.props
        onDepartment && onDepartment()
    }

    render() {
        const { data, tabId, isMore = false, rowNum = 4, showFilter = false, showDepartment = false, storageKey = 'work-search-filter',currentDepart} = this.props;
        const workSearchFilter = Taro.getStorageSync(storageKey)
        if (!data) { return; }
        let showMore = data.length > 4;
        return (
            <View className={`filter-tabs com-class ${this.props['com-class']} ` + (showMore && isMore ? 'show' : '')}>
                <View className='tabs-default'>
                    {
                        data.slice(0, 4).map(item => (
                            <View key={item.id}
                                className={'item' + (item.id == tabId ? ' active' : '') + (item.id == '0' ? ' all' : '')}
                                onClick={this.onTabItemChange.bind(this, item)}
                            >
                                <Text className='title'>{item.name}</Text>
                            </View>
                        ))
                    }

                    {
                        showMore ? (
                            <View className='item more' onClick={this.onToggleMoreHandle}>
                                <Image src={arrowImg} className='img' />
                            </View>
                        ) : (
                                <View className='item' style={{ flex: rowNum - data.length }}></View>
                            )
                    }

                    {
                        showFilter && (
                            <View className={cn('filter', { active: !isEmpty(workSearchFilter) })} onClick={this.onFilterHandle}>
                                <Text className='txt'>筛选</Text>
                                <View className='icon'></View>
                            </View>
                        )
                    }

                    {
                        showDepartment && (
                            <View className={cn('filter filter--department')} onClick={this.onDepartmentHandle}>
                                <Text className='txt'>{currentDepart ? currentDepart : '全部部门'}</Text>
                            </View>
                        )
                    }
                </View>
                <View className='tabs-more'>
                    {
                        data.map(item => (
                            <View key={item.id}
                                className={'more_item' + (item.id == tabId ? ' active' : '')}
                                onClick={this.onTabItemChange.bind(this, item)}
                            >
                                <Text className='title'>{item.name}</Text>
                            </View>
                        ))
                    }
                </View>
                <View className='tabs-mask'></View>
            </View>
        )
    }
}