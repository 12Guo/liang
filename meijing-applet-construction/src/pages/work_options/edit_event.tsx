import Taro, { Component, Config, } from '@tarojs/taro'
import { View, Text, Button, Picker, Image } from '@tarojs/components'
import { AtImagePicker, AtIcon, AtSwipeAction, AtModal, AtModalContent, AtModalAction } from 'taro-ui'
import { observer, inject } from '@tarojs/mobx';
import { clearValueInPageData, getCurrentPage, navBackWithData, getPrevPageData, getNewFileName } from '@common/utils/common'
import { SimpleRichInput } from '@common/components/rich-text'
import { joinAts, joinTags, AtOrTag } from '@common/utils/rich-text'
import { PollutionType, list as pollutionTypelist } from '../../service/pollutionType'
import { getAddressByLocationFromTencentMap } from '@common/utils/mapUtils'
import { rootSourceBaseUrl } from '@common/utils/requests'
import { getDivision } from '../../service/division'
import { reply as inspectReply, InspectInfoType } from '../../service/inspect'
import { SimpleUser } from '../../service/user'
import { getLocation } from '../../service/userDivision'
import { Location } from '../../model'
import { UploadResult, uploadFile, getSignature } from '../../service/upload'
import { sentryInspectsDetail, updateSentryInspects, delSentryInspects } from '../../service/home'
import moment from 'moment';
import get from 'lodash/get';

import './edit_event.scss'
import isEmpty from 'lodash/isEmpty';


interface FilePath {
  url: string;
}

interface InspectEditProps {
  userStore: any;
}

interface InspectEditState {
  /**
   * 事件id
   */
  inspectId: number;
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
  enforcementLaw: boolean;
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
   * 是否显示添加图片按钮
   */
  showUploadBtn: boolean;

  /**
   * 编辑button loading状态
   */
  eidtButtonLoading: boolean;

  longitude: number,
  latitude: number,
  inspectDetail: any;
  isTipShow: boolean,
}

@inject('userStore')
@observer
export default class InspectEdit extends Component<InspectEditProps, InspectEditState> {

  config: Config = {
    navigationBarTitleText: '编辑事件'
  }

  constructor(props) {
    super(props)
    const { replyOrigin = 'works', inspectId } = this.$router.params;
    this.state = {
      inspectId: inspectId && Number(inspectId) || 0,
      pollutionTypeList: [],
      files: [],
      showUploadBtn: true,
      status: false,
      enforcementLaw: false,
      type: InspectInfoType.INCIDENT,
      eidtButtonLoading: false,
      longitude: 0,
      latitude: 0,
      inspectDetail: {},
      isTipShow: false
    }
  }

