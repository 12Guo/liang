import Taro, { Component, Config } from '@tarojs/taro';
import { View, Text, Button, Image, Picker } from '@tarojs/components'
import './inspection_report.scss'
import { inspectReport, inspectSumbit, getSiteId } from '../../service/workbench'
import { rootConstructionSourceBaseUrl } from '@common/utils/requests'
import { AtModal, AtModalContent, AtModalAction } from "taro-ui"
import EmptyHolder from '@common/components/EmptyHolder/index'
import { getCurrentPage } from '@common/utils/common'
import { getLocation } from '../../service/userDivision'
import { Location } from '../../model'
import TopBar from '@common/components/TopBar'
import isEmpty from 'lodash/isEmpty';
import moment from 'moment';
import { constructionSiteDetail } from '../../service/pollutionType';
import { current } from 'src/service/spectionAction';


const history = `${rootConstructionSourceBaseUrl}/assets/pages/work/history.png`
const arrow = `${rootConstructionSourceBaseUrl}/assets/pages/work/arrow_right.png`
const arrow_y = `${rootConstructionSourceBaseUrl}/assets/pages/work/arrow_y.png`
const arrow_n = `${rootConstructionSourceBaseUrl}/assets/pages/work/arrow_n.png`
const updated = `${rootConstructionSourceBaseUrl}/assets/pages/work/updated.png`
const no_update = `${rootConstructionSourceBaseUrl}/assets/pages/work/no_update.png`

interface MyProps {

}

interface MyState {
    update: InfoType[];
    update_n: InfoType[];
    inspectReportData: any;
    isOpen: boolean;
    isSubmitFlag: boolean;
    siteName: string,
    // 工地状态
    progressStatus: string,
    // 当前工作状态
    currentWorkStatus: string,
    progressStatusList: any,
    currentWorkStatusList: any,
    pollutionSourceId: number
    // 请求参数
    constructionSiteProgress: string,
    pollutionSourceStatusId: number,
    isSubmit: boolean,
    isAuthSetting: boolean,
    submitButtonLoading: boolean
}

interface InfoType {
    id?: number;
    labelName: string;
}

class Index extends Component<MyProps, MyState> {

    constructor(props) {
        super(props)
        this.state = {
            update: [],
            update_n: [],
            // 请求到的数据
            inspectReportData: [],
            // 控制弹框开关
            isOpen: false,
            isSubmitFlag: false,
            // 工地名称
            siteName: '',
            // 工地进度状态
            progressStatus: '',
            progressStatusList: [{ label: '地基处理、土方开挖', value: 'GROUND_TREATMENT' }, { label: '基础/地下施工', value: 'FOUNDATION_CONSTRUCTION' }, { label: '主体施工', value: 'MAIN_CONSTRUCTION' }, { label: '毛坯施工', value: 'BLANK_CONSTRUCTION' }, { label: '室内装修', value: 'INTERIOR_TRIM' }, { label: '完工', value: 'COMPLETE' }],
            // 当前工作状态
            currentWorkStatus: '',
            currentWorkStatusList: [{ label: '在建', value: 1 }, { label: '停工', value: 2 }, { label: '完工', value: 3 }],
            pollutionSourceId: 0,
            constructionSiteProgress: '',
            pollutionSourceStatusId: 0,
            // 是否已经提交
            isSubmit: false,
            // 切换工地
            isAuthSetting: false,
            submitButtonLoading: false
        }
    }

    // 判断是否存在缓存，存在，则用缓存的id请求数据，不存在则后去最近自动获取污染源id
    componentDidMount() {
        // this.isHaveCache()
    }

    componentDidShow(){
        this.isHaveCache();
    }

    config: Config = {
        navigationBarTitleText: '自查上报',
        navigationBarBackgroundColor: '#107EFF',
        navigationBarTextStyle: 'white',
        backgroundColor: '#107EFF',
        enablePullDownRefresh: true,
        navigationStyle: 'custom',
    }

    componentWillUnmount() {
        Taro.setStorageSync('update-content', false)
    }

    //下拉刷新
    onPullDownRefresh() {
        this.getResquestData()
        Taro.stopPullDownRefresh();
    }

