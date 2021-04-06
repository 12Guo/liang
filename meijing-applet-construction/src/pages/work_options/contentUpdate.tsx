import Taro, { Component } from '@tarojs/taro';
import { View, Text, Button } from '@tarojs/components'
import { AtImagePicker, AtTextarea } from 'taro-ui'
import { getNewFileName } from '@common/utils/common'
import './contentUpdate.scss'
import moment from 'moment'
import { UploadResult, uploadFile, getSignature } from '../../service/upload'
import { inspectContentSumbit, getUpdatedItem, getUpdate } from '../../service/workbench'
import { getLocation } from '../../service/userDivision'
import { getAddressByLocationFromTencentMap } from '@common/utils/mapUtils'
import { Location } from '../../model'
import isEmpty from 'lodash/isEmpty';



interface MyProps { }

interface MyState {
    selectOptions: string[]
    selectedId: number
    inspectContent: string
    files: any
    showUploadBtn: boolean
    submitButtonLoading: boolean
    pollutionSourceId: number | string,
    pollutionSourceName: string,
    labelId: number,
    address: string,
    longitude: number,
    latitude: number,
    content: string,
    pictureOssKeys: string,
    status: string,
    isUpdatePage: boolean,
    id: number,
    dataObj: any
}

class Index extends Component<MyProps, MyState> {

    constructor(props) {
        super(props)
        this.state = {
            inspectContent: '',
            // 选择的选项
            selectOptions: ['正常', '立行立改', '延期整改'],
            selectedId: 0,
            // 上传图片文件列表
            files: [],
            // 是否继续显示上传添加按钮
            showUploadBtn: true,
            // 提交时等待开启
            submitButtonLoading: false,
            // 请求接口的参数param
            pollutionSourceId: 0,
            pollutionSourceName: '',
            labelId: 0,
            address: '',
            // 经纬值
            longitude: 0,
            latitude: 0,
            // 内容
            content: '',
            // 图片返回的路径
            pictureOssKeys: '',
            status: 'NORMAL',
            isUpdatePage: false,
            // 保存的id
            id: 0,
            dataObj: {}
        }
    }

    config = {
        navigationBarTitleText: '上传内容'
    };

    componentDidMount() {
        this.getInitData()
    }

    // 初始化的时候请求的数据
    async getInitData() {
        this.getLocationAndDivision()
        // 如果是回显的页面，那就显示
        if (this.$router.preload.update) {
            let index = 0
            const response = await getUpdatedItem(this.$router.preload.labelDetails.specialPatrolItemId)

            let { content, status, pictureOssKeys, pictureOssLinks } = response.data

            if (status === 'NORMAL') {
                index = 0
            } else if (status === 'IMMEDIATELY') {
                index = 1
            } else if (status === 'DELAY') {
                index = 2
            } else {
                index = 0
            }

            this.setState({
                dataObj: response.data,
                content: content,
                status: status,
                pictureOssKeys: pictureOssKeys.join(','),
                selectedId: index,
                isUpdatePage: true,
                files: pictureOssLinks.map((item) => ({ url: item })),
                id: this.$router.preload.labelDetails.specialPatrolItemId
            })
        }

        // 获取上一个页面传递来的参数
        this.setState({
            inspectContent: this.$router.preload.labelDetails.labelDetails,
            labelId: this.$router.preload.labelDetails.labelId,
            pollutionSourceId: this.$router.preload.pollutionSourceId,
            pollutionSourceName: this.$router.preload.siteName,
        })
    }

    // 选择staus的时候
    selected = (index) => {

        let status;
        if (index === 0) {
            status = 'NORMAL'
        } else if (index === 1) {
            status = 'IMMEDIATELY'
        } else if (index === 2) {
            status = 'DELAY'
        } else {
            status = ''
        }

        this.setState({
            selectedId: index,
            status
        })
    }

    getLocationAndDivision = async () => {

        try {
            let location: Location = await getLocation();
            let addressResponse = await getAddressByLocationFromTencentMap(location.latitude, location.longitude);
            let addressResult = addressResponse.data.result;

            this.setState({
                longitude: location.longitude,
                latitude: location.latitude,
                address: addressResult.address,
            });
        } catch (error) {
        }
    }

