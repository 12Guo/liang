import Taro, { Config } from '@tarojs/taro'
import { AtImagePicker, AtButton } from 'taro-ui'
import { ComponentType } from 'react'
import { observer, inject } from '@tarojs/mobx';
import { SimpleUser } from '../../service/user'
import { getCurrentPage, clearValueInPageData, getNewFileName } from '@common/utils/common'
import { joinAts, joinTags, AtOrTag } from '@common/utils/rich-text'
import { sendDispatchMsg } from '../../service/dispatch'
import { UploadResult, uploadFile, getSignature } from '../../service/upload'
import FpiRecorder from '@common/components/FpiRecorder'
import { ReactiveDispatchRequest } from '../../model/dispatch'
import { SimpleRichInput } from '@common/components/rich-text'
import { View } from '@tarojs/components'
import moment from 'moment';

import './index.scss'


interface FilePath {
    url: string;
}

interface SendNoticeProps {
    userStore: any
}

interface SendNoticeState {
    noticeDetail: string;
    selectFiles: FilePath[];
    /**
     * 录音地址
     */
    recorderPath?: string;
    /**
     * 录音时长
     */
    recoderTimes?: number;
    showUploadBtn: boolean;
    loading: boolean
    /**
    * 是否显示录音
    */
    showRecorder: boolean;
}

interface SendNotice {
    props: SendNoticeProps,
    state: SendNoticeState
}

@inject('userStore')
@observer
class SendNotice extends Taro.Component {

    constructor() {
        super(...arguments)
        this.state = {
            noticeDetail: "",
            selectFiles: [],
            showUploadBtn: true,
            loading: false,
            showRecorder: false,
        }
    }

    config: Config = {
        navigationBarTitleText: '发起调度',
    }

    componentWillMount() {

    }

    onImagePickChange(newFiles, operationType: string) {
        if (newFiles.length > 9) {
            newFiles = newFiles.slice(0, 9);
        }
        this.setState({
            selectFiles: newFiles
        });

        if (operationType === 'remove') {
            this.setState({
                selectFiles: newFiles,
                showUploadBtn: true
            });
        } else {
            this.setState(() => {
                return ({
                    selectFiles: newFiles
                })
            }, () => {
                const { selectFiles } = this.state
                if (selectFiles.length === 9) {
                    this.setState({
                        showUploadBtn: false
                    })
                }
            })
        }
    }

    componentDidShow() {
        let { noticeDetail } = this.state;
        let currentPage = getCurrentPage();
        const { choosedLables, atPersons } = currentPage.data;
        if (choosedLables && choosedLables.length > 0) {
            noticeDetail = joinTags(noticeDetail, choosedLables);
            this.setState({
                noticeDetail: noticeDetail
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
                        name: departmentList[i].departmentName,
                        type: 'department',
                        id: departmentList[i].departmentId,
                    });
                }
            }

            if (devisionList && devisionList.length > 0) {
                for (let i = 0; i < devisionList.length; i++) {
                    atLabels.push({
                        name: devisionList[i].divisionName,
                        type: 'devision',
                        id: devisionList[i].divisionCode,
                    });
                }
            }

            if (personsList && personsList.length > 0) {
                for (let i = 0; i < personsList.length; i++) {
                    atLabels.push({
                        name: personsList[i].name,
                        type: 'user',
                        id: personsList[i].id,
                    });
                }
            }

