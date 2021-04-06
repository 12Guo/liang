import Taro, { PureComponent } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import WorkItem from './workItem'

import './index.scss'
import get from 'lodash/get'

interface MyWorkProps {
    data: any;
}

interface MyWorkState {

}

export default class MyWork extends PureComponent<MyWorkProps, MyWorkState> {
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    render() {
        const { data = {} } = this.props
        let inspectInfoList = data.inspectInfoList || []
        if (data.shouldPatrolNum != 0) {
            inspectInfoList.unshift({
                content: `${data.alreadyPatrolNum}/${data.shouldPatrolNum}`,
                status: data.alreadyPatrolNum >= data.shouldPatrolNum,
                type: "DEFAULT"
            })
        }
        return (
            <View className='my-work'>
                <View className='my-work-top'>
                    <Text className='title'>{get(data, 'pollutionSourceName')}</Text>
                    <View className='num'><Text className='strong'>{get(data, 'finishedTotal', 0)}</Text>/{get(data, 'total', 0)}</View>
                </View>
                <View className='my-work-body'>
                    {
                        inspectInfoList.map(item => <WorkItem key={item.id + item.id} data={item} />)
                    }
                </View>
            </View>
        )
    }
}