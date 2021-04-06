import Taro, { Component } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { SimpleRichView } from '@common/components/rich-text';
import get from 'lodash/get'
import './index.scss'
import moment from 'moment'
import isEmpty from 'lodash/isEmpty';
import { inspectTypeText } from '../../../utils/common'

interface PatrolItemProps {
    data: any,
    onDetail: (item: any) => void,
}

interface PatrolItemState {

}

export default class PatrolItem extends Component<PatrolItemProps, PatrolItemState> {
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    onDetailHandle = (item) => {
        this.props.onDetail(item)
    }

    render() {
        const { data } = this.props;
        return (
            <View className='list-item' onClick={this.onDetailHandle.bind(this, data)}>
                <View className='left'>
                    <Image className='img' src={get(data, 'pictureLinks[0]')} />
                </View>
                <View className='right'>
                    <View className='title'>
                        <Text className='tag'>{inspectTypeText(get(data, 'inspectInfo.type'), get(data, 'inspectInfo.supervise'))}</Text>
                        {
                            isEmpty(get(data, 'inspectInfo.content')) && (
                                <Text className='noData'>{get(data, 'inspectInfo.reportUserName')}参与了日常巡查</Text>
                            )
                        }
                        <SimpleRichView class-name='richTxt' content={get(data, 'inspectInfo.content')} />
                    </View>
                    <View className='subInfo'>
                        <Text className='time'>{moment(get(data, 'inspectInfo.createTime')).format('MM/DD HH:mm')}</Text>
                        <Text className='author'>发布人：{get(data, 'inspectInfo.reportUserName')}</Text>
                    </View>
                </View>
            </View>
        )
    }
}