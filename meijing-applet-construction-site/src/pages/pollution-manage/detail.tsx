import Taro, { Component, Config } from '@tarojs/taro';
import { View, Text, Image, Swiper, SwiperItem } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import { constructionSiteDetail, patrolAndInspectNumber, delPollutionDetail, enumConstructionSiteProgress, enumConstructionSiteType } from '../../service/pollutionType';
import { anomalyList } from '../../service/home'
import { rootSourceBaseUrl } from '@common/utils/requests'
import FpiConfirm from '@common/components/FpiConfirm';
import get from 'lodash/get';
import cn from 'classnames'
import './detail.scss'
import isEmpty from 'lodash/isEmpty';

const Img404 = `${rootSourceBaseUrl}/assets/common/404-picture.png`

interface DetailProps {
    userStore: any;
}
interface DetailState {
    id: number | string,
    picIndex: number,
    detailData: any,
    sentryList: any,
    inspectCount: number,
    showPopup: boolean,
    anomalyCount: number,
}

@inject('userStore')
@observer
class PatrolPage extends Component<DetailProps, DetailState> {
    config: Config = {
        navigationBarTitleText: '工地详情'
    }

    static externalClasses = ['com-class']

    constructor(props) {
        super(props);
        const { id } = this.$router.params
        this.state = {
            id,
            picIndex: 0,
            detailData: {},
            inspectCount: 0,
            anomalyCount: 0,
            showPopup: false,
            sentryList: []
        }
    }

    componentDidShow() {
        this.fetchData()
        this.getInspectCount()
    }

    fetchData = async () => {
        try {
            const { id } = this.state;
            const res = await constructionSiteDetail(id)
            this.setState({
                detailData: get(res, 'data.pollutionSource', {}),
                sentryList: get(res, 'data.sentryList', []),
            })
        }
        catch (e) {

        }
    }

    getInspectCount = async () => {
        try {
            const { id } = this.state;
            const res = await patrolAndInspectNumber(id)
            this.setState({
                inspectCount: get(res, 'data.patrolNum', 0),
                anomalyCount: get(res, 'data.inspectNum', 0),
            })
        }
        catch (e) {

        }
    }

    onChange = () => {

    }

    onCancel = () => {
        this.setState({
            showPopup: false
        })
    }

    onConfirm = async () => {
        const { id } = this.state;
        try {
            const res = await delPollutionDetail(id)
            if (get(res, 'data.success')) {
                Taro.setStorageSync('pollutionSource-delete-id', id)
                Taro.navigateBack({})
            }
            else {
                Taro.showToast({
                    title: '删除失败',
                    mask: true,
                    icon: 'none',
                    duration: 2000
                });
            }
        }
        catch (e) {

        }
    }

    showBigImage(urls: string[]) {
        Taro.previewImage({
            urls
        })
    }

    onMakePhone = (detailData: any) => {
        Taro.makePhoneCall({
            phoneNumber: get(detailData, 'phoneNumber')
        })
    }

    navHandle = (item: any) => {
        if (item.longitude && item.latitude) {
            Taro.openLocation({
                longitude: item.longitude,
                latitude: item.latitude
            })
        }
    }

    onInspect = () => {
        const { id } = this.state;
        Taro.navigateTo({
            url: `./patrol?id=${id}`
        })
    }

    onQuestion = () => {
        const { id, detailData } = this.state;
        Taro.navigateTo({
            url: `./question?id=${id}&name=${detailData.name}`
        })
    }

    statusChangeLogs = () => {
        const { id } = this.state;
        Taro.navigateTo({
            url: `./statusChangeLog?id=${id}`
        })
    }
    staffChangeLogs = () => {
        const { id } = this.state;
        Taro.navigateTo({
            url: `./staffChangeLog?id=${id}`
        })
    }

    onEdit = () => {
        const { id } = this.state;
        Taro.navigateTo({
            url: './edit?id=' + id
        })
    }

    onDel = async () => {
        this.setState({
            showPopup: true
        })
    }

    onImageError = (index: number) => {
        const { detailData, detailData: { pictureLinks } } = this.state
        pictureLinks.splice(index, 1, Img404)
        this.setState({
            detailData
        })
    }