    // 判断是否存在缓存，有的话就调用缓存，没有的话就请求接口获取最近位置
    async isHaveCache() {
        let cache = Taro.getStorageSync('inspection_report_cache');
        const userDetails = Taro.getStorageSync("userDetails");

        // 缓存的时间小于今天时间的开始值，则判断已经到了第二天，清楚缓存
        if (!cache ||  cache.time < moment(Date.now()).startOf('day')) {
            Taro.setStorageSync('inspection_report_cache', {})
        }

        let constructionSiteProgress = ""
        let pollutionSourceStatusId = 1;
        if(!cache.constructionSiteProgress || !cache.pollutionSourceStatusId){
            const constructionSiteDetailInfo = await constructionSiteDetail(userDetails.pollutionSourceInfo.pollutionSourceId);
            constructionSiteProgress = constructionSiteDetailInfo.data.pollutionSource.appendDatas && constructionSiteDetailInfo.data.pollutionSource.appendDatas.constructionSiteProgress;
            pollutionSourceStatusId = constructionSiteDetailInfo.data.pollutionSource.statusId;
        }
        this.setState({
            pollutionSourceId: userDetails.pollutionSourceInfo.pollutionSourceId,
            constructionSiteProgress: cache.constructionSiteProgress || constructionSiteProgress,
            pollutionSourceStatusId: cache.pollutionSourceStatusId || pollutionSourceStatusId,
            siteName: userDetails.pollutionSourceInfo.pollutionSourceName,
        }, () => {
            this.getResquestData()
        });
    }
    // 重新获取数据，刷新提交的内容
    getResquestData = async () => {
        let { pollutionSourceStatusId, constructionSiteProgress, progressStatusList, currentWorkStatusList } = this.state;
        let currentPage = getCurrentPage().data;
        let progressStatusTemp;
        let currentWorkStatusTemp;
        if (currentPage) {
            progressStatusList.forEach(element => {
                if (element.value === currentPage.constructionSiteProgress) {
                    progressStatusTemp = element.label
                }
            });
            currentWorkStatusList.forEach(item => {
                if(item.value === currentPage.pollutionSourceStatusId) {
                    currentWorkStatusTemp = item.label
                }
            })
        }

        this.setState({
            constructionSiteProgress: constructionSiteProgress,
            pollutionSourceStatusId: pollutionSourceStatusId,
            progressStatus: progressStatusTemp,
            currentWorkStatus: currentWorkStatusTemp,
        }, async () => {
            if (!this.state.pollutionSourceId) {
                return
            }
    
            let update: InfoType[] = []
            let update_n: InfoType[] = []
            const resp = await inspectReport(this.state.pollutionSourceId)
    
            resp.data.specialPatrolItems.forEach((item) => {
                if (item.patroled) {
                    update.push(item)
                } else {
                    update_n.push(item)
                }
            });
            this.setState({
                inspectReportData: resp.data,
                update,
                update_n,
                isOpen: resp.data.hasLatestTimeoutPatrol
            })
        })        
    }

    // 开启地理位置的权限
    onOpenAuth() {
        Taro.openSetting({
            success: function (dataAu) {
                if (dataAu.authSetting["scope.userLocation"] == true) {
                    //再次授权，调用wx.getLocation的API
                } else {
                    Taro.showToast({
                        title: '授权失败',
                        icon: 'none'
                    })
                    setTimeout(() => {
                        Taro.navigateBack()
                    }, 1500)
                }
            }
        })

        this.setState({
            isAuthSetting: false
        })
    }

    onSubmit = async () => {
        const { pollutionSourceId, pollutionSourceStatusId, constructionSiteProgress } = this.state
        if (pollutionSourceStatusId === 0) {
            Taro.showToast({
                title: `当前工作状态不能为空`,
                mask: true,
                icon: 'none',
                duration: 1000
            });
            return
        }
        this.setState({
            submitButtonLoading: true
        })
        let resquestParam = {
            constructionSiteProgress,
            pollutionSourceId,
            pollutionSourceStatusId
        }
        try {
            const resp = await inspectSumbit(resquestParam)

            // 提交成功之后，但会到首页的工作台，提交的之后进行缓存并且第二次进入进行回显
            if (resp.errMsg === "request:ok" && resp.statusCode === 200) {
                this.setState({
                    isSubmit: true,
                    submitButtonLoading: false
                })

                Taro.setStorageSync('inspection_report_cache', {})
                // 成功之后进行提示并加上跳转
                Taro.showToast({
                    title: `提交成功`,
                    mask: true,
                    icon: 'none',
                    duration: 500
                });
                Taro.redirectTo({
                    url: `/pages/works/detail?inspectId=${resp.data.id}`
                });
            }
        } catch (err) {
            console.log(err);
        }


        this.setState({
            isSubmit: true,
            submitButtonLoading: false
        })

    }

