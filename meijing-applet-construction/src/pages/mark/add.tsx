import Taro, { Component, Config } from '@tarojs/taro';
import { observer, inject } from '@tarojs/mobx';
import { View, Text, Button, ScrollView, Picker, Image, Input, Textarea, Switch } from '@tarojs/components';
import { AtImagePicker, AtIcon, AtCurtain } from 'taro-ui'
import { rootSourceBaseUrl } from '@common/utils/requests'
import { getPollutionSourceTypeList, pollutionSourceTypeStatus, addReporting } from '../../service/pollutionType'
import { getAddressByLocationFromTencentMap } from '@common/utils/mapUtils'
import { getPageData, getNewFileName } from '@common/utils/common'
import { getDivision } from '../../service/division'
import { UploadResult, uploadFile, getSignature } from '../../service/upload'
import {listDepartmentByDivision, Department} from '../../service/department'

import cn from 'classnames'
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import moment from 'moment'

import './add.scss'

interface AddProps {
    userStore: any;
}

interface AddState {
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
    currentPersonField: string,
    departemtList: Department[],
}

@inject('userStore')
@observer
class MarkAdd extends Component<AddProps, AddState> {
    config: Config = {
        navigationBarTitleText: '新增污染源'
    }

    static externalClasses = ['com-class']

    constructor(props) {
        super(props);

        this.state = {
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
            showMore: false,
            existMonitorDevice: false,
            remark: '',
            linkman: '',
            dataObj: {},
            currentPersonField: '',
            departemtList: [],
        }
    }

    componentDidMount() {
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
    }

