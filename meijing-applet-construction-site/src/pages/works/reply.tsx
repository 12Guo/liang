import Taro, { Component, Config, } from '@tarojs/taro'
import { View, Text, Button, Picker, Switch } from '@tarojs/components'
import { AtImagePicker, AtIcon } from 'taro-ui'
import { observer, inject } from '@tarojs/mobx';
import { clearValueInPageData, getCurrentPage, navBackWithData, getPrevPageData, getNewFileName } from '@common/utils/common'
import { SimpleRichInput } from '@common/components/rich-text'
import { joinAts, joinTags, AtOrTag } from '../../common/utils/rich-text'
import { PollutionType, list as pollutionTypelist } from '../../service/pollutionType'
import { InspectDetail, InspectCommentsInput, reply as inspectReply, InspectInfoType } from '../../service/inspect'
import { addComments } from '../../service/dispatch'
import { SimpleUser } from '../../service/user'
import FpiRecorder from '@common/components/FpiRecorder'
import { getLocation } from '../../service/userDivision'
import { Location } from '../../model'
import { UploadResult, uploadFile, getSignature } from '../../service/upload'
import moment from 'moment';

import './reply.scss'


interface FilePath {
  url: string;
}

interface InspectReplyProps {
  userStore: any;
}

interface InspectReplyState {
  /**
   * 事件id
   */
  inspectId: number;
  /**
   * 回复事件的内容
   */
  content: string;
  voiceOssKey?: string;
  videoOssKey?: string;
  pictureOssKeys?: string;
  attachmentOssKeys?: string;
  /**
    * 事件状态 false:未完成 true：完成
    */
  status: boolean;

  /**
   * 是否行政执法
   */
  enforcementLaw?: boolean;
  /**
   * 选择的污染类型
   */
  pollutionType?: PollutionType;

  pollutionSourceId?: number,
  pollutionSourceName?: string,
  pollutionSourceTypeId?: number,
  /**
   * 事件类型
   */
  type: InspectInfoType;

  /**
   * 污染类型列表
   */
  pollutionTypeList: PollutionType[];

  /**
   * 文件上传后存放的地址
   */
  files: FilePath[];

  /**
   * 录音地址
   */
  recorderPath?: string;
  /**
   * 录音时长
   */
  voiceDuration?: number;

  /**
   * 是否显示添加图片按钮
   */
  showUploadBtn: boolean;

  /**
   * 编辑button loading状态
   */
  eidtButtonLoading: boolean;
  /**
   * 回复来源
   */
  replyOrigin: string,

  longitude: number,
  latitude: number,
  showRecorder: boolean;
}

@inject('userStore')
@observer
export default class InspectReply extends Component<InspectReplyProps, InspectReplyState> {

  config: Config = {
    navigationBarTitleText: '回复',
    navigationBarBackgroundColor: '#FFFFFF',
    navigationBarTextStyle: 'black',
    backgroundColor: '#FFFFFF',
  }

  constructor(props) {
    super(props)
    const { replyOrigin = 'works', inspectId } = this.$router.params;
    this.state = {
      inspectId: inspectId && Number(inspectId) || 0,
      content: '',
      pollutionTypeList: [],
      files: [],
      showUploadBtn: true,
      status: false,
      enforcementLaw: false,
      type: InspectInfoType.INCIDENT,
      eidtButtonLoading: false,
      replyOrigin: replyOrigin,
      longitude: 0,
      latitude: 0,
      showRecorder: false
    }
  }

  async componentDidMount() {
    let prevPageData = getPrevPageData();
    let inspectDetail: InspectDetail = prevPageData.inspectDetail;

    if (!inspectDetail) {
      return;
    }

    this.setState({
      inspectId: inspectDetail.id,
      status: inspectDetail.status,
      enforcementLaw: inspectDetail.enforcementLaw,
      pollutionType: {
        id: inspectDetail.pollutionTypeId,
        name: inspectDetail.pollutionTypeName,
      },
      pollutionSourceId: inspectDetail.pollutionSourceId,
      pollutionSourceName: inspectDetail.pollutionSourceName,
      pollutionSourceTypeId: inspectDetail.pollutionSourceTypeId,
      type: inspectDetail.type,
    });

    try {
      const pollutionTypelistRes = await pollutionTypelist();
      this.setState({ pollutionTypeList: pollutionTypelistRes.data })
    } catch (error) {
    }

    try {
      let location: Location = await getLocation();
      this.setState({
        longitude: location.longitude,
        latitude: location.latitude,
      });
    } catch (error) {
    }

  }


