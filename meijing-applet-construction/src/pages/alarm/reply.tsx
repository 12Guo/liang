import Taro, { Component, Config, } from '@tarojs/taro'
import { View, Text, Button, Switch } from '@tarojs/components'
import { AtImagePicker } from 'taro-ui'
import { observer, inject } from '@tarojs/mobx';
import { clearValueInPageData, getCurrentPage, navBackWithData, getNewFileName } from '@common/utils/common'
import { SimpleRichInput } from '@common/components/rich-text'
import { joinAts, joinTags, AtOrTag } from '@common/utils/rich-text'
import { addComments, addDisposed } from '../../service/dispatch'
import { SimpleUser } from '../../service/user'
import FpiRecorder from '@common/components/FpiRecorder'
import { UploadResult, uploadFile, getSignature } from '../../service/upload'
import { alarmsStatus } from '../../service/alarm'
import moment from 'moment';

import './reply.scss'
import get from 'lodash/get';

interface FilePath {
  url: string;
}

interface AlarmReplyProps {
  userStore: any;
}

interface AlarmReplyState {
  /**
   * 报警id
   */
  alarmId: number | string;
  /**
   * 回复报警的内容
   */
  content: string;
  voiceOssKey?: string;
  videoOssKey?: string;
  pictureOssKeys?: string;
  attachmentOssKeys?: string;
  /**
    * 报警状态 false:未完成 true：完成
    */
  status: boolean;

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

  showRecorder: boolean;
}

@inject('userStore')
@observer
export default class AlarmReply extends Component<AlarmReplyProps, AlarmReplyState> {

  config: Config = {
    navigationBarTitleText: '处置',
    navigationBarBackgroundColor: '#FFFFFF',
    navigationBarTextStyle: 'black',
    backgroundColor: '#FFFFFF',
  }

  constructor(props) {
    super(props)
    const { alarmId, status } = this.$router.params;
    console.log(status, 'status')
    this.state = {
      alarmId: alarmId && Number(alarmId) || 0,
      content: '',
      files: [],
      showUploadBtn: true,
      status: false,
      eidtButtonLoading: false,
      showRecorder: false
    }
  }

  componentDidMount() {
    const { alarmId } = this.state
    alarmsStatus(alarmId).then(res => {
      this.setState({
        status: get(res, 'data', 'NOT_DISPOSED') === 'ALREADY_DISPOSED'
      })
    })
  }


  componentDidShow() {
    let currentPage = getCurrentPage();
    const { choosedLables, atPersons } = currentPage.data;
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

    clearValueInPageData(['choosedLables', 'atPersons']);
  }


  /**
   * 报警是否处置完成
   */
  onStatusChange() {
    const { status } = this.state;
    this.setState({
      status: !status
    });
  }


  onAt() {
    Taro.navigateTo({
      url: '/pages/person/index?dataCode=atPersons'
    });
  }

  onTag() {
    Taro.navigateTo({
      url: '/pages/works/labelChoose'
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
     * 报警回复参数校验
     * @param input 
     */
  replyParameterCheck(input: any) {
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

  getImageOssDir() {
    const dayStr: string = moment().format('YYYY/MM/DD');
    return `alarm/reply/images/${dayStr}/`;
  }

  getVoiceOssDir() {
    const dayStr: string = moment().format('YYYY/MM/DD');
    return `alarm/reply/voices/${dayStr}/`;
  }

  async save() {
    const { alarmId, content, status,
      files, recorderPath, voiceDuration, } = this.state;

    this.setState({
      eidtButtonLoading: true,
    });

    //先完成图片上传
    let pictureOssKeys: string[] = [];

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

        this.setState({
          eidtButtonLoading: false,
        });
        return;
      }
      pictureOssKeys = imageUploadResults.map(uploadResult => uploadResult.ossKey);
    }

    let voiceOssKey = '';
    if (recorderPath && recorderPath.length > 0) {
      const voiceDir: string = this.getVoiceOssDir();
      const { data: voiceSignatureResult } = await getSignature(voiceDir);

      const uploadResult: UploadResult = await uploadFile(recorderPath, voiceDir, getNewFileName(recorderPath), voiceSignatureResult);
      if (uploadResult.ossKey == '') {
        this.setState({
          eidtButtonLoading: false,
        });
        return;
      }
      voiceOssKey = uploadResult.ossKey;
    }

    let input: any = {
      content: content,
      voiceOssKey: voiceOssKey,
      voiceDuration: voiceDuration || 0,
      videoOssKey: '',
      pictureOssKeys: pictureOssKeys.join(','),
      attachmentOssKeys: '',
      appendDatas: {
        alarmStatus: status ? 1 : 0
      }
    };

    if (!this.replyParameterCheck(input)) {
      this.setState({
        eidtButtonLoading: false,
      });
      return;
    }
    try {
      await addComments('alarms', alarmId, input);
      if (alarmId) {
        await addDisposed(alarmId, status ? 'ALREADY_DISPOSED' : 'NOT_DISPOSED')
      }
      navBackWithData({
        replyRefresh: true,
        status,
      });
    } catch (error) {
    }
    this.setState({
      eidtButtonLoading: false,
    });
  }


  render() {
    const { files, content, showUploadBtn,
      status, recorderPath, voiceDuration,
      eidtButtonLoading, showRecorder } = this.state;

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

          <View className='replyinfoView'>
            <View className='info_item'>
              <Text className='item_left'>是否处置完成</Text>
              <View className='item_right'>
                <Switch checked={status} color='#1091FF' onClick={this.onStatusChange.bind(this)} />
              </View>
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