    /**
     * 污染类型
     */
    getPollutionType = async () => {
        const { id } = this.$router.params;
        try {
            const res = await getPollutionSourceTypeList();
            const { data } = res;
            this.setState({
                pollutionTypeList: data,
                pollutionType: data.find(item => item.id == id)
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
            const { userStore: {userDetails: currentUserDetails}} = this.props;

            const res = await listDepartmentByDivision(currentUserDetails.divisionCode);
            const { data } = res;
            this.setState({
                departemtList: data
            })
        }
        catch (err) { console.log(err) }
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
                // eslint-disable-next-line react/no-unused-state
                divisionCode: divisionCode,
                // eslint-disable-next-line react/no-unused-state
                divisionName: divisionResp.data.fullName,
            });
        } catch (error) {
        }
    }

    /**
     * 图片选择
     * @param newFiles 
     * @param operationType 
     */
    onImagePickChange(newFiles, operationType: string) {
        if (operationType === 'remove') {
            this.setState({
                files: newFiles,
                showUploadBtn: true
            });
        } else {
            this.setState(() => {
                return ({
                    files: newFiles
                })
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
        let index = res.detail.value;
        const { pollutionTypeList } = this.state;
        this.setState({
            pollutionType: pollutionTypeList[index],
            pollutionStatus: {}
        });
    }

    onPollutionStatusChange = (res) => {
        let index = res.detail.value;
        const { pollutionStatusList, pollutionType } = this.state;
        this.setState({
            pollutionStatus: pollutionStatusList.filter(item => item.pollutionSourceTypeId === pollutionType.id)[index]
        });
    }

    onInputChange = (key, e) => {
        switch (key) {
            case 'name':
                this.setState({ name: e.detail.value })
                break;
            case 'phoneNumber':
                this.setState({ phoneNumber: e.detail.value })
                break;
        }
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
        const { existMonitorDevice } = this.state;
        this.setState({
            existMonitorDevice: !existMonitorDevice
        })
    }

    onPerson = (name: string) => {
        this.setState({ currentPersonField: name })
        Taro.navigateTo({
            url: `../person/index?dataCode=${name}&radio=true&type=4&only=true`
        });
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
        }
        else if (input.longitude == 0 || input.latitude == 0) {
            result = false;
            notice = '未获取到经纬度';
        }
        else if (!isEmpty(input.phoneNumber) && !/^1[3456789]\d{9}$/.test(input.phoneNumber)) {
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

    getImageOssDir() {
        const dayStr: string = moment().format('YYYY/MM/DD');
        return `pollution-sources/images/${dayStr}/`;
    }

    /**
     * 修改部门
     * @param res 
     */ 
    onDepartmentChange(res) {
        let index = res.detail.value;
        const {departemtList, dataObj } = this.state;
        const department:Department = departemtList[index];

        this.setState({
            dataObj: {
                ...dataObj,
                superviseDepartmentId: department.id,
                superviseDepartmentCode: department.code,
                superviseDepartmentName: department.name,
            }
        });
    }    

    /**
     * 污染源上报
     */
    onSubmit = async () => {
        const { pollutionType, files, name, address, longitude, latitude, linkman, phoneNumber,
            pollutionStatus, remark, existMonitorDevice, dataObj } = this.state;
        const { userStore: { userDetails } } = this.props;

        //先完成图片上传
        let pictureOssKeys: string[] = [];
        let firstPictureUrl = '';

        if (files && files.length > 0) {
            const imageDir: string = this.getImageOssDir();
            const { data: signatureResult } = await getSignature(imageDir);
            let promises: Promise<UploadResult>[] = [];

            for (let i = 0; i < files.length; i++) {
                const filePath: string = files[i].url;
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
                return;
            }
            pictureOssKeys = imageUploadResults.map(uploadResult => uploadResult.ossKey);
            firstPictureUrl = imageUploadResults[0].ossKey;
        }

        let input = {
            ...dataObj,
            name: name,
            divisionCode: userDetails.divisionCode,
            divisionName: userDetails.divisionName,
            pollutionSourceTypeId: pollutionType.id,
            address: address,
            longitude: longitude,
            latitude: latitude,
            linkman: linkman,
            phoneNumber: phoneNumber,
            statusId: get(pollutionStatus, 'id'),
            pictureOssKeys: pictureOssKeys.join(','),
            remark: remark,
            existMonitorDevice: existMonitorDevice
        };

        if (!this.reportParameterCheck(input)) {
            return;
        }

        try {
            const reportResp = await addReporting(input);
            let output = reportResp.data;
            firstPictureUrl = firstPictureUrl && firstPictureUrl.length > 0 ? encodeURIComponent(firstPictureUrl) : '';
            let contentToSuccessPage = name && name.length > 0 ? encodeURIComponent(name) : '';

            let pollutionTypeName = pollutionType && pollutionType.name || '';
            //跳转到成功页面
            await Taro.redirectTo({
                url: `./success?type=mark&inspectId=${output.id}
                &firstPictureUrl=${firstPictureUrl}&content=${contentToSuccessPage}
                &pollutionTypeName=${pollutionTypeName}`
            });
        } catch (error) {
            console.log(error);
        }
    }

    render() {
        const { showScanDemo, showMore, pollutionTypeList, pollutionStatusList, pollutionStatus, pollutionType, 
            address, existMonitorDevice, linkman, remark, dataObj, departemtList } = this.state;
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
                                    <Picker mode='selector' value={0} range={pollutionTypeList} range-key='name' onChange={this.onPollutionTypeChange.bind(this)}>
                                        <Text className='txt'>{get(pollutionType, 'name', '请选择')}</Text>
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
                                    <Text className={cn('input', { 'input__placeholder': isEmpty(address) })}>{address ? address : '选择所在的地址'}</Text>
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
                                    files={this.state.files}
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
                                    value={remark}
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
                                            value={linkman}
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
                                        <Switch checked={existMonitorDevice} color='#1091FF' onChange={this.onMonitorChange.bind(this)} />
                                    </View>
                                </View>
                            </View>
                            <View className='list-item'>
                                <View className='left'>
                                    <Text className='left__title'>污染源状态</Text>
                                </View>
                                <View className='right'>
                                    <View className='right__container'>
                                        <Picker mode='selector' value={0} range={pollutionStatusList.filter(item => item.pollutionSourceTypeId === pollutionType.id)} range-key='name' onChange={this.onPollutionStatusChange.bind(this)}>
                                            <Text className='txt'>{get(pollutionStatus, 'name', '请选择')}</Text>
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
                                    <View className='right__container'>
                                        <Picker mode='selector' value={0} range={departemtList} range-key='name' onChange={this.onDepartmentChange.bind(this)}>
                                            <Text className='txt'>{get(dataObj, 'superviseDepartmentName', '请选择')}</Text>
                                            <AtIcon className='chevron_right' value='chevron-right' size='20' color='#7A8499' />
                                        </Picker>                                        
                                    </View>
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
                    <Button className='btn-view' type='primary' onClick={this.onSubmit}>提交</Button>
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