import Taro, { Component } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { SimpleRichView } from '@common/components/rich-text'
import { SpecialActionItemType } from '../../../service/spectionAction'
import moment from 'moment'
import './index.scss'
import isEmpty from 'lodash/isEmpty'

interface LogItemProps {
    data: any,
    roles: any,
    onClick: (value: SpecialActionItemType) => void
}

interface LogItemState {

}

export default class LogItem extends Component<LogItemProps, LogItemState> {
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    onClickHandle = (item) => {
        this.props.onClick(item);
    }

    showBigImage(urls: string[]) {
        Taro.previewImage({
            urls: urls
        })
    }

    render() {
        const { data: inspect, roles } = this.props;
        if (isEmpty(inspect)) {
            return;
        }

        return (
            <View className='list-item'>
                <View className='list-item__header'>
                    <Text className='list-item__time'>{moment(inspect.createTime).format('MM/DD HH:mm')}</Text>
                    <View className='list-item__detail' onClick={this.onClickHandle.bind(this, inspect.id)}>
                        <Text className='list-item__see'>查看</Text>
                        <Text className='list-item__arrow'>></Text>
                    </View>
                </View>
                <View className='list-item__body'>
                    <View className='list-item__title'>
                        {inspect.pollutionTypeName && <Text className='inspectType'>{`【${inspect.pollutionTypeName}】`}</Text>}
                        <SimpleRichView class-name='content' content={inspect.content} />
                    </View>
                    <View className='list-item__photos'>
                        {
                            inspect.pictureLinks.slice(0, 9).map((link) => {
                                return <Image key={link} className='img' src={link} mode='aspectFill' onClick={this.showBigImage.bind(this, inspect.pictureLinks)} />
                            })
                        }
                    </View>
                </View>
                <View className='list-item__footer'>
                    <View className='list-item__address'>
                        <View className='icon'></View>
                        <Text className='text'>{inspect.address || ''}</Text>
                    </View>
                    <View className='list-item__tags'>
                        {
                            inspect.pollutionSourceName &&
                            <View className='tag-item'>
                                <Text className='text'>{inspect.pollutionSourceName}</Text>
                            </View>
                        }
                        <View className='tag-item'>
                            <Text className='text'>{inspect.status ? '已处置' : '未处置'}</Text>
                        </View>
                    </View>
                </View>
            </View>
        )
    }
}