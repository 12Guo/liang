import Taro, { Component, Config, } from '@tarojs/taro'
import { View, Text, Button, Switch, Image, Block, Map } from '@tarojs/components'
import { AtImagePicker, AtIcon } from 'taro-ui'
import { observer, inject } from '@tarojs/mobx';
import { SimpleRichInput } from '@common/components/rich-text'
import { PollutionType, list as pollutionTypelist } from '../../service/pollutionType'
import { InspectInfo, add as inspectReport, InspectInfoType } from '../../service/inspect'
import { clearValueInPageData, getCurrentPage, getNewFileName } from '@common/utils/common'
import { joinAts, joinTags, AtOrTag, getShowContent } from '../../common/utils/rich-text'
import { getLocation } from '../../service/userDivision'
import { getAddressByLocationFromTencentMap } from '../../common/utils/mapUtils'
import { getDivision } from '../../service/division'
import { rootSourceBaseUrl } from '@common/utils/requests'
import { checkDivision } from '../../common/utils/divisionUtils'
import { SimpleUser } from '../../service/user'
import FpiRecorder from '@common/components/FpiRecorder'
import RadioButton from '@common/components/radioButton'
import FpiPopupChoose from '@common/components/FpiPopupChoose'
import FpiPreviewImage from '@common/components/FpiPreviewImage'
import { Location } from '../../model'
import { current as currentSpecialActivity, SpecialActivity } from '../../service/spectionAction'
import { LabelType } from '../../service/label'
import { DispatchType } from '../../service/dispatch'
import { UploadResult, uploadFile, getSignature } from '../../service/upload'
import { getImpactAnalysisResult } from '../../service/impactAnalysis'
import get from 'lodash/get';
import moment from 'moment';
import './report.scss'

const bigMapIcon = `${rootSourceBaseUrl}/assets/works/bigmap.png`;

const getFillColor = (index: number, size: number) => {
    let levelValue = Math.ceil(16 + ((size - index) / size) * 64);
    return ("#E22424" + levelValue.toString(16));
}

interface InspectReplyProps {
    userStore: any;
}

interface Photo {
    url: string;
    rotate: number;
}

interface InspectReplyState {
    /**
     * 污染类型列表
     */
    pollutionTypeList: PollutionType[];

    /**
     * 事件类型
     */
    type: InspectInfoType;

    /**
    * 填写的事件内容
    */
    content: string;
    /**
     * 选择的污染类型
     */
    pollutionType?: PollutionType;
    /**
     * 是否行政执法
     */
    enforcementLaw: boolean;
    /**
      * 事件状态 false:未完成 true：完成
      */
    status: boolean;

    /**
     * 图片上传后存放的地址
     */
    photos: Photo[];

    /**
     * 录音地址
     */
    recorderPath?: string;
    /**
     * 录音时长
     */
    recoderDuration?: number;

    /**
     * 是否显示添加图片按钮
     */
    showUploadBtn: boolean;

    /**
     * 地址
     */
    address: string;
    longitude: number;
    latitude: number;
    divisionCode: string;
    divisionName: string;
    pollutionSourceId?: number,
    pollutionSourceName?: string,
    pollutionSourceTypeId?: number,
    togethers: SimpleUser[],
    /**
     * 匿名上报
     */
    anonymous: boolean,

    /**
     * 编辑button loading状态
     */
    eidtButtonLoading: boolean;

    dispatchType?: DispatchType,
    /**
     * 响应式调度id
     */
    reactiveDispatchId?: number;
    /**
     * 是否显示录音
     */
    showRecorder: boolean;
    /**
     * 显示预览查看
     */
    showPreview: boolean;
    /**
     * 当前被点击图片的索引值
     */
    picIndex: number;
    /**
     * 影响分析多边形区域
     */
    impactAnalysisPolygons: any[];

    /**
     * 影响分析数据
     */
    impactAnalysisData?: any;
}

/**
 * 是否正在提交
 */
let isReprt = false;

@inject('userStore')
@observer
export default class InspectReply extends Component<InspectReplyProps, InspectReplyState> {

