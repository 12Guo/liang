import Taro, { Component, Config } from '@tarojs/taro';
import { observer, inject } from '@tarojs/mobx';
import { View, Text, Button, ScrollView, Picker, Image, Input, Textarea, Switch } from '@tarojs/components';
import { AtImagePicker, AtIcon, AtCurtain } from 'taro-ui'
import { rootSourceBaseUrl } from '@common/utils/requests'
import { getPollutionSourceTypeList, pollutionSourceTypeStatus, getPollutionDetail, editpollutionPources, enumConstructionSiteType, enumConstructionSiteProgress } from '../../service/pollutionType'
import { getAddressByLocationFromTencentMap } from '@common/utils/mapUtils'
import { getPageData, getNewFileName } from '@common/utils/common'
import { getDivision } from '../../service/division'
import { UploadResult, uploadFile, getSignature } from '../../service/upload'
import { listDepartmentByDivision, Department } from '../../service/department'

import cn from 'classnames'
import get from 'lodash/get';
import moment from 'moment';
import isEmpty from 'lodash/isEmpty';

import './edit.scss'

interface AddProps {
    userStore: any;
}

interface AddState {
    id: number | string,
    pollutionTypeList: any,
    pollutionType?: any,
    files: any,
    showUploadBtn: boolean,
    showScanDemo: boolean,
    showMore: boolean,
    name: string,
    /**
    * 地址
    */
    address: string;
    longitude: number;
    latitude: number;
    divisionCode: string;
    divisionName: string;
    phoneNumber?: string,
    existMonitorDevice: boolean,
    pollutionStatusList: any,
    pollutionStatus?: any,
    linkman: string,
    remark: string,
    dataObj: any,
    isSaving: boolean,
    currentPersonField: string,
    departemtList: Department[],
}

@inject('userStore')
@observer
class MarkAdd extends Component<AddProps, AddState> {
    config: Config = {
        navigationBarTitleText: '编辑工地'
    }

    static externalClasses = ['com-class']

    constructor(props) {
        super(props);
        const { id } = this.$router.params

        this.state = {
            id,
            pollutionTypeList: [],
            pollutionStatusList: [],
            files: [],
            name: '',
            longitude: 0,
            latitude: 0,
            divisionCode: '',
            divisionName: '',
            address: '',
            showUploadBtn: true,
            showScanDemo: false,
            showMore: true,
            existMonitorDevice: false,
            remark: '',
            linkman: '',
            dataObj: {},
            isSaving: false,
            currentPersonField: '',
            departemtList: [],
        }
    }

    componentDidMount() {
        this.fetchData()
        this.getPollutionType();
        this.getPollutionSourceTypeStatus();
        this.getDepartemtList();
    }

    componentDidShow() {
        const currentPageData = getPageData()
        const { leader, inspector, supervisor, currentPersonField } = currentPageData
        if (!isEmpty(leader) || !isEmpty(inspector) || !isEmpty(supervisor)) {
            let currentField = currentPersonField
            const currentFieldData = get(currentPageData, currentField).choosedUsers[0]
            const { dataObj } = this.state;
            this.setState({
                dataObj: {
                    ...dataObj,
                    [`${currentField}Id`]: currentFieldData.id,
                    [`${currentField}Name`]: currentFieldData.name
                }
            })
        }
        const { dataObj } = this.state;
        const { superviseDepartment } = currentPageData;
        if (!isEmpty(superviseDepartment)) {
            this.setState({
                dataObj: {
                    ...dataObj,
                    superviseDepartmentId: superviseDepartment.id,
                    superviseDepartmentCode: superviseDepartment.code,
                    superviseDepartmentName: superviseDepartment.name,
                }
            });
        }
    }

