import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import { rootSourceBaseUrl } from '@common/utils/requests'

import './limitedAccess.scss'

interface LimitedAccessProps {
  userStore: any;
}

interface LimitedAccessState {
    message:string;
}

@inject('userStore')
@observer
export default class LimitedAccessSuccess extends Component<LimitedAccessProps, LimitedAccessState> {

  config: Config = {
    navigationBarTitleText: '访问受限',
    navigationBarBackgroundColor: '#107EFF',
    navigationBarTextStyle: 'white',
    backgroundColor: '#107EFF',
  }

  constructor(props) {
    super(props);
    this.state = {
        message: '您暂时没有访问此区域的权限' 
    }
  }

    componentWillMount() {
        let { message } = this.$router.params;
        if(message && message.length>0){
            this.setState({
                message
            });
        }
    }


  componentDidMount () { 
  }


  back(){
    Taro.redirectTo({
        url: 'common/pages/welcome/index',
    })
  }


  render () {
    const {message} = this.state;
    return (
        <View className='content'>
            <View className='imageAndMessage'>
                <Image className='imageItem' src={`${rootSourceBaseUrl}/assets/common/limited_access.png`}/>
                <Text className='message'>{message}</Text>
            </View>
            <View className='backButton' onClick={this.back.bind(this)}>
                <Text className='text'>返回首页</Text>
            </View>
        </View>
    )
  }
}