    onPickerStatus2 = (res) => {
        const { progressStatusList } = this.state
        const index = res.detail.value

        this.setState({
            progressStatus: progressStatusList[index].label,
            constructionSiteProgress: progressStatusList[index].value
        })
    }

    onPickerStatus1 = (res) => {
        const { currentWorkStatusList } = this.state
        const index = res.detail.value
        this.setState({
            currentWorkStatus: currentWorkStatusList[index].label,
            pollutionSourceStatusId: currentWorkStatusList[index].value
        })
    }

    onNaviToHistory() {
        Taro.navigateTo({
            url: '/pages/work_options/history'
        });
    }

    onNaviToDetails(item: any) {
        const { inspectReportData, siteName } = this.state
        this.$preload('pollutionSourceId', inspectReportData.pollutionSourceId)
        this.$preload('labelDetails', item)
        this.$preload('siteName', siteName)

        Taro.navigateTo({
            url: '/pages/work_options/contentUpdate'
        });
    }

    // 返回上一级的页面，自定义
    onBackHandle = () => {
        const { isSubmit, update } = this.state
        if (!isEmpty(update) && !isSubmit) {
            this.setState({
                isSubmitFlag: true
            })
        } else {
            this.onConfirmExit()
        }
    }

    // 提示为提交已上报内容，并确认退出,进行状态缓存
    onConfirmExit = () => {
        const { pollutionSourceId, constructionSiteProgress, pollutionSourceStatusId, siteName, progressStatus, currentWorkStatus } = this.state
        // 退出的时候，如果没有进行内容提交，则进行缓存
        let inspection_report_cache = { pollutionSourceId, constructionSiteProgress, pollutionSourceStatusId, siteName, progressStatus, currentWorkStatus, time: moment(new Date()) }

        Taro.setStorageSync('inspection_report_cache', inspection_report_cache)
        Taro.navigateBack()
    }

    // 跳转到已上传的详细页面
    onNaviToUpdatedDetails(item) {
        const { inspectReportData, siteName } = this.state

        this.$preload('pollutionSourceId', inspectReportData.pollutionSourceId)
        this.$preload('labelDetails', item)
        this.$preload('siteName', siteName)
        this.$preload('update', true)

        Taro.navigateTo({
            url: '/pages/work_options/contentUpdate'
        });
    }

    // 选择上报选项时
    componentDidHide(){
        const { pollutionSourceId, constructionSiteProgress, pollutionSourceStatusId, siteName, progressStatus, currentWorkStatus } = this.state
        // 退出的时候，如果没有进行内容提交，则进行缓存
        let inspection_report_cache = { pollutionSourceId, constructionSiteProgress, pollutionSourceStatusId, siteName, progressStatus, currentWorkStatus, time: moment(new Date()) }

        Taro.setStorageSync('inspection_report_cache', inspection_report_cache)
    }