    /**
     * 获取详情
     */
    fetchData = async () => {
        const { id } = this.$router.params;
        try {
            const res = await getPollutionDetail(id);
            const data = get(res, 'data', {})
            this.setState({
                dataObj: data,
                files: (get(data, 'pictureLinks', []) || []).map(pic => ({
                    url: pic
                }))
            })
        }
        catch (err) { console.log(err) }
    }

    /**
     * 污染类型
     */
    getPollutionType = async () => {
        try {
            const res = await getPollutionSourceTypeList();
            const { data } = res;
            this.setState({
                pollutionTypeList: data
            })
        }
        catch (err) { console.log(err) }
    }

    /**
     * 污染源状态
     */
    getPollutionSourceTypeStatus = async () => {
        try {
            const res = await pollutionSourceTypeStatus();
            const { data } = res;
            this.setState({
                pollutionStatusList: data
            })
        }
        catch (err) { console.log(err) }
    }

    /**
     * 获取部门列表
     */
    getDepartemtList = async () => {
        try {
            const { userStore: { userDetails: currentUserDetails } } = this.props;

            const res = await listDepartmentByDivision(currentUserDetails.divisionCode);
            const { data } = res;
            this.setState({
                departemtList: data,
            })
        }
        catch (err) { console.log(err) }
    }

    /**
     * 地址选择
     */
    async addressSelect() {
        try {
            const { dataObj } = this.state;
            const res = await Taro.chooseLocation();
            const latitude = res.latitude;
            const longitude = res.longitude;

            let addressResponse = await getAddressByLocationFromTencentMap(latitude, longitude);
            let addressResult = addressResponse.data.result;
            let divisionCode = addressResult.address_reference.town.id + '000';
            let divisionResp = await getDivision(divisionCode);

            this.setState({
                dataObj: {
                    ...dataObj,
                    latitude: latitude,
                    longitude: longitude,
                    address: res.address,
                    divisionCode: divisionCode,
                    divisionName: divisionResp.data.fullName,
                }
            });
        } catch (error) {
        }
    }

    /**
     * 图片选择
     * @param newFiles 
     * @param operationType 
     */
    onImagePickChange(newFiles, operationType: string, index) {
        if (operationType === 'remove') {
            const { dataObj: { pictureLinks, pictureOssKeys }, dataObj } = this.state
            const pictureOssKeysNew = pictureOssKeys.split(',')
            pictureLinks.splice(index, 1)
            pictureOssKeysNew.splice(index, 1)
            this.setState({
                files: newFiles,
                showUploadBtn: true,
                dataObj: {
                    ...dataObj,
                    pictureLinks,
                    pictureOssKeys: pictureOssKeysNew.join(',')
                }
            });
        } else {
            this.setState({
                files: newFiles
            }, () => {
                const { files } = this.state
                if (files.length === 9) {  // 最多9张图片 隐藏添加图片按钮
                    this.setState({
                        showUploadBtn: false
                    })
                }
            })
        }
    }

    // 示例显示/隐藏
    onCurtain = (isShow: boolean) => {
        this.setState({
            showScanDemo: isShow
        })
    }

    onPollutionTypeChange = (res) => {
        const index = res.detail.value;
        const { dataObj, pollutionTypeList } = this.state;
        this.setState({
            dataObj: {
                ...dataObj,
                pollutionSourceTypeId: pollutionTypeList[index].id,
                pollutionSourceTypeName: pollutionTypeList[index].name,
                status: ''
            }
        });
    }

    onPollutionStatusChange = (res) => {
        let index = res.detail.value;
        const { pollutionStatusList, dataObj } = this.state;
        const currentPollution = pollutionStatusList.filter(item => item.pollutionSourceTypeId === dataObj.pollutionSourceTypeId)[index]
        this.setState({
            dataObj: {
                ...dataObj,
                statusId: currentPollution.id,
                status: currentPollution.name
            }
        });
    }