  async componentDidMount() {
    try {
      sentryInspectsDetail(this.state.inspectId).then(res => {
        const inspectDetail = get(res, 'data', {})
        if ((!inspectDetail) || inspectDetail.deleted || inspectDetail.isAudited) {
          Taro.navigateBack().catch(() => {
            Taro.reLaunch({
              url: './examine'
            })
          })
          return
        }

        this.setState({
          inspectId: inspectDetail.id,
          inspectDetail,
          files: (get(inspectDetail, 'pictureLinks', []) || []).map(pic => ({
            url: pic
          }))
        });
      })
    }
    catch (error) { }


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
    let { inspectDetail } = this.state;

    /**
     * 标签选择
     */
    if (choosedLables && choosedLables.length > 0) {
      inspectDetail.content = joinTags(inspectDetail.content, choosedLables);

      this.setState({ inspectDetail });
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

      inspectDetail.content = joinAts(inspectDetail.content, atLabels);
      this.setState({ inspectDetail });
    }

    /**
     * 污染源企业
     */
    if (pollutionSourceData) {
      inspectDetail.pollutionSourceId = pollutionSourceData.id
      inspectDetail.pollutionSourceName = pollutionSourceData.name
      inspectDetail.pollutionSourceTypeId = pollutionSourceData.pollutionSourceTypeId
      this.setState({ inspectDetail });
    }

    clearValueInPageData(['choosedLables', 'atPersons', 'pollutionSourceData']);
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
      url: '/pages/works/labelChoose'
    });
  }

  handleContentChange(value: string) {
    const { inspectDetail } = this.state
    inspectDetail.content = value || ''
    this.setState({ inspectDetail });
  }

  onImagePickChange(newFiles, operationType: string, index: number) {
    if (operationType === 'remove') {
      const { inspectDetail } = this.state
      const pictureOssKeysNew = inspectDetail.pictureOssKeys.split(',')
      pictureOssKeysNew.splice(index, 1)
      inspectDetail.pictureOssKeys = pictureOssKeysNew.join(',')
      this.setState({
        files: newFiles,
        showUploadBtn: true,
        inspectDetail
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

  onPollutionTypeChange(res) {
    let index = res.detail.value;
    const { pollutionTypeList, inspectDetail } = this.state;
    const pollutionType = pollutionTypeList[index]
    inspectDetail.pollutionTypeId = pollutionType.id
    inspectDetail.pollutionTypeName = pollutionType.name

    this.setState({ inspectDetail });
  }


  /**
     * 事件编辑参数校验
     * @param input 
     */
  eventParameterCheck(pictureOssKeys: string[]) {
    const { inspectDetail } = this.state
    let result: boolean = true;
    let notice: string = '';

    if ((isEmpty(pictureOssKeys) && get(inspectDetail, 'pictureLinks', []).length === 0)
      || (!inspectDetail.content && inspectDetail.content.length == 0)) {
      result = false;
      notice = '请输入文字或上传图片';
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
    return `inspect/reply/images/${dayStr}/`;
  }

  async save() {
    const { files, inspectDetail } = this.state;
    const { userStore: { userDetails } } = this.props;

    this.setState({
      eidtButtonLoading: true,
    });

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
          eidtButtonLoading: false,
        });
        return;
      }
      pictureOssKeys = imageUploadResults.map(uploadResult => uploadResult.ossKey);
      if (inspectDetail.pictureOssKeys) {
        inspectDetail.pictureOssKeys += ',' + pictureOssKeys.join(',')
      }
      else {
        inspectDetail.pictureOssKeys = pictureOssKeys.join(',')
      }
    }
    console.log(inspectDetail, 1)

    if (!this.eventParameterCheck(pictureOssKeys)) {
      this.setState({
        eidtButtonLoading: false,
      });
      return;
    }

    try {
      updateSentryInspects(inspectDetail, userDetails).then(res => {
        navBackWithData({
          refresh: true
        });
      }).catch(() => {
        Taro.reLaunch({
          url: './examine'
        })
      })
    } catch (error) { }

    this.setState({
      eidtButtonLoading: false,
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
      const { inspectDetail } = this.state
      inspectDetail.latitude = latitude
      inspectDetail.longitude = longitude
      inspectDetail.address = res.address

      this.setState({ inspectDetail });
    } catch (error) {
    }
  }

  // 取消删除
  handleCancel = () => {
    this.setState({ isTipShow: false })
  }

  // 删除操作
  handleDelete = () => {
    this.setState({ isTipShow: false }, () => {
      const { inspectDetail } = this.state
      delSentryInspects(inspectDetail.id).then(res => {
        navBackWithData({
          refresh: true
        });
      })
    })
  }

  onConfrm = () => {
    this.setState({ isTipShow: true })
  }

  showBigImage = (files) => {
    Taro.previewImage({
      urls: files.map(file => file.url)
    })
  }

  render() {
    const { files, pollutionTypeList, showUploadBtn, eidtButtonLoading, inspectDetail, isTipShow } = this.state;

    return (
      <View className='content'>
        <View className='content_container'>
          <View className='contentInputView'>
            <SimpleRichInput
              value={inspectDetail.content}
              onAt={this.onAt.bind(this)}
              onTag={this.onTag.bind(this)}
              showVoice={false}
              onValueChange={this.handleContentChange.bind(this)}
            />
          </View>

          <View className='imagePickView_container'>
            <AtImagePicker
              className='imagePickView'
              mode='aspectFill'
              files={files}
              length={4}
              showAddBtn={showUploadBtn}
              onChange={this.onImagePickChange.bind(this)}
              onImageClick={this.showBigImage.bind(this, files)}
            />
          </View>

          <View className='address_container'>
            <View className='address' onClick={this.addressSelect.bind(this)}>
              <Image className='addressIcon' src={`${rootSourceBaseUrl}/assets/works/address2.png`} />
              <Text className='text'>{get(inspectDetail, 'address', '')}</Text>
            </View>
          </View>

          <View>
            <View className='replyinfoView'>
              <View className='info_item'>
                <Text className='item_left'>污染类型</Text>
                <View className='item_right'>
                  <Picker mode='selector' value={0} range={pollutionTypeList} range-key='name' onChange={this.onPollutionTypeChange.bind(this)}>
                    <AtIcon className='chevron_right' value='chevron-right' size='20' color='#7A8499' />
                    <Text className={inspectDetail.pollutionTypeId ? 'text_right choosed' : 'text_right'}>{get(inspectDetail, 'pollutionTypeName', '')}</Text>
                  </Picker>
                </View>
              </View>
              <View className='info_item' onClick={this.handlePollutionSourceChange.bind(this)}>
                <Text className='item_left'>污染源</Text>
                <View className='item_right'>
                  <AtIcon className='chevron_right' value='chevron-right' size='20' color='#7A8499' />
                  <Text className={inspectDetail.pollutionSourceName ? 'text_right choosed' : 'text_right'}>{get(inspectDetail, 'pollutionSourceName', '')}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View className='buttonView'>
          <View className='delButton' onClick={this.onConfrm}>
            <View className='img'></View>
            <Text className='txt'>删除</Text>
          </View>
          <Button className='eidtButton' disabled={eidtButtonLoading} loading={eidtButtonLoading} onClick={this.save.bind(this)}>生成事件</Button>
        </View>

        <AtModal isOpened={isTipShow} className='modelStyle'>
          <AtModalContent>
            <View className='model_body' style={{ textAlign: 'center', marginTop: '20PX', fontSize: '16PX' }}>确认删除该事件？</View>
          </AtModalContent>
          <AtModalAction>
            <Button onClick={this.handleCancel}>
              <View className='model_cancel'>取消</View>
            </Button>
            <Button onClick={this.handleDelete}>
              <View className='model_confirm'>确定</View>
            </Button>
          </AtModalAction>
        </AtModal>
      </View>
    )
  }
}