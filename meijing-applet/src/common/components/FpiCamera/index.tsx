import Taro, { Component } from '@tarojs/taro'
import { View, Text, Camera, Image, Swiper, SwiperItem } from '@tarojs/components'
import FpiForbidCamera from '../FpiForbidCamera'
import isEmpty from 'lodash/isEmpty'
import cn from 'classnames'
import { rootSourceBaseUrl } from '../../utils/requests'
import './index.scss'


export interface Photo {
    url: string;
    rotate: number;
}

interface FpiCameraProps {
    /**
     * tab切换索引值
     */
    tabIndex: number,
    /**
     * 选择完成回调
     */
    onOK: (list: Photo[]) => void,
    /**
     * 修改标题模式
     */
    onStatus: (isShow: boolean) => void,
    /**
     * 是否拥有相机权限
     */
    isFobidden: boolean,
}


interface FpiCameraState {
    currentIndex: number,
    photos: Photo[],
    isPhoto: boolean,
    isPicture: boolean,
    picIndex: number,
}

let rotate = 0;

export default class FpiCamera extends Component<FpiCameraProps, FpiCameraState> {
    static externalClasses = ['com-class']

    static defaultProps = {
        tabIndex: 1,
        isFobidden: false
    }

    constructor(props) {
        super(props)
        this.state = {
            currentIndex: props.tabIndex,
            photos: [],
            isPhoto: false,
            isPicture: false,
            picIndex: 0,
        }
    }

    onTabPhoto = () => {
        this.setState({
            currentIndex: 1
        })
    }

    onTabAlbum = () => {
        let that = this;
        Taro.chooseImage({
            count: 9,
            sizeType: ['original', 'compressed'],
            sourceType: ['album'],
            success(res) {
                const { photos } = that.state;
                const albumPhotos: Photo[] = res.tempFilePaths.map((url: string) => {
                    return { url, rotate: 0 }
                });
                const newPhotos = [
                    ...photos,
                    ...albumPhotos
                ]
                if (newPhotos.length > 9) {
                    Taro.showToast({
                        title: '最多可上传9张照片',
                        icon: 'none',
                        duration: 2000
                    })
                }
                that.setState({
                    photos: newPhotos.slice(0, 9)
                })
                that.props.onOK(newPhotos.slice(0, 9));
            }
        })
    }

    onTakePhone = () => {
        if (this.props.isFobidden) {
            return;
        }
        this.setState({
            isPhoto: true
        }, () => {
            const ctx = Taro.createCameraContext();
            ctx.takePhoto({
                quality: 'high',
                success: (res) => {
                    let { photos } = this.state;
                    if (photos.length > 8) {
                        Taro.showToast({
                            title: '最多可上传9张照片',
                            icon: 'none',
                            duration: 2000
                        })
                        return;
                    }
                    const tempImagePath = res.tempImagePath;
                    photos.push({ url: tempImagePath, rotate });
                    this.setState({
                        photos
                    }, () => {
                        //拍照图片保存到相册
                        Taro.saveImageToPhotosAlbum({
                            filePath: tempImagePath,
                        });
                    });
                }
            })
        })
    }

    onRemove = () => {
        let { photos, picIndex } = this.state;
        photos.splice(picIndex, 1);
        this.setState({
            photos,
            picIndex: picIndex > 0 ? (picIndex == photos.length ? picIndex - 1 : picIndex) : 0,
            isPicture: photos.length !== 0
        }, () => {
            if (photos.length === 0) {
                this.props.onStatus(false);
            }
        })
    }

    onChange = (e) => {
        this.setState({
            picIndex: e.detail.current
        })
    }

    onPicture = () => {
        this.setState({
            isPicture: true
        })
        this.props.onStatus(true);
    }

    onPhotoComplete = () => {
        let { photos } = this.state;
        this.props.onOK(photos);
    }

    onBack = () => {
        this.setState({
            isPicture: false
        })
    }

    componentDidMount() {
        Taro.authorize({
            scope: 'scope.writePhotosAlbum',
        })
        // wx.startDeviceMotionListening();

        // wx.onDeviceMotionChange((result: any)=>{
        //     const {alpha,beta,gamma} = result;
        //     if (alpha > 45 && alpha < 136) {
        //         rotate = 270;
        //     } else if (alpha > 225 && alpha < 316) {
        //         rotate = 90;
        //     } else if (alpha > 135 && alpha < 226) {
        //         rotate = 180;
        //     } else {
        //         rotate = 0;
        //     }
        // });
    }
    componentWillUnmount() {
        // wx.stopDeviceMotionListening();
    }

    // 授权相机权限
    onGrant = () => {
        Taro.openSetting({
            success(res) {
                Taro.startPullDownRefresh()
                Taro.stopPullDownRefresh()
                this.setState({})
            }
        })
    }

    render() {
        const { currentIndex, photos, isPhoto, isPicture, picIndex } = this.state;
        const { isFobidden } = this.props;
        return (
            <View className={cn('fpi-camera com-class', { 'fpi-camera--picture': isPicture })}>
                <View className='fpi-camera__context'>
                    {isFobidden ? <FpiForbidCamera onAuthorized={this.onGrant} /> : <Camera className='fpi-camera__canvas' device-position="back" flash="auto" />}
                </View>

                <View className={cn('fpi-camera__btns', { 'fpi-camera__btns--active': isPhoto })}>
                    <View className='btn__view'>
                        {
                            isEmpty(photos) ? <View></View> : (
                                <View className='view__container'>
                                    <Image className='img' src={photos[photos.length - 1].url} mode='aspectFill' onClick={this.onPicture} />
                                    <Text className='txt'>共{photos.length}张</Text>
                                </View>
                            )
                        }
                    </View>
                    <View className='btn__phone' onClick={this.onTakePhone}></View>
                    <Text className='btn__confirm' onClick={this.onPhotoComplete}>完成</Text>
                </View>

                <View className='fpi-camera__tabs'>
                    <Text className={cn('tab__item', { 'tab__item--active': currentIndex === 0 })} onClick={this.onTabAlbum}>相册</Text>
                    <Text className={cn('tab__item', { 'tab__item--active': currentIndex === 1 })} onClick={this.onTabPhoto}>相机</Text>
                </View>

                <View className='fpi-camera__pics'>
                    <Swiper className='list__container'
                        indicatorColor='#999'
                        indicatorActiveColor='#333'
                        circular
                        indicatorDots
                        onChange={this.onChange}
                        current={picIndex}
                    >
                        {
                            photos.map(photo => (
                                <SwiperItem key={photo}>
                                    <View className='list__item'>
                                        <Image className='img' src={photo.url} mode="aspectFill" />
                                    </View>
                                </SwiperItem>
                            ))
                        }
                    </Swiper>
                    <View className='list__remove'>
                        <Image onClick={this.onRemove} className='img' src={`${rootSourceBaseUrl}/assets/common/icon-remove2.png`} />
                    </View>
                    <View className='list__back'>
                        <Image onClick={this.onBack} className='img' src={`${rootSourceBaseUrl}/assets/common/icon-back.png`} />
                    </View>
                </View>
            </View>
        )
    }
}