    onConstructionSiteTypeChange = (res) => {
        let index = res.detail.value;
        const { dataObj } = this.state;
        const constructionSiteType = Object.keys(enumConstructionSiteType)[index]
        if (dataObj.appendDatas) {
            dataObj.appendDatas.constructionSiteType = constructionSiteType
        }
        else {
            dataObj.appendDatas = { constructionSiteType }
        }
        this.setState({
            dataObj
        });
    }

    onConstructionSiteProgressChange = (res) => {
        let index = res.detail.value;
        const { dataObj } = this.state;
        const constructionSiteProgress = Object.keys(enumConstructionSiteProgress)[index]
        if (dataObj.appendDatas) {
            dataObj.appendDatas.constructionSiteProgress = constructionSiteProgress
        }
        else {
            dataObj.appendDatas = { constructionSiteProgress }
        }
        this.setState({
            dataObj
        });
    }

    onInputChange = (key, e) => {
        const { dataObj } = this.state;
        this.setState({
            dataObj: {
                ...dataObj,
                [key]: e.detail.value
            }
        })
    }

    /**
     * 加载更多切换
     */
    onMore = () => {
        const { showMore } = this.state;
        this.setState({
            showMore: !showMore
        })
    }

    /**
     * 是否存在检测设备
     */
    onMonitorChange = () => {
        const { dataObj } = this.state;
        this.setState({
            dataObj: {
                ...dataObj,
                existMonitorDevice: !dataObj.existMonitorDevice
            }
        })
    }