    config: Config = {
        navigationBarTitleText: '',
        navigationBarBackgroundColor: '#FFFFFF',
        navigationBarTextStyle: 'black',
        backgroundColor: '#FFFFFF',
    }

    constructor(props) {
        super(props)
        const { userStore: { userDetails: { pollutionSourceInfo } } } = props
        this.state = {
            photos: [],
            showUploadBtn: true,
            pollutionTypeList: [],
            type: InspectInfoType.PATROL,
            enforcementLaw: false,
            status: false,
            content: '',
            longitude: 0,
            latitude: 0,
            divisionCode: '',
            divisionName: '',
            address: '',
            togethers: [],
            eidtButtonLoading: false,
            anonymous: false,
            showRecorder: false,
            showPreview: false,
            impactAnalysisPolygons: [],
            picIndex: 0,
            pollutionSourceId: pollutionSourceInfo.pollutionSourceId,
            pollutionSourceName: pollutionSourceInfo.pollutionSourceName,
            pollutionSourceTypeId: pollutionSourceInfo.pollutionSourceTypeId
        }
    }

    componentDidMount() {
        const { reactiveDispatchId, dispatchType, photos, type } = this.$router.params;
        let barTitle = '事件上报';
        console.log(photos, 1)

        Taro.setNavigationBarTitle({ title: `${barTitle}` });

        this.setState({
            type: type == InspectInfoType.INCIDENT ? InspectInfoType.INCIDENT : InspectInfoType.PATROL,
            reactiveDispatchId: reactiveDispatchId && parseInt(reactiveDispatchId) || undefined,
            dispatchType: dispatchType ? (dispatchType == 'ALARM' ? 'ALARM' : 'REACTIVE_DISPATCH') : undefined,
            photos: photos ? JSON.parse(photos) : []
        });
        console.log(JSON.parse(photos))

        this.getLocationAndDivision();
        this.getPollutionTypelist();
        this.getCurrentSpecialActivity();
        isReprt = false;
    }

    componentDidShow() {
        let currentPage = getCurrentPage();

        const { choosedLables, atPersons, togethersData, pollutionSourceData } = currentPage.data;
        let { content } = this.state;

        if (choosedLables && choosedLables.length > 0) {
            content = joinTags(content, choosedLables);
            this.setState({
                content: content
            });
        }

        /**
         * 同行人
         */
        if (togethersData) {
            this.setState({
                togethers: togethersData.choosedUsers
            });
        }

        /**
         * at的人
         */
        if (atPersons) {
            let departmentList: any[] = atPersons.choosedDepartmentUserList;
            let devisionList: any[] = atPersons.choosedDivisionUserList;
            let personsList: SimpleUser[] = atPersons.choosedUsers;
            let atLabels: AtOrTag[] = [];
            if (departmentList && departmentList.length > 0) {
                for (let i = 0; i < departmentList.length; i++) {
                    atLabels.push({
                        name: departmentList[i].departmentName.replace(/\s/g, ""),
                        type: 'department',
                        id: departmentList[i].departmentId,
                    });
                }
            }

            if (devisionList && devisionList.length > 0) {
                for (let i = 0; i < devisionList.length; i++) {
                    atLabels.push({
                        name: devisionList[i].divisionName.replace(/\s/g, ""),
                        type: 'devision',
                        id: devisionList[i].divisionCode,
                    });
                }
            }

            if (personsList && personsList.length > 0) {
                for (let i = 0; i < personsList.length; i++) {
                    atLabels.push({
                        name: personsList[i].name.replace(/\s/g, ""),
                        type: 'user',
                        id: personsList[i].id,
                    });
                }
            }

            content = joinAts(content, atLabels);
            this.setState({
                content: content
            });
        }

        /**
         * 污染源企业
         */
        if (pollutionSourceData) {
            this.setState({
                pollutionSourceId: pollutionSourceData.id,
                pollutionSourceName: pollutionSourceData.name,
                pollutionSourceTypeId: pollutionSourceData.pollutionSourceTypeId,
            });
        }

        clearValueInPageData(['choosedLables', 'atPersons', 'togethersData', 'pollutionSourceData']);
    }