    render() {

        const { submitButtonLoading, isAuthSetting, isOpen, update_n, update, inspectReportData, siteName="", progressStatusList, progressStatus, currentWorkStatus, currentWorkStatusList, isSubmitFlag } = this.state

        return (
            <View className="report">

                <TopBar title='自查上报' onBack={this.onBackHandle} background={'#107EFF'} color={'#fff'} />

                <View className="input_header">
                    <View className="input_box">
                        <View className="flex_row select" >
                            <Text className="txt2">工地名称</Text>
                            <View className="flex_row fix">
                                <Text className="txt3">{siteName}</Text>
                                {/* <Image src={arrow} className="img2"></Image> */}
                            </View>
                        </View>

                        <View className="flex_row select">
                            <Text className="txt2"> 工地进度状态</Text>
                            <Picker mode='selector' value={0} range={progressStatusList} range-key='label' onChange={this.onPickerStatus2.bind(this)}>
                                <View className="flex_row">
                                    <Text className="txt3">{progressStatus ? progressStatus : '请选择工地进度'}</Text>
                                    <Image src={arrow} className="img2"></Image>
                                </View>
                            </Picker>

                        </View>

                        <View className="flex_row select">
                            <Text className="txt2"> 当前工作状态</Text>
                            <Picker mode='selector' value={0} range={currentWorkStatusList} range-key='label' onChange={this.onPickerStatus1.bind(this)}>

                                <View className="flex_row">
                                    <Text className="txt3">{currentWorkStatus ? currentWorkStatus : '请选择当前状态'}</Text>
                                    <Image src={arrow} className="img2"></Image>
                                </View>
                            </Picker>

                        </View>

                    </View>
                </View>
                {
                    !isEmpty(inspectReportData) ?
                        <View className="content">
                            {
                                update_n.length != 0 && <View className="flex_row update_title">
                                    <Image className="img3" src={no_update}></Image>
                                    <Text className="txt4">未上传</Text>
                                </View>
                            }

                            <View>
                                {
                                    update_n.map((item, index) => {
                                        return (<View className="flex_row update_info" key={index} onClick={this.onNaviToDetails.bind(this, item)}>
                                            <Image className="img4" src={arrow_n} ></Image>
                                            <View className="update_content">
                                                <Text className="txt6">{item.labelName}</Text>
                                            </View>
                                            <Image src={arrow} className="img2"></Image>

                                        </View>)
                                    })
                                }

                            </View>
                            {update.length != 0 &&
                                <View className="flex_row update_title">
                                    <Image className="img3" src={updated}></Image>
                                    <Text className="txt5">已上传</Text>
                                </View>
                            }
                            <View>
                                {
                                    update.map((item, index) => {
                                        return (<View className="flex_row update_info" key={index} onClick={this.onNaviToUpdatedDetails.bind(this, item)}>
                                            <Image className="img4" src={arrow_y}></Image>
                                            <View className="update_content">
                                                <Text className="txt6">{item.labelName}</Text>
                                            </View>
                                            <Image src={arrow} className="img2"></Image>

                                        </View>)
                                    })
                                }

                            </View>
                        </View>
                        :
                        <View className="isEmpty">
                            <EmptyHolder text='暂无数据' />
                        </View>
                }


                <View className="commit_bottom">
                    <View className="history" onClick={this.onNaviToHistory}>
                        <Image className="img1" src={history}></Image>
                        <Text className="txt1">历史记录</Text>
                    </View>
                    <Button className="submit_button" onClick={this.onSubmit} disabled={submitButtonLoading} loading={submitButtonLoading}>
                        确认提交
                    </Button>
                </View>
                {/* 没有开启地理位置的权限 */}
                <AtModal isOpened={isAuthSetting}>
                    <AtModalContent>
                        检测到您的位置权限没有打开
                        是否前往开启
                    </AtModalContent>
                    <AtModalAction> <Button onClick={() => { this.setState({ isAuthSetting: false }); Taro.navigateBack() }}>取消</Button> <Button onClick={this.onOpenAuth.bind(this)}>前往开启</Button> </AtModalAction>
                </AtModal>

                <AtModal isOpened={isOpen}>
                    <AtModalContent>
                        您有上传记录因超时未提交，现已失效，
                        请在每次巡查上报完成之后及时【确认提交】
                    </AtModalContent>
                    <AtModalAction><Button onClick={() => { this.setState({ isOpen: false }) }}>我知道了</Button> </AtModalAction>
                </AtModal>

                <AtModal isOpened={isSubmitFlag}>
                    <AtModalContent>
                        您上报的信息还未提交，
                        确定退出吗？
                    </AtModalContent>
                    <AtModalAction> <Button onClick={() => { this.setState({ isSubmitFlag: false }) }}>取消</Button> <Button onClick={this.onConfirmExit.bind(this)}>确定</Button> </AtModalAction>
                </AtModal>
            </View>
        );
    }
}
export default Index