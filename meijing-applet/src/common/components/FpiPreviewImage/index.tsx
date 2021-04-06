import Taro, { Component } from '@tarojs/taro'
import { View, Swiper, SwiperItem, Image, Text } from '@tarojs/components'
import './index.scss'

interface FpiPreviewImageProps {
    photos: any[],
    picIndex: number,
    onBack: () => void,
    onDelete: (index: number) => void,
}

interface FpiPreviewImageState {
    currentIndex: number,
}

export default class FpiPreviewImage extends Component<FpiPreviewImageProps, FpiPreviewImageState> {
    static externalClasses = ['com-class']
    constructor(props) {
        super(props)
        this.state = {
            currentIndex: this.props.picIndex
        }
    }

    onChange = () => {

    }

    onRemove = () => {
        const { currentIndex } = this.state;
        this.props.onDelete(currentIndex)
    }

    onBack = () => {
        this.props.onBack()
    }

    render() {
        const { photos } = this.props
        const { currentIndex } = this.state;
        return (
            <View className='fpi-images com-class'>
                <Swiper className='list__container'
                    indicatorColor='#999'
                    indicatorActiveColor='#333'
                    circular
                    indicatorDots
                    onChange={this.onChange}
                    current={currentIndex}
                >
                    {
                        photos.map(photo => (
                            <SwiperItem key={photo.url}>
                                <View className='list__item'>
                                    <Image className='img' src={photo.url} mode="aspectFill" />
                                </View>
                            </SwiperItem>
                        ))
                    }
                </Swiper>
                <View className='fpi-images__footer'>
                    <View className='btn-group' onClick={this.onBack}>
                        <View className='icon'></View>
                        <Text className='text'>返回</Text>
                    </View>
                    <View className='btn-group btn-del' onClick={this.onRemove}>
                        <View className='icon'></View>
                        <Text className='text'>删除</Text>
                    </View>
                </View>
            </View>
        )
    }
}