    getPollutionTypelist() {
        pollutionTypelist().then(res => {
            this.setState({ pollutionTypeList: res.data })
        });
    }

    getCurrentSpecialActivity() {
        //自动获取专项行动标签
        const { userDetails: { pollutionSourceInfo: { divisionCode } } } = get(this.props, 'userStore');
        currentSpecialActivity(divisionCode).then(resp => {
            const specialActivityList: SpecialActivity[] = resp.data;

            if (specialActivityList && specialActivityList.length > 0) {
                let tags: AtOrTag[] = specialActivityList.map(specialActivity => {
                    return {
                        name: specialActivity.name,
                        type: LabelType.SPECIAL_ACTIVITY,
                        id: specialActivity.id,
                    };
                });
                let content = joinTags('', tags);
                this.setState({
                    content: content
                });
            }
        });
    }

    getLocationAndDivision = async () => {
        try {
            let location: Location = await getLocation();
            let addressResponse = await getAddressByLocationFromTencentMap(location.latitude, location.longitude);
            let addressResult = addressResponse.data.result;
            let divisionCode = addressResult.address_reference.town.id + '000';
            let divisionResp = await getDivision(divisionCode);

            this.setState({
                longitude: location.longitude,
                latitude: location.latitude,
                divisionCode: divisionCode,
                divisionName: divisionResp.data.fullName,
                address: addressResult.address,
            }, () => {
                this.getImpactAnalysisResult();
            });
        } catch (error) {
        }
    }


    /**
     * 污染源企业选择
     */
    handlePollutionSourceChange() {
        const { latitude, longitude } = this.state;
        Taro.navigateTo({
            url: `../pollution-industry/index?latitude=${latitude}&longitude=${longitude}`,
        });
    }


    onAt() {
        Taro.navigateTo({
            url: '../person/index?dataCode=atPersons'
        });
    }

    onTag() {
        Taro.navigateTo({
            url: '../works/labelChoose'
        });
    }

    handleContentChange(value: string) {
        this.setState({
            content: value || ''
        });
    }

    onImagePickChange(newFiles, operationType: string) {
        const photos: Photo[] = newFiles.map((obj: any) => {
            return { url: obj.url || '', rotate: 0 }
        });

        if (operationType === 'remove') {
            this.setState({
                photos,
                showUploadBtn: true
            });
        } else {
            this.setState(() => {
                return ({
                    photos,
                })
            }, () => {
                if (this.state.photos.length === 9) {  // 最多9张图片 隐藏添加图片按钮
                    this.setState({
                        showUploadBtn: false
                    })
                }
            });
        }
    }

    onImageClick = (index: number) => {
        this.setState({
            picIndex: index,
            showPreview: true
        })
    }

    /**
     * 同行人选择
     */
    handlePersonChoose() {
        Taro.navigateTo({
            url: '../person/index?dataCode=togethersData&type=4&only=true'
        });
    }

    onPollutionTypeChange(res) {
        let index = res.detail.value;
        const { pollutionTypeList } = this.state;

        this.setState({
            pollutionType: pollutionTypeList[index]
        });
    }

    onEnforcementLawChange(res) {
        this.setState({
            enforcementLaw: res.detail.value
        });
    }

    onStatusChange(res) {
        this.setState({
            status: res.detail.value
        });
    }

    /**
     * 匿名上报
     * @param checked 
     */
    anonymousChoose() {
        const { anonymous } = this.state
        this.setState({
            anonymous: !anonymous,
        });
    }

    /**
     * 上报类型切换
     */
    inspectChoose = (type: InspectInfoType, checked: boolean) => {
        this.setState({
            type: checked ? type : (type == InspectInfoType.INCIDENT ? InspectInfoType.PATROL : InspectInfoType.INCIDENT)
        }, () => {
            const isInspect = this.state.type === InspectInfoType.INCIDENT;
            const barTitle = isInspect ? '事件上报' : '例行巡查';
            Taro.setNavigationBarTitle({ title: `${barTitle}` });
            this.getImpactAnalysisResult();
        })
    }

