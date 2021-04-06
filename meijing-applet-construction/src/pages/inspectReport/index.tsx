import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx'
import { rootSourceBaseUrl } from '@common/utils/requests'
import {InspectInfoType} from '../../service/inspect' 
import './index.scss'

interface InspectReportProps {
  userStore: any;
}

interface InspectReportState {

}

@inject('userStore')
@observer
export default class InspectReport extends Component<InspectReportProps, InspectReportState> {

  config: Config = {
    navigationBarTitleText: '上报',
    navigationBarBackgroundColor: '#107EFF',
    navigationBarTextStyle: 'white',
    backgroundColor: '#107EFF',
  }

  constructor(props) {
    super(props)
    this.state = {
      userInfo : {}
    }
  }

  componentWillMount () { 
  }

  componentDidMount () { 
  }

  lxxcButton(){
    Taro.navigateTo({
        url: `./report?type=${InspectInfoType.PATROL}`
    })
  }

  sjsbButton(){
    Taro.navigateTo({
        url: `./report?type=${InspectInfoType.INCIDENT}`
    })
  }

  zxxdButton(){
    Taro.navigateTo({
        url: '/pages/special-action/edit'
    })
  }

  render () {

    return (
        <View className='content'>
            <View className='reportTypeListView'>
                <View className='reportTypeView' onClick={this.lxxcButton.bind(this)} >
                    <Image className='icon' src={`${rootSourceBaseUrl}/assets/inspect_report/report_lxxc.png`}/>
                    <Text className='text'>例行巡查</Text>
                </View>
                <View className='reportTypeView' onClick={this.sjsbButton.bind(this)} >
                    <Image className='icon' src={`${rootSourceBaseUrl}/assets/inspect_report/report_sjsb.png`}/>
                    <Text className='text'>事件上报</Text>
                </View>
                <View className='reportTypeView' onClick={this.zxxdButton.bind(this)}>
                    <Image className='icon' src={`${rootSourceBaseUrl}/assets/inspect_report/report_zxxd.png`}/>
                    <Text className='text'>专项行动</Text>
                </View>
            </View>
        </View>
    )
  }
}
