import Taro, { Component } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import get from 'lodash/get'
import './index.scss'

interface PollutionItemProps {
    data: any,
    onEdit: (id: number) => void,
    onDetail: (id: number) => void,
    onDel: (id: number) => void
}

interface PollutionItemState {

}

export default class PollutionItem extends Component<PollutionItemProps, PollutionItemState> {
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    onEditHandle = (item, e) => {
        e.stopPropagation()
        this.props.onEdit(item);
    }

    onDetailHandle = (item) => {
        this.props.onDetail(item);
    }

    onDelHandle = (item, e) => {
        e.stopPropagation()
        this.props.onDel(item);
    }

    toThousand = (val) => {
        if (!val || isNaN(val)) {
            return ''
        }
        else if (val < 1000) {
            return `(${val}m)`
        }
        else {
            return `(${(val / 1000).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,')}km)`
        }
    }

    render() {
        const { data } = this.props;
        return (
            <View className='list-item' onClick={this.onDetailHandle.bind(this, data)}>
                <View className='left'>
                    <Text className='title'>{get(data, 'name')}</Text>
                    <Text className='cate'>{get(data, 'pollutionSourceTypeName') || ''}{data.industryName ? `-${data.industryName}` : ''}</Text>
                    <Text className='addr'>{get(data, 'address', '') || ''}{this.toThousand(get(data, 'distance', ''))}</Text>
                </View>
                <View className='right'>
                    <View className='icon' onClick={this.onEditHandle.bind(this, data)}></View>
                    <View className='icon del' onClick={this.onDelHandle.bind(this, data)}></View>
                </View>
            </View>
        )
    }
}