    /**
     * 录音完成
     * @param path 
     */
    handleRecorderDone(path: string, times: number) {
        this.setState({
            recorderPath: path,
            recoderDuration: times,
            showRecorder: false
        });
    }

    /**
     * 地址选择
     */
    async addressSelect() {
        try {
            const res = await Taro.chooseLocation();
            const latitude = res.latitude;
            const longitude = res.longitude;

            let addressResponse = await getAddressByLocationFromTencentMap(latitude, longitude);
            let addressResult = addressResponse.data.result;
            let divisionCode = addressResult.address_reference.town.id + '000';
            let divisionResp = await getDivision(divisionCode);

            this.setState({
                latitude: latitude,
                longitude: longitude,
                address: res.address,
                divisionCode: divisionCode,
                divisionName: divisionResp.data.fullName,
            }, () => {
                this.getImpactAnalysisResult();
            });
        } catch (error) {
        }
    }

    getImpactAnalysisResult() {
        const { latitude, longitude, divisionCode, type } = this.state;
        const { userStore: { userDetails: { pollutionSourceInfo: { divisionCode: userDivisionCode } } } } = this.props;

        //需要判断一下，用户行政区
        if (type == InspectInfoType.PATROL || !checkDivision(userDivisionCode, divisionCode)) {
            return;
        }
        try {
            getImpactAnalysisResult(userDivisionCode, longitude, latitude).then(resp => {
                const impactAnalysisPolygons = resp.data && resp.data.geojson && resp.data.geojson.features ?
                    resp.data.geojson.features.map((feature, index) => ({
                        points: feature.geometry.coordinates[0].map(item => {
                            return item[0] > item[1] ? { latitude: item[1], longitude: item[0] } : { latitude: item[0], longitude: item[1] }
                        }),
                        strokeWidth: 0.5,
                        strokeColor: "#D1D1D1",
                        fillColor: getFillColor(index, resp.data.geojson.features.length)

                    })) : [];

                this.setState({
                    impactAnalysisPolygons,
                    impactAnalysisData: resp.data,
                });
            });
        } catch (error) {
            console.log(error);
        }
    }


    impactDetail() {
        const { latitude, longitude } = this.state;
        Taro.navigateTo({
            url: `/pages/impact_analysis/index?longitude=${longitude}&latitude=${latitude}`
        });
    }

    /**
     * 事件上报参数校验
     * @param input 
     */
    reportParameterCheck(input: InspectInfo): boolean {
        const { type } = this.state;
        let result: boolean = true;
        let notice: string = '';

        // 必填校验
        if (!input.content || input.content.length == 0) {
            result = false;
            notice = '请输入文字';
        }
        // 三选一必填校验
        else if ((!input.pictureOssKeys || input.pictureOssKeys.length == 0)
            && (!input.voiceOssKey || input.voiceOssKey.length == 0)
            && (!input.videoOssKey || input.videoOssKey.length == 0)) {
            result = false;
            notice = '请上传图片或语音、视频';
        }
        else if (input.longitude == 0 || input.latitude == 0) {
            result = false;
            notice = '未获取到经纬度';
        } else if (type == InspectInfoType.INCIDENT && !input.pollutionTypeId) {
            result = false;
            notice = '请选择污染类型';
        }

        if (!result) {
            Taro.showToast({
                title: notice,
                mask: true,
                icon: 'none',
                duration: 2000
            });
        }
        return result;
    }

    getImageOssDir() {
        const dayStr: string = moment().format('YYYY/MM/DD');
        return `inspect/images/${dayStr}/`;
    }

    getVoiceOssDir() {
        const dayStr: string = moment().format('YYYY/MM/DD');
        return `inspect/voices/${dayStr}/`;
    }

