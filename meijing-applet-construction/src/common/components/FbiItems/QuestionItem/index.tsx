import Taro, { Component } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { rootConstructionSourceBaseUrl } from '../../../utils/requests'
import { SimpleRichView } from '@common/components/rich-text'
import cn from 'classnames'
import moment from 'moment'
import './index.scss'

interface QuestionItemProps {
    data: any;
    isLast: boolean;
}

interface QuestionItemState {

}

export default class QuestionItem extends Component<QuestionItemProps, QuestionItemState> {
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    showBigImage(urls: string[]) {
        Taro.previewImage({
            urls: urls
        })
    }



    render() {
        const { data = {}, isLast } = this.props
        return (
            <View className={cn('list-item', { 'list-item--last': isLast })} >
                <View className={cn('icon_out', { 'icon_out--undisposed': !data.status })}>
                    <View className='icon_in'></View>
                </View>
                <View className='data-content'>
                    <Text className='time'>{moment(data.startTime).format('YYYY/MM/DD HH:mm')}</Text>
                    {/* <Text className='txt'>{data.content || ''}</Text> */}
                    <SimpleRichView class-name='' content={data.content} />
                    <View className='images'>
                        {
                            (data.pictureUrls || []).map((item, index) => <Image key={index} className='img' src={item} onClick={this.showBigImage.bind(this, data.pictureUrls)} />)
                        }
                    </View>
                </View>
            </View>
        )
    }
}