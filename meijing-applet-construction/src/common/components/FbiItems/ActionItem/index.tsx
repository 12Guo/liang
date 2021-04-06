import Taro, { Component } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { SpecialActionItemType } from '../../../service/spectionAction'
import moment from 'moment'
import './index.scss'

interface ActionItemProps {
    data: SpecialActionItemType,
    onClick: (value: SpecialActionItemType) => void
}

interface ActionItemState {

}

export default class ActionItem extends Component<ActionItemProps, ActionItemState> {
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    onClickHandle = (item) => {
        this.props.onClick(item);
    }

    render() {
        const { data = {} } = this.props;
        return (
            <View className='action-item' onClick={this.onClickHandle.bind(this, data)}>
                <Image className='left' src={data.typeImageUrl} />
                <View className='right'>
                    <Text className='title'>{data.name}</Text>
                    <View className='sub'>
                        <Text className='sub_title'>巡查次数</Text>
                        <Text className='sub_num'>{data.patrol}</Text>
                    </View>
                    <View className='bottom'>
                        <Text className='time'>{`${data.beginTime ? moment(data.beginTime).format("YYYY/MM/DD") : ''}至${data.endTime ? moment(data.endTime).format("YYYY/MM/DD") : ''}`}</Text>
                    </View>
                </View>
            </View>
        )
    }
}