    /**
     * 事件上报
     */
    report = async () => {
        let { pollutionType, content, enforcementLaw, status,
            longitude, latitude, divisionCode, divisionName, address,
            type, photos, pollutionSourceId, pollutionSourceName,
            pollutionSourceTypeId, recorderPath, recoderDuration, togethers,
            reactiveDispatchId, dispatchType, anonymous, impactAnalysisData } = this.state;
        const { userStore: { userDetails } } = this.props;

        if (isReprt == true) {
            return false;
        }

        isReprt = true;
        this.setState({
            eidtButtonLoading: true,
        });

        //先完成图片上传
        let pictureOssKeys: string[] = [];
        let firstPictureUrl = '';

        if (photos && photos.length > 0) {
            const imageDir: string = this.getImageOssDir();
            const { data: signatureResult } = await getSignature(imageDir);
            let promises: Promise<UploadResult>[] = [];

            for (let i = 0; i < photos.length; i++) {
                const filePath: string = photos[i].url;
                promises.push(uploadFile(filePath, imageDir, getNewFileName(filePath), signatureResult));
            }
            const imageUploadResults: UploadResult[] = await Promise.all(promises);
            const failure_number: number = imageUploadResults.filter(re => !re.success).length;

            if (failure_number > 0) {
                Taro.showToast({
                    title: `有${failure_number}张图片上传失败，请检查网络环境`,
                    mask: true,
                    icon: 'none',
                    duration: 2000
                });

                isReprt = false;
                this.setState({
                    eidtButtonLoading: false,
                });
                return;
            }
            pictureOssKeys = imageUploadResults.map(uploadResult => uploadResult.ossKey);
            firstPictureUrl = imageUploadResults[0].ossKey;
        }


        let voiceOssKey = '';
        if (recorderPath && recorderPath.length > 0) {
            const voiceDir: string = this.getVoiceOssDir();
            const { data: voiceSignatureResult } = await getSignature(voiceDir);
            const uploadResult: UploadResult = await uploadFile(recorderPath, voiceDir, getNewFileName(recorderPath), voiceSignatureResult);
            if (uploadResult.ossKey == '') {
                isReprt = false;
                this.setState({
                    eidtButtonLoading: false,
                });
                return;
            }
            voiceOssKey = uploadResult.ossKey;
        }

        let partner = '';
        if (togethers && togethers.length > 0) {
            partner = JSON.stringify(togethers);
        }

        if (!divisionCode || !divisionName) {
            //如果未获取到上报位置所在的行政区
            divisionCode = userDetails.pollutionSourceInfo.divisionCode;
            divisionName = userDetails.pollutionSourceInfo.divisionName;
        }

        let input: InspectInfo = {
            pollutionSourceId: pollutionSourceId,
            pollutionSourceName: pollutionSourceName,
            pollutionSourceTypeId: pollutionSourceTypeId,
            longitude: longitude,
            latitude: latitude,
            divisionCode: divisionCode,
            divisionName: divisionName,
            address: address,
            content: content,
            enforcementLaw: enforcementLaw,
            status: status,
            voiceOssKey: voiceOssKey,
            voiceDuration: recoderDuration || 0,
            videoOssKey: '',
            pictureOssKeys: pictureOssKeys.join(','),
            attachmentOssKeys: '',
            pollutionTypeId: pollutionType && pollutionType.id,
            needDisposaled: false,
            type: type,
            partner: partner,
            reactiveDispatchId: reactiveDispatchId,
            dispatchType: dispatchType,
            anonymous: anonymous,
            reportDepartmentId: userDetails.departmentNode && userDetails.departmentNode.id,
            reportDepartmentName: userDetails.departmentNode && userDetails.departmentNode.name,
            supervise: false,
            reportDivisionCode: userDetails.pollutionSourceInfo.divisionCode,
            reportDivisionName: userDetails.pollutionSourceInfo.divisionName,
            impactAnalysisData,
        };

        if (!this.reportParameterCheck(input)) {
            this.setState({
                eidtButtonLoading: false,
            });
            isReprt = false;
            return;
        }

        try {
            const reportResp = await inspectReport(input);
            let output: InspectInfo = reportResp.data;

            firstPictureUrl = firstPictureUrl && firstPictureUrl.length > 0 ? encodeURIComponent(firstPictureUrl) : '';
            let contentToSuccessPage = content && content.length > 0 ? encodeURIComponent(getShowContent(content)) : '';

            let pollutionTypeName = pollutionType && pollutionType.name || '';
            //跳转到成功页面
            await Taro.redirectTo({
                url: `./success?type=${type}&inspectId=${output.id}
                &firstPictureUrl=${firstPictureUrl}&content=${contentToSuccessPage}
                &pollutionTypeName=${pollutionTypeName}`
            });
        } catch (error) {
            this.setState({
                eidtButtonLoading: false,
            });
            isReprt = false;
        }

    }

