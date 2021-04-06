import Taro, { Component } from '@tarojs/taro'
import { View, Text, Block } from '@tarojs/components'
import './index.scss'
import isEmpty from 'lodash/isEmpty'
import get from 'lodash/get'

interface GoalItemProps {
    data: any;
    onAdd?: () => void;
}

interface GoalItemState {

}

export default class GoalItem extends Component<GoalItemProps, GoalItemState> {
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    onAdd = () => {
        const { onAdd } = this.props
        onAdd && onAdd()
    }

    getGoalValue = (actualValue, goalValue) => {
        if (actualValue && goalValue) {
            if (actualValue > goalValue) {
                return `差距 ${actualValue - goalValue}`
            }
            else {
                return `当前达成`
            }
        }
        else {
            return `差距 --`
        }
    }

    render() {
        const { data } = this.props
        return (
            <View className='list-item'>
                {isEmpty(data) ?
                    (
                        <View className='list-item_empty' onClick={this.onAdd}>
                            <View className='img'></View>
                            <View className='txt'>配置年度目标</View>
                        </View>
                    ) : <Block>
                        <View className='left'></View>
                        <View className='center'>
                            <View className='center_tp'>
                                <Text className='title'>{get(data, 'name')}</Text>
                                {data && (data.goalValue < data.actualValue) && <Text className='tag'>未达标</Text>}
                            </View>
                            <View className='center_bt'>
                                <Text>目标 {get(data, 'goalValue', '--')}</Text>
                                <Text className='split'>|</Text>
                                <Text>{(data && data.type === 'VALUE_GOAL') ? data.surplusControlValue < 0 ? '无法达成' : `余控 ${data.surplusControlValue || '--'}` : isEmpty(data) ? '--' : this.getGoalValue(data.actualValue, data.goalValue)}</Text>
                            </View>
                        </View>
                        <View className='right'>
                            <View className='right_container'>
                                <Text className='number'>{get(data, 'actualValue')}</Text>
                                <Text className='unit'>{(data && data.type === 'VALUE_GOAL') ? get(data, 'unit') : `/${get(data, 'totalRank')}`}</Text>
                            </View>
                        </View>
                    </Block>}
            </View>
        )
    }
}