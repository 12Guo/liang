import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, Image,Button } from '@tarojs/components'
import { rootSourceBaseUrl } from '@common/utils/requests'
import { inspectTypeText } from '@common/utils/common'
import { share,InspectInfoType,generateUrl,GenerateUrlInputData } from '../../service/inspect'
import { observer, inject } from '@tarojs/mobx';

import './success.scss'

interface InspectReportSuccessProps {
  userStore: any;
}

interface InspectReportSuccessState {
    inspectId?:number;
    type:InspectInfoType;
    firstPictureUrl?:string;
    content?:string;
    pollutionTypeName:string;
}

@inject('userStore')
@observer
export default class InspectReportSuccessSuccess extends Component<InspectReportSuccessProps, InspectReportSuccessState> {

  config: Config = {
    navigationBarTitleText: '',
    navigationBarBackgroundColor: '#107EFF',
    navigationBarTextStyle: 'white',
    backgroundColor: '#107EFF',
  }

  constructor(props) {
    super(props)
  }

  async componentDidMount () { 
    let { type,inspectId,firstPictureUrl,content,pollutionTypeName } = this.$router.params;
    let barTitle = type == InspectInfoType.INCIDENT ? '事件上报' : '例行巡查';

    Taro.setNavigationBarTitle({ title: `${barTitle}` });

    firstPictureUrl = decodeURIComponent(firstPictureUrl);

    if(firstPictureUrl && firstPictureUrl.length>0){
      const generateUrlInput:GenerateUrlInputData = {
        ossKeys: [firstPictureUrl],
        timeoutDays: 30,
        styleRuleName:'',
      };
      const urlResp = await generateUrl(generateUrlInput);
      firstPictureUrl = urlResp.data[firstPictureUrl];
    }

    this.setState({
        inspectId: inspectId && parseInt(inspectId) || undefined,
        type: type == InspectInfoType.INCIDENT ? InspectInfoType.INCIDENT: InspectInfoType.PATROL,
        firstPictureUrl,
        content: decodeURIComponent(content),
        pollutionTypeName: pollutionTypeName,
    });
  }



  onShareAppMessage() {
    const {inspectId,firstPictureUrl,content,type,pollutionTypeName} = this.state;

    if(inspectId){
      try { 
        share(inspectId);  
      } catch (error) { 
      }
  
      let imageUrl = firstPictureUrl || `${rootSourceBaseUrl}/share.png`;
      let title = content || inspectTypeText(type);

      if(pollutionTypeName){
        title = `【${pollutionTypeName}】`+title;
      }

      return {
        title,
        path: `/pages/works/detail?inspectId=${inspectId}&share=true`,
        imageUrl,
      }
    }

    return {
      title: '巡查事件',
      path: `/pages/works/detail?inspectId=0&share=true`,
      imageUrl: `${rootSourceBaseUrl}/share.png`,
    }
   
  }

  back(){
    Taro.navigateBack({});
  }


  render () {

    return (
        <View className='content'>
            <View className='middleView'>
                <View className='imageView'>
                    <Image className='successIcon' src={`${rootSourceBaseUrl}/assets/works/success.png`} />
                </View>
                <View className='textView'>
                    <Text className='text'>提交成功</Text>
                </View>

                <Button plain={true} className='shareButton' open-type="share">
                    <Text className='text'>分享到微信群</Text>
                </Button>

                <View className='backButtonView' onClick={this.back.bind(this)} >
                    <Text className='text'>返回</Text>
                </View>
            </View>
        </View>
    )
  }
}
