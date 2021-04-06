import Taro, { PureComponent } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import get from 'lodash/get'

import './index.scss'

interface TodayWorkProps {
    data: any;
    onWork: () => void;
}

interface TodayWorkState {

}

export default class TodayWork extends PureComponent<TodayWorkProps, TodayWorkState> {
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    onWorkHandle = () => {
        const { onWork } = this.props
        onWork && onWork()
    }

    render() {
        const { data = {} } = this.props
        return (
            <View className='today-work' onClick={this.onWorkHandle}>
                <Text className='title'>我的今日工作</Text>
                {(get(data, 'myWork.shouldPatrolNum', 0) != 0) && (<View className='item'>
                    <View className='nums'>
                        <Text className='txt txt--red'>{get(data, 'myWork.patrolNum', 0) || 0}</Text>
                        <Text className='txt'>/</Text>
                        <Text className='txt'>{get(data, 'myWork.shouldPatrolNum', 0) || 0}</Text>
                    </View>
                    <Text className='label'>例行巡查</Text>
                </View>)}
                {(get(data, 'myWork.shouldDisposalNum', 0) != 0) && (
                    <View className='item'>
                        <View className='nums'>
                            <Text className='txt txt--red'>{get(data, 'myWork.disposalNum', 0) || 0}</Text>
                            <Text className='txt'>/</Text>
                            <Text className='txt'>{get(data, 'myWork.shouldDisposalNum', 0) || 0}</Text>
                        </View>
                        <Text className='label'>问题处置</Text>
                    </View>
                )}
            </View>
        )
    }
}