    // 提交按钮或者修改按钮
    onSubmit = async () => {
        let { id, isUpdatePage, pollutionSourceId, pollutionSourceName, labelId, address, longitude, latitude, content, status } = this.state

        this.setState({
            submitButtonLoading: true,
        }, async () => {
            const { dataObj, files } = this.state
            const newFiles = files.filter((item: any) => item.url.includes('tmp'))
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
                        submitButtonLoading: false,
                    });
                    return;
                }
                pictureOssKeys = imageUploadResults.map(uploadResult => uploadResult.ossKey);
                if (dataObj.pictureOssKeys) {
                    dataObj.pictureOssKeys += ',' + pictureOssKeys.join(',')
                } else {
                    dataObj.pictureOssKeys = pictureOssKeys.join(',')
                }

            }

            let requestParam = {
                pollutionSourceId: pollutionSourceId,
                pollutionSourceName: pollutionSourceName,
                labelId: labelId,
                address: address,
                longitude: longitude,
                latitude: latitude,
                content: content,
                pictureOssKeys: pictureOssKeys.join(','),
                status: status
            }
            try {
                let resp

                // 如果是修改页面
                if (isUpdatePage) {
                    let updateParam = {
                        id,
                        pictureOssKeys: dataObj.pictureOssKeys,
                        content,
                        status
                    }
                    // 至少为一张图片的警告
                    if (updateParam.pictureOssKeys.length === 0) {
                        Taro.showToast({
                            title: `至少选择一张图片`,
                            mask: true,
                            icon: 'none',
                            duration: 2000
                        });
                        this.setState({
                            submitButtonLoading: false,
                        });
                        return;
                    }

                    resp = await getUpdate(updateParam)
                } else {
                    resp = await inspectContentSumbit(requestParam)
                }
                if (resp.data.success) {
                    Taro.setStorageSync('update-content', true)
                    Taro.navigateBack()
                    Taro.showToast({
                        title: `保存成功`,
                        mask: true,
                        icon: 'none',
                        duration: 500
                    });
                }
            } catch (error) {
                console.log(error)
            }
            this.setState({
                submitButtonLoading: false,
            });
        });
    }

    // 获取oss上传文件夹名称
    getImageOssDir() {
        const dayStr: string = moment().format('YYYY/MM/DD');
        return `inspect/images/${dayStr}/`;
    }

    // 添加图片的回调函数
    onImagePickChange = (newFiles, operationType: string, index) => {
        if (operationType === 'remove') {
            const { dataObj: { pictureOssKeys, pictureOssLinks }, dataObj } = this.state
            const pictureOssKeysNew = pictureOssKeys
            !isEmpty(pictureOssKeysNew) && pictureOssKeysNew.splice(index, 1)
            !isEmpty(pictureOssLinks) && pictureOssLinks.splice(index, 1)
            this.setState({
                files: newFiles,
                showUploadBtn: true,
                dataObj: {
                    ...dataObj,
                    pictureOssKeys: pictureOssKeysNew || [],
                    pictureOssLinks: pictureOssLinks || []
                }
            }, () => {
                if (this.state.pictureOssKeys.length === 0) {
                    // Taro.showToast({
                    //     title: `至少选择一张图片`,
                    //     mask: true,
                    //     icon: 'none',
                    //     duration: 2000
                    // });
                }
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

    handleChange(e) {
        let value
        if (typeof e === 'object') {
            value = e.detail.value || e.target.value
        } else {
            value = e
        }

        this.setState({
            content: value
        })
    }

    onImageClick = () => {

    }

    render() {
        const { selectedId, selectOptions, inspectContent, files, showUploadBtn, content, submitButtonLoading, isUpdatePage } = this.state
        return (
            <View className="content">
                <View className="content_title">
                    <Text className="txt1">巡查内容：</Text>
                    <View>
                        <Text className="txt2">{inspectContent}</Text>
                    </View>
                </View>
                <View className="image_contain">
                    <AtImagePicker
                        className='imagePickView'
                        mode='aspectFill'
                        files={files}
                        length={3}
                        showAddBtn={showUploadBtn}
                        onChange={this.onImagePickChange.bind(this)}
                        onImageClick={this.onImageClick.bind(this)}
                    />

                    {/* {showPreview && <FpiPreviewImage picIndex={picIndex} photos={photos} onBack={this.onPreviewBack.bind(this)} onDelete={this.onPreviewDelete.bind(this)} />} */}
                </View>
                <View className="status_select">
                    <Text className="txt3">此项内容状态</Text>
                    <View className="options">
                        {
                            selectOptions.map((item, index) => {
                                return <View className={`${selectedId === index ? "options_item_selected" : "options_item_select"}`} onClick={() => this.selected(index)}>{item}</View>
                            })
                        }
                    </View>
                </View>

                <AtTextarea
                    value={content}
                    onChange={this.handleChange.bind(this)}
                    maxLength={200}
                    placeholder='请输入描述文字（非必填）'
                />
                <View onClick={this.onSubmit}>
                    <Button className="submit" disabled={submitButtonLoading} loading={submitButtonLoading}>{isUpdatePage ? '确认修改' : '确认上传'}</Button>
                </View>
            </View>
        );
    }
}
export default Index