    /**
     * 上报污染源参数检查
     */
    reportParameterCheck = (input) => {
        let result: boolean = true;
        let notice: string = '';

        if (!input.pollutionSourceTypeId) {
            result = false;
            notice = '请选择污染类型';
        }
        else if (!input.name) {
            result = false;
            notice = '请输入污染名称';
        } else if (input.longitude == 0 || input.latitude == 0) {
            result = false;
            notice = '未获取到经纬度';
        } else if (!isEmpty(input.phoneNumber) && !/^1[3456789]\d{9}$/.test(input.phoneNumber)) {
            result = false;
            notice = '请输入正确手机号码';
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

    onCancel = () => {
        Taro.navigateBack({})
    }

    getImageOssDir() {
        const dayStr: string = moment().format('YYYY/MM/DD');
        return `pollution-sources/images/${dayStr}/`;
    }

    /**
     * 污染源上报
     */
    onSubmit = () => {
        const { userStore: { userDetails } } = this.props;

        this.setState({
            isSaving: true
        }, async () => {
            const { dataObj, files } = this.state;
            const newFiles = files.filter((file: any) => file.url.includes('tmp'))
            //先完成图片上传
            let pictureOssKeys: string[] = [];

            if (newFiles && newFiles.length > 0) {
                const imageDir: string = this.getImageOssDir();
                const { data: signatureResult } = await getSignature(imageDir);
                let promises: Promise<UploadResult>[] = [];

                for (let i = 0; i < newFiles.length; i++) {
                    const filePath: string = newFiles[i].url;
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
                    this.setState({
                        isSaving: false,
                    });
                    return;
                }
                pictureOssKeys = imageUploadResults.map(uploadResult => uploadResult.ossKey);

                if (dataObj.pictureOssKeys) {
                    dataObj.pictureOssKeys += ',' + pictureOssKeys.join(',')
                }
                else {
                    dataObj.pictureOssKeys = pictureOssKeys.join(',')
                }
            }

            if (!dataObj.divisionCode || !dataObj.divisionName) {
                //如果未获取到上报位置所在的行政区
                dataObj.divisionCode = userDetails.divisionCode;
                dataObj.divisionName = userDetails.divisionName;
            }

            if (!this.reportParameterCheck(dataObj)) {
                this.setState({
                    isSaving: false
                });
                return;
            }

            try {
                await editpollutionPources(dataObj);
                Taro.navigateBack();
            } catch (error) {
                console.log(error);
            }
            this.setState({
                isSaving: false
            });
        })

    }

    onPerson = (name: string) => {
        this.setState({ currentPersonField: name })
        Taro.navigateTo({
            url: `../person/index?dataCode=${name}&radio=true&type=4&only=true`
        });
    }

    /**
     * 修改监管部门
     * @param res 
     */
    onDepartmentChange() {
        const { userStore: { userDetails: currentUserDetails } } = this.props;
        Taro.navigateTo({
            url: `/pages/department_select/index?dataCode=superviseDepartment&divisionCode=${currentUserDetails.divisionCode}`
        });
    }

    render() {
        const { showScanDemo, showMore, pollutionTypeList, pollutionStatusList, dataObj,
            files, isSaving, departemtList } = this.state;

        let ptIndex: number;
        for (ptIndex = 0; ptIndex < pollutionTypeList.length; ptIndex++) {
            if (dataObj.pollutionSourceTypeId == pollutionTypeList[ptIndex].id) {
                break;
            }
        }

        let depIndex: number;
        for (depIndex = 0; depIndex < departemtList.length; depIndex++) {
            if (dataObj.superviseDepartmentId == departemtList[depIndex].id) {
                break;
            }
        }

        return (
            <View className='add-page'>
                <View className='add-page_body'>
                    <ScrollView
                        className='add-page_body--scroll'
                        scrollY
                        scrollWithAnimation
                    >
                        <View className='list-item'>
                            <View className='left'>
                                <Text className='left__title'>污染源类型</Text>
                            </View>
                            <View className='right'>
                                <View className='right__container'>
                                    <Picker mode='selector' value={ptIndex} range={pollutionTypeList} range-key='name' onChange={this.onPollutionTypeChange.bind(this)}>
                                        <Text className='txt'>{get(dataObj, 'pollutionSourceTypeName', '请选择') || '请选择'}</Text>
                                        <AtIcon className='chevron_right' value='chevron-right' size='20' color='#7A8499' />
                                    </Picker>
                                </View>
                            </View>
                        </View>

                        <View className='list-item'>
                            <View className='left'>
                                <Text className='left__title required'>名称</Text>
                            </View>
                            <View className='right'>
                                <View className='right__container'>
                                    <Input
                                        value={get(dataObj, 'name', '')}
                                        className='input'
                                        placeholderClass='input__placeholder'
                                        placeholder='输入地点名称需要和招牌一致'
                                        onInput={this.onInputChange.bind(this, 'name')}
                                    />
                                </View>
                            </View>
                        </View>

                        <View className='list-item'>
                            <View className='left'>
                                <Text className='left__title required'>位置</Text>
                            </View>
                            <View className='right' onClick={this.addressSelect}>
                                <View className='right__container'>
                                    <Text className={cn('input', { 'input__placeholder': isEmpty(dataObj.address) })}>{dataObj.address ? dataObj.address : '选择所在的地址'}</Text>
                                    <AtIcon className='chevron_right' value='chevron-right' size='20' color='#7A8499' />
                                </View>
                            </View>
                        </View>

                        <View className='list-item custom'>
                            <View className='list-item__top'>
                                <View className='left'>
                                    <Text className='left__title'>添加照片</Text>
                                    <Text className='left__sub'>（请对准招牌拍摄）</Text>
                                </View>
                                <View className='right'>
                                    <View className='right__container'>
                                        <Text className='link' onClick={this.onCurtain.bind(this, true)}>查看示例</Text>
                                    </View>
                                </View>
                            </View>
                            <View className='list-item__body'>
                                <AtImagePicker
                                    className='imagePickView'
                                    mode='aspectFill'
                                    files={files}
                                    onChange={this.onImagePickChange.bind(this)}
                                />
                            </View>
                        </View>

                        <View className='list-item custom'>
                            <View className='list-item__top'>
                                <View className='left'>
                                    <Text className='left__title'>其他信息</Text>
                                    <Text className='left__sub'>（详细描述、联系方式）</Text>
                                </View>
                                <View className='right'>
                                    <View className='right__container' onClick={this.onMore}>
                                        <AtIcon className='chevron_right' value={showMore ? 'chevron-up' : 'chevron-down'} size='20' color='#7A8499' />
                                    </View>
                                </View>
                            </View>
                            <View className={cn('list-item__body rich__body', { 'rich__body--show': showMore })}>
                                <Textarea
                                    className='textarea'
                                    placeholderClass='textarea__placeholder'
                                    placeholder='请输入详细描述…'
                                    autoHeight
                                    value={get(dataObj, 'remark', '')}
                                    onInput={this.onInputChange.bind(this, 'remark')}
                                />
                            </View>
                        </View>

                        <View className={cn('list-item-more', { 'list-item-more--show': showMore })}>
                            <View className='list-item'>
                                <View className='left'>
                                    <Text className='left__title'>联系人</Text>
                                </View>
                                <View className='right'>
                                    <View className='right__container'>
                                        <Input
                                            className='input'
                                            placeholderClass='input__placeholder'
                                            placeholder='请输入联系人姓名'
                                            value={get(dataObj, 'linkman', '')}
                                            onInput={this.onInputChange.bind(this, 'linkman')}
                                        />
                                    </View>
                                </View>
                            </View>
                            <View className='list-item'>
                                <View className='left'>
                                    <Text className='left__title'>联系人手机号</Text>
                                </View>
                                <View className='right'>
                                    <View className='right__container'>
                                        <Input
                                            value={get(dataObj, 'phoneNumber', '')}
                                            type='number'
                                            className='input'
                                            placeholderClass='input__placeholder'
                                            placeholder='请输入联系人手机号'
                                            onInput={this.onInputChange.bind(this, 'phoneNumber')}
                                        />
                                    </View>
                                </View>
                            </View>
                            <View className='list-item'>
                                <View className='left'>
                                    <Text className='left__title'>在线监测设备</Text>
                                </View>
                                <View className='right'>
                                    <View className='right__container'>
                                        <Switch checked={get(dataObj, 'existMonitorDevice', false)} color='#1091FF' onChange={this.onMonitorChange.bind(this)} />
                                    </View>
                                </View>
                            </View>
                            <View className='list-item'>
                                <View className='left'>
                                    <Text className='left__title'>工地类型</Text>
                                </View>
                                <View className='right'>
                                    <View className='right__container'>
                                        <Picker mode='selector' value={0} range={Object.keys(enumConstructionSiteType).map(key => ({ name: enumConstructionSiteType[key], value: key }))} range-key='name' onChange={this.onConstructionSiteTypeChange.bind(this)}>
                                            <Text className='txt'>{get(dataObj, 'appendDatas.constructionSiteType') ? enumConstructionSiteType[dataObj.appendDatas.constructionSiteType] : '请选择'}</Text>
                                            <AtIcon className='chevron_right' value='chevron-right' size='20' color='#7A8499' />
                                        </Picker>
                                    </View>
                                </View>
                            </View>
                            <View className='list-item'>
                                <View className='left'>
                                    <Text className='left__title'>工地进度状态</Text>
                                </View>
                                <View className='right'>
                                    <View className='right__container'>
                                        <Picker mode='selector' value={0} range={Object.keys(enumConstructionSiteProgress).map(key => ({ name: enumConstructionSiteProgress[key], value: key }))} range-key='name' onChange={this.onConstructionSiteProgressChange.bind(this)}>
                                            <Text className='txt'>{get(dataObj, 'appendDatas.constructionSiteProgress') ? enumConstructionSiteProgress[dataObj.appendDatas.constructionSiteProgress] : '请选择'}</Text>
                                            <AtIcon className='chevron_right' value='chevron-right' size='20' color='#7A8499' />
                                        </Picker>
                                    </View>
                                </View>
                            </View>
                            <View className='list-item'>
                                <View className='left'>
                                    <Text className='left__title'>当前工作状态</Text>
                                </View>
                                <View className='right'>
                                    <View className='right__container'>
                                        <Picker mode='selector' value={0} range={pollutionStatusList.filter(item => item.pollutionSourceTypeId === dataObj.pollutionSourceTypeId)} range-key='name' onChange={this.onPollutionStatusChange.bind(this)}>
                                            <Text className='txt'>{get(dataObj, 'status', '请选择') || '请选择'}</Text>
                                            <AtIcon className='chevron_right' value='chevron-right' size='20' color='#7A8499' />
                                        </Picker>
                                    </View>
                                </View>
                            </View>

                            <View className='list-item'>
                                <View className='left'>
                                    <Text className='left__title'>监管部门</Text>
                                </View>
                                <View className='right'>
                                    <View className='right__container' onClick={this.onDepartmentChange.bind(this)}>
                                        <Text className='txt'>{get(dataObj, 'superviseDepartmentName', '请选择') || '请选择'}</Text>
                                        <AtIcon className='chevron_right' value='chevron-right' size='20' color='#7A8499' />
                                    </View>

                                    {/* <View className='right__container'> */}
                                    {/* <Picker mode='selector' value={depIndex} range={departemtList} range-key='name' onChange={this.onDepartmentChange.bind(this)}>
                                            <Text className='txt'>{get(dataObj, 'superviseDepartmentName', '请选择') || '请选择' }</Text>
                                            <AtIcon className='chevron_right' value='chevron-right' size='20' color='#7A8499' />
                                        </Picker>                                         */}
                                    {/* </View> */}
                                </View>
                            </View>

                            <View className='list-item'>
                                <View className='left'>
                                    <Text className='left__title'>巡查员</Text>
                                </View>
                                <View className='right'>
                                    <View className='right__container' onClick={this.onPerson.bind(this, 'inspector')}>
                                        <Text className='txt'>{get(dataObj, 'inspectorName', '请选择') || '请选择'}</Text>
                                        <AtIcon className='chevron_right' value='chevron-right' size='20' color='#7A8499' />
                                    </View>
                                </View>
                            </View>
                            <View className='list-item'>
                                <View className='left'>
                                    <Text className='left__title'>督查员</Text>
                                </View>
                                <View className='right'>
                                    <View className='right__container' onClick={this.onPerson.bind(this, 'supervisor')}>
                                        <Text className='txt'>{get(dataObj, 'supervisorName', '请选择') || '请选择'}</Text>
                                        <AtIcon className='chevron_right' value='chevron-right' size='20' color='#7A8499' />
                                    </View>
                                </View>
                            </View>
                            <View className='list-item'>
                                <View className='left'>
                                    <Text className='left__title'>组长</Text>
                                </View>
                                <View className='right'>
                                    <View className='right__container' onClick={this.onPerson.bind(this, 'leader')}>
                                        <Text className='txt'>{get(dataObj, 'leaderName', '请选择') || '请选择'}</Text>
                                        <AtIcon className='chevron_right' value='chevron-right' size='20' color='#7A8499' />
                                    </View>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </View>
                <View className='add-page_footer'>
                    <Text className='btn cancel' onClick={this.onCancel}>取消</Text>
                    <Button className='btn save' disabled={isSaving} loading={isSaving} onClick={this.onSubmit}>保存</Button>
                </View>

                <AtCurtain
                    isOpened={showScanDemo}
                    onClose={this.onCurtain.bind(this, false)}
                >
                    <View className='curtain_container'>
                        <Text className='curtain__title'>请保证地点名称清晰</Text>
                        <Image className='curtain__img' src={`${rootSourceBaseUrl}/assets/common/mark-scan.png`} />
                    </View>
                </AtCurtain>
            </View>
        );
    }
}

export default MarkAdd;