            noticeDetail = joinAts(noticeDetail, atLabels);
            this.setState({
                noticeDetail: noticeDetail
            });
        }
        clearValueInPageData(["choosedLables", "atPersons"])
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

    /**
     * 录音完成
     * @param path 
     */
    handleRecorderDone(path: string, times: number) {
        this.setState({
            recorderPath: path,
            recoderTimes: times,
            showRecorder: false
        });
    }

    handleContentChange(res) {
        this.setState({
            noticeDetail: res
        })
    }

    getImageOssDir(){
        const dayStr:string = moment().format('YYYY/MM/DD');
        return `reactive-dispatches/images/${dayStr}/`;
    }

    getVoiceOssDir(){
        const dayStr:string = moment().format('YYYY/MM/DD');
        return `reactive-dispatches/voices/${dayStr}/`;
    }

    //发送通知
    async sendNotice() {
        const { selectFiles, noticeDetail, recorderPath, recoderTimes, loading } = this.state;
        //防止重复提交
        if (loading) {
            return;
        }
        let dispatchMsg: ReactiveDispatchRequest = {
            content: noticeDetail,
            voiceOssKey: "",
            pictureOssKeys: "",
            voiceDuration: 0
        };
        this.setState({
            loading: true
        });

        //先完成图片上传
        let pictureOssKeys:string[] = [];

        if(selectFiles.length>0){
            const imageDir:string = this.getImageOssDir();
            const {data: signatureResult} = await getSignature(imageDir);
            let promises:Promise<UploadResult>[] = [];

            for (let i = 0; i < selectFiles.length; i++) {
                const filePath:string = selectFiles[i].url;
                promises.push(uploadFile(filePath, imageDir, getNewFileName(filePath), signatureResult));                
            }
            const imageUploadResults:UploadResult[] = await Promise.all(promises);
            const failure_number:number = imageUploadResults.filter(re=>!re.success).length;
    
            if(failure_number > 0) {
                Taro.showToast({
                    title: `有${failure_number}张图片上传失败，请检查网络环境`,
                    mask: true,
                    icon: 'none',
                    duration: 2000
                });
                this.setState({
                    loading: false,
                });
                return;
            }
            pictureOssKeys = imageUploadResults.map(uploadResult=> uploadResult.ossKey);
        }
        dispatchMsg.pictureOssKeys = pictureOssKeys.join(',');

        if (recorderPath && recorderPath.length > 0) {
            const voiceDir:string = this.getVoiceOssDir();
            const {data: voiceSignatureResult} = await getSignature(voiceDir);
            const uploadResult: UploadResult = await uploadFile(recorderPath, voiceDir, getNewFileName(recorderPath), voiceSignatureResult);
            if (uploadResult.ossKey == '') {
                this.setState({
                    loading: false,
                });
                return;
            }
            dispatchMsg.voiceOssKey = uploadResult.ossKey;
            dispatchMsg.voiceDuration = recoderTimes;
        }

        //发送调度信息
        let response = await sendDispatchMsg(dispatchMsg);
        this.setState({
            loading: false
        })
        if (response.statusCode == 200) {
            let dispatchId = response.data.id;
            Taro.navigateTo({
                url: `/pages/dispatch_send_success/index?dispatchId=${dispatchId}`
            })
        }
    }

    onRecorder = () => {
        const { showRecorder } = this.state
        this.setState({
            showRecorder: !showRecorder
        })
    }

    render() {
        const { selectFiles, noticeDetail, showUploadBtn, recorderPath, recoderTimes, loading, showRecorder } = this.state;

        let placeholderStyle = "color:#B2B8C6;font-size:16px;"
        return (
            <View className="root">
                <View className='contentInputView'>
                    <SimpleRichInput
                        class-name="simple_input"
                        placeholder='输入通知内容...'
                        recoderDuration={recoderTimes}
                        recorderPath={recorderPath}
                        onRecorderDone={this.handleRecorderDone.bind(this)}
                        count={false}
                        placeholderStyle={placeholderStyle}
                        className="rich_input"
                        value={noticeDetail}
                        onAt={this.onAt.bind(this)}
                        onTag={this.onTag.bind(this)}
                        onRecorder={this.onRecorder.bind(this)}
                        onValueChange={this.handleContentChange.bind(this)}
                    />
                </View>
                {showRecorder && <FpiRecorder onDone={this.handleRecorderDone.bind(this)} onCancel={this.onRecorder} />}
                <AtImagePicker
                    className='imagePickView'
                    mode='aspectFill'
                    files={selectFiles}
                    length={4}
                    count={9}
                    showAddBtn={showUploadBtn}
                    onChange={this.onImagePickChange.bind(this)}
                />
                <View className="btn_group">
                    <AtButton className="btn" loading={loading} type='primary' onClick={this.sendNotice.bind(this)}>发送</AtButton>
                </View>
            </View>
        )
    }

} export default SendNotice as ComponentType