  componentDidShow() {
    let currentPage = getCurrentPage();
    const { choosedLables, atPersons, pollutionSourceData } = currentPage.data;
    let { content } = this.state;

    /**
     * 标签选择
     */
    if (choosedLables && choosedLables.length > 0) {
      content = joinTags(content, choosedLables);

      this.setState({
        content: content
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

    clearValueInPageData(['choosedLables', 'atPersons', 'pollutionSourceData']);
  }


  /**
   * 事件是否处置完成
   */
  onStatusChange() {
    const { status } = this.state;
    this.setState({
      status: !status
    });
  }

  onAt() {
    Taro.navigateTo({
      url: '../person/index?dataCode=atPersons'
    });
  }

  onTag() {
    Taro.navigateTo({
      url: './labelChoose'
    });
  }

  handleContentChange(value: string) {
    this.setState({
      content: value || ''
    });
  }

  onRecorder = () => {
    const { showRecorder } = this.state
    this.setState({
      showRecorder: !showRecorder
    })
  }

  onImagePickChange(newFiles, operationType: string, index: number) {
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

  /**
   * 录音完成
   * @param path 
   */
  handleRecorderDone(path: string, duration: number) {
    this.setState({
      recorderPath: path,
      voiceDuration: duration,
      showRecorder: false
    });
  }


  /**
     * 事件回复参数校验
     * @param input 
     */
  replyParameterCheck(input: InspectCommentsInput) {
    let result: boolean = true;
    let notice: string = '';

    if ((!input.pictureOssKeys || input.pictureOssKeys.length == 0)
      && (!input.voiceOssKey || input.voiceOssKey.length == 0)
      && (!input.videoOssKey || input.videoOssKey.length == 0)
      && (!input.content || input.content.length == 0)) {
      result = false;
      notice = '请输入文字或上传图片、语音、视频';
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

  getImageOssDir(){
    const dayStr:string = moment().format('YYYY/MM/DD');
    return `inspect/reply/images/${dayStr}/`;
  }

  getVoiceOssDir(){
      const dayStr:string = moment().format('YYYY/MM/DD');
      return `inspect/reply/voices/${dayStr}/`;
  }

  async save() {
    const { inspectId, pollutionType, content, enforcementLaw, status,
      files, pollutionSourceId, pollutionSourceName, pollutionSourceTypeId,
      recorderPath, voiceDuration, replyOrigin } = this.state;
    const { userStore: { userDetails } } = this.props;

    this.setState({
      eidtButtonLoading: true,
    });

    //先完成图片上传
    let pictureOssKeys: string[] = [];

    if (files && files.length > 0) {
      const imageDir:string = this.getImageOssDir();
      const {data: signatureResult} = await getSignature(imageDir);   
      let promises:Promise<UploadResult>[] = [];

      for (let i = 0; i < files.length; i++) {
        const filePath:string = files[i].url;
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
              eidtButtonLoading: false,
          });
          return;
      }
      pictureOssKeys = imageUploadResults.map(uploadResult=> uploadResult.ossKey);
    }

    let voiceOssKey = '';
    if (recorderPath && recorderPath.length > 0) {
      const voiceDir:string = this.getVoiceOssDir();
      const {data: voiceSignatureResult} = await getSignature(voiceDir);
      const uploadResult: UploadResult = await uploadFile(recorderPath, voiceDir, getNewFileName(recorderPath), voiceSignatureResult);
      if (uploadResult.ossKey == '') {
        this.setState({
          eidtButtonLoading: false,
        });
        return;
      }
      voiceOssKey = uploadResult.ossKey;
    }

    let input: InspectCommentsInput = {
      inspectId: inspectId,
      pollutionSourceId: pollutionSourceId,
      pollutionSourceName: pollutionSourceName,
      pollutionSourceTypeId: pollutionSourceTypeId,
      content: content,
      enforcementLaw: enforcementLaw,
      status: status,
      voiceOssKey: voiceOssKey,
      voiceDuration: voiceDuration || 0,
      videoOssKey: '',
      pictureOssKeys: pictureOssKeys.join(','),
      attachmentOssKeys: '',
      pollutionTypeId: pollutionType && pollutionType.id,
      disposalDepartmentName: userDetails.departmentNode && userDetails.departmentNode.name,
      disposalDepartmentId: userDetails.departmentNode && userDetails.departmentNode.id,
    };

    if (!this.replyParameterCheck(input)) {
      this.setState({
        eidtButtonLoading: false,
      });
      return;
    }

    try {
      if (replyOrigin == 'dispatch') {
        //响应式调度回复
        await addComments('reactive-dispatches', input.inspectId, input);
      } else if (replyOrigin == 'alarm') {
        await addComments('alarms', input.inspectId, input);
      }
      else {
        await inspectReply(input);
      }
      navBackWithData({
        refresh: true
      });
    } catch (error) {
    }

    this.setState({
      eidtButtonLoading: false,
    });
  }


  render() {
    const { files, content, pollutionTypeList, showUploadBtn, pollutionType,
      pollutionSourceName, status, enforcementLaw, recorderPath, voiceDuration, type,
      eidtButtonLoading, replyOrigin, showRecorder } = this.state;

    return (
      <View className='content'>
        <View className='content_container'>
          <View className='contentInputView'>
            <SimpleRichInput
              value={content}
              recoderDuration={voiceDuration}
              recorderPath={recorderPath}
              onAt={this.onAt.bind(this)}
              onTag={this.onTag.bind(this)}
              onRecorder={this.onRecorder.bind(this)}
              onValueChange={this.handleContentChange.bind(this)}
              onRecorderDone={this.handleRecorderDone.bind(this)}
              source="green_construction"
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
            />
          </View>

          <View style={{ display: replyOrigin == 'works' ? 'block' : 'none' }}>
            <View className='replyinfoView'>
              {
                type == InspectInfoType.INCIDENT &&
                <View className='info_item'>
                  <Text className='item_left'>是否处置完成</Text>
                  <View className='item_right'>
                    <Switch checked={status} color='#1091FF' onClick={this.onStatusChange.bind(this)} />
                  </View>
                </View>
              }
            </View>

          </View>

        </View>

        <View className='buttonView'>
          <Button className='eidtButton' disabled={eidtButtonLoading} loading={eidtButtonLoading} onClick={this.save.bind(this)}>发送</Button>
        </View>
      </View>
    )
  }
}