    render() {
        const { picIndex, detailData, inspectCount, showPopup, anomalyCount } = this.state;
        return (
            <View className='detail-page'>
                <View className={cn('detail-page__pics', { hide: isEmpty(detailData.pictureLinks) })}>
                    <Swiper className='list__container'
                        indicatorColor='#999'
                        indicatorActiveColor='#333'
                        circular
                        indicatorDots
                        onChange={this.onChange}
                        current={picIndex}
                    >
                        {
                            get(detailData, 'pictureLinks', []).map((photo, index) => (
                                <SwiperItem key={photo}>
                                    <View className='list__item'>
                                        <Image className='img' src={photo} mode="aspectFill" onClick={this.showBigImage.bind(this, detailData.pictureLinks)} onError={this.onImageError.bind(this, index)} />
                                    </View>
                                </SwiperItem>
                            ))
                        }
                    </Swiper>
                </View>

                <View className='detail-page__body'>
                    <View className='company-info'>
                        <View className='title'>
                            <Text className='company'>{get(detailData, 'name', '--')}</Text>
                            <Text className='number'>（{get(detailData, 'code', '--')}）</Text>
                        </View>
                        <Text className='cate'>{get(detailData, 'pollutionSourceTypeName') || ''}{detailData.industryName ? `-${detailData.industryName}` : ''}{get(detailData, 'appendDatas.constructionSiteType') ? '-' + enumConstructionSiteType[detailData.appendDatas.constructionSiteType] : ''}</Text>
                    </View>

                    <View className='company-contact'>
                        <View className='contact-item'>
                            <Text className='label'>联系人</Text>
                            <View className='content'>
                                <Text className='person'>{get(detailData, 'linkman') || '暂无'}</Text>
                            </View>
                        </View>
                        <View className='contact-item'>
                            <Text className='label'>电话</Text>
                            <View className='content'>
                                <Text className='phone'>{get(detailData, 'phoneNumber') || '暂无'}</Text>
                                <View className={cn('icon', { hide: isEmpty(detailData.phoneNumber) })} onClick={this.onMakePhone.bind(this, detailData)}></View>
                            </View>
                        </View>
                        <View className='contact-item'>
                            <Text className='label'>在线监控设备</Text>
                            <View className='content'>
                                <Text className='status'>{get(detailData, 'existMonitorDevice', false) ? '开启' : '关闭'}</Text>
                            </View>
                        </View>
                        <View className='contact-item'>
                            <Text className='label'>工地进度状态</Text>
                            <View className='content'>
                                <Text className='status'>{get(detailData, 'appendDatas.constructionSiteProgress') ? enumConstructionSiteProgress[detailData.appendDatas.constructionSiteProgress] : ''}</Text>
                            </View>
                        </View>
                        <View className='contact-item'>
                            <Text className='label'>当前工作状态</Text>
                            <View className='content'>
                                <Text className='status'>{get(detailData, 'status') || '暂无'}</Text>
                            </View>
                        </View>
                        <View className='contact-item'>
                            <Text className='label'>监管部门</Text>
                            <View className='content'>
                                <Text className='status'>{get(detailData, 'superviseDepartmentName') || '暂无'}</Text>
                            </View>
                        </View>
                        <View className='patrol-list'>
                            {get(detailData, 'inspectorName', false) && <Text className='patrol-item'>巡查员：{detailData.inspectorName}</Text>}
                            {get(detailData, 'supervisorName', false) && <Text className='patrol-item'>督查员：{detailData.supervisorName}</Text>}
                            {get(detailData, 'leaderName', false) && <Text className='patrol-item'>组长：{detailData.leaderName}</Text>}
                        </View>
                    </View>

                    <View className='company-address' onClick={this.navHandle.bind(this, detailData)}>
                        <View className='icon'></View>
                        <Text className='addr'>{get(detailData, 'address') || ''}</Text>
                    </View>

                    <View className='company-remark'>
                        <Text className='title'>备注</Text>
                        <Text className='remark'>{get(detailData, 'remark', '无') || '无'}</Text>
                    </View>
                    <View className='space'></View>
                    <View className='company-patrol' onClick={this.onInspect}>
                        <Text className='label'>历史巡查记录</Text>
                        <View className='content'>
                            {
                                inspectCount && <Text className='num'>{inspectCount}</Text>
                            }
                            <View className='icon'></View>
                        </View>
                    </View>
                    <View className='company-patrol' onClick={this.onQuestion}>
                        <Text className='label'>异常问题记录</Text>
                        <View className='content'>
                            {
                                anomalyCount && <Text className='num'>{anomalyCount}</Text>
                            }
                            <View className='icon'></View>
                        </View>
                    </View>
                    <View className='company-patrol' onClick={this.statusChangeLogs}>
                        <Text className='label'>工地状态变更记录</Text>
                        <View className='content'>
                            <View className='icon'></View>
                        </View>
                    </View>
                    <View className='company-patrol' onClick={this.staffChangeLogs}>
                        <Text className='label'>巡查人员变更记录</Text>
                        <View className='content'>
                            <View className='icon'></View>
                        </View>
                    </View>

                    <View className='space'></View>
                </View>

                <View className='detail-page__footer'>
                    {/* <View className='btn del' onClick={this.onDel}>删除</View> */}
                    <View className='btn edit' onClick={this.onEdit}>编辑</View>
                </View>

                <FpiConfirm
                    title='提示'
                    content='确定删除该条数据吗？'
                    isOpened={showPopup}
                    onConfirm={this.onConfirm}
                    onCancel={this.onCancel}
                />
            </View>
        );
    }
}

export default PatrolPage;