    onRecorder = () => {
        const { showRecorder } = this.state
        this.setState({
            showRecorder: !showRecorder
        })
    }

    onPreviewBack = () => {
        this.setState({
            showPreview: false
        })
    }

    onPreviewDelete = (index: number) => {
        const { photos } = this.state
        photos.splice(index, 1)
        this.setState({
            photos,
            showPreview: false
        })
    }

    render() {
        const { photos, content, address, pollutionTypeList, pollutionType,
            pollutionSourceName, showUploadBtn, togethers, recorderPath, picIndex,
            recoderDuration, type, eidtButtonLoading, anonymous, showRecorder, showPreview,
            latitude, longitude, divisionCode, impactAnalysisPolygons } = this.state;
        const { userStore: { userDetails: { pollutionSourceInfo: { divisionCode: userDivisionCode } } } } = this.props;

        const markerList: any = [{
            iconPath: `${rootSourceBaseUrl}/assets/inspect_report/impact_point.png`,
            id: 0,
            latitude,
            longitude,
            width: 28,
            height: 28,
        }];

        const files: any[] = photos.map((p: Photo) => {
            return { url: p.url };
        });

        return (
            <View className='content'>
                <View className='content-container'>
                    <View className='contentInputView'>
                        <SimpleRichInput
                            class-name="simple_input"
                            value={content}
                            recoderDuration={recoderDuration}
                            recorderPath={recorderPath}
                            onAt={this.onAt.bind(this)}
                            onTag={this.onTag.bind(this)}
                            onRecorder={this.onRecorder.bind(this)}
                            onValueChange={this.handleContentChange.bind(this)}
                            onRecorderDone={this.handleRecorderDone.bind(this)}
                        />
                    </View>
                    {showRecorder && <FpiRecorder onDone={this.handleRecorderDone.bind(this)} onCancel={this.onRecorder} />}

                    <View className='imagePickView_container'>
                        <AtImagePicker
                            className='imagePickView'
                            mode='aspectFill'
                            files={files}
                            length={4}
                            showAddBtn={showUploadBtn}
                            onChange={this.onImagePickChange.bind(this)}
                            onImageClick={this.onImageClick.bind(this)}
                        />
                        {showPreview && <FpiPreviewImage picIndex={picIndex} photos={photos} onBack={this.onPreviewBack.bind(this)} onDelete={this.onPreviewDelete.bind(this)} />}
                    </View>

                    <View className='addressAndAnonymous'>
                        <View className='address' onClick={this.addressSelect.bind(this)}>
                            <Image className='addressIcon' src={`${rootSourceBaseUrl}/assets/works/address2.png`} />
                            <Text className='text'>{address}</Text>
                        </View>

                        {/* <View className='anonymous'>
                            <RadioButton class-name="radio" checked={anonymous} onClick={this.anonymousChoose.bind(this)} />
                            <Text className='text'>匿名上报</Text>
                        </View> */}
                    </View>

                    <View className='replyinfoView'>
                        <View className='info_item'>
                            <Text className='item_left'>上报类型</Text>
                            <View className='item_right'>
                                <View className='radio-group' onClick={this.inspectChoose.bind(this, InspectInfoType.INCIDENT)}>
                                    <RadioButton class-name='radio' checked={type == InspectInfoType.INCIDENT} />
                                    <Text className='text'>事件上报</Text>
                                </View>
                                <View className='radio-group' onClick={this.inspectChoose.bind(this, InspectInfoType.PATROL)}>
                                    <RadioButton class-name='radio' checked={type == InspectInfoType.PATROL} />
                                    <Text className='text'>巡查工作</Text>
                                </View>
                            </View>
                        </View>

                        {type === InspectInfoType.INCIDENT &&
                            <Block>
                                <View className='info_item'>
                                    <Text className='item_left'>是否处置完成</Text>
                                    <View className='item_right'>
                                        <Switch checked={false} color='#1091FF' onChange={this.onStatusChange.bind(this)} />
                                    </View>
                                </View>
                                <View className='info_item'>
                                    <Text className='item_left required'>污染类型</Text>
                                    <View className='item_right'>
                                        {/* <Picker mode='selector' value={0} range={pollutionTypeList} range-key='name' onChange={this.onPollutionTypeChange.bind(this)}>
                                            <Text className={pollutionType ? 'text_right choosed' : 'text_right'}>{(pollutionType && pollutionType.name) || '请选择污染类型'}</Text>
                                            <AtIcon className='chevron_right' value='chevron-right' size='20' color='#7A8499' />
                                        </Picker> */}
                                        <FpiPopupChoose range={pollutionTypeList} rangeKey='name' value={get(pollutionType, 'id', '')} onChange={this.onPollutionTypeChange.bind(this)}>
                                            <Text className={pollutionType ? 'text_right choosed' : 'text_right'}>{(pollutionType && pollutionType.name) || '请选择污染类型'}</Text>
                                            <AtIcon className='chevron_right' value='chevron-right' size='20' color='#7A8499' />
                                        </FpiPopupChoose>
                                    </View>
                                </View>
                            </Block>
                        }

                        <View className='info_item' style={{ display: 'none' }}>
                            <Text className='item_left'>污染源</Text>
                            <View className='item_right' onClick={this.handlePollutionSourceChange.bind(this)}>
                                <Text className={pollutionSourceName ? 'text_right choosed' : 'text_right'}>{pollutionSourceName || '请选择污染源'}</Text>
                                <AtIcon className='chevron_right' value='chevron-right' size='20' color='#7A8499' />
                            </View>
                        </View>

                        {type === InspectInfoType.INCIDENT &&
                            <View className='info_item'>
                                <Text className='item_left'>是否需要行政执法</Text>
                                <View className='item_right'>
                                    <Switch checked={false} color='#1091FF' onChange={this.onEnforcementLawChange.bind(this)} />
                                </View>
                            </View>
                        }

                        <View className='info_item' onClick={this.handlePersonChoose.bind(this)}>
                            <Text className='item_left'>同行人员</Text>
                            <View className='item_right'>
                                <Text className={togethers.length > 0 ? 'text_right choosed' : 'text_right'}>{togethers.length > 0 ? `共${togethers.length}人` : '请选择同行人员'}</Text>
                                <AtIcon className='chevron_right' value='chevron-right' size='20' color='#7A8499' />
                            </View>
                        </View>

                        {type === InspectInfoType.INCIDENT &&
                            <View className='info_item'>
                                <Text className='item_left'>匿名上报</Text>
                                <View className='item_right'>
                                    <Switch checked={anonymous} color='#1091FF' onChange={this.anonymousChoose.bind(this)} />
                                </View>
                            </View>
                        }

                        {
                            type === InspectInfoType.INCIDENT && checkDivision(userDivisionCode, divisionCode) &&
                            <View className='mapView'>
                                <View className='titleAndBigMap'>
                                    <Text className='title'>研判结果</Text>
                                    <View className='showBigMap' onClick={this.impactDetail}>
                                        <Text className='txt'>全屏地图</Text>
                                        <Image className='icon' src={bigMapIcon}></Image>
                                    </View>
                                </View>

                                <Map style={{ height: `272rpx`, zIndex: 1, width: `686rpx` }}
                                    id="map"
                                    scale={12}
                                    markers={markerList}
                                    show-location={true}
                                    polygons={impactAnalysisPolygons}
                                    className="map"
                                    longitude={longitude}
                                    latitude={latitude}
                                />
                            </View>
                        }
                    </View>

                    {/* <View className='notice-container'>
                        <Text className='noticeView'>* 系统自动匹配污染源已经污染类型，可人工进行修改</Text>
                    </View> */}
                </View>

                <View className='buttonView'>
                    <Button className='eidtButton' disabled={eidtButtonLoading} loading={eidtButtonLoading} onClick={this.report.bind(this)}>提交</Button>
                </View>
            </View>
        )
    }
}