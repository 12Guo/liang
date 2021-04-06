import Taro, { Component } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import './index.scss'
import { rootConstructionSourceBaseUrl } from '@common/utils/requests';

// 调度响应
const dispatchImg = rootConstructionSourceBaseUrl + "/assets/pages/green-construction/dispatch.png";

interface IndexProps {
    dispatchInfo?: any
}

interface IndexState {
}

export default class Index extends Component<IndexProps, IndexState> {
  constructor(props) {
    super(props)
  }

  jumpToDispatchDetail(){
    Taro.navigateTo({
      url: "/pages/dispatch/dispatch_detail"
    });
  }

  render() {
    return (       
        <View className="dispatch-info" onClick={this.jumpToDispatchDetail}>
            <View className="dispatch-icon">
                <Image className="dispatch-img" src={dispatchImg}/>
            </View>
            <View className="dispatch-message">
                <View className="dispatch-head">
                    <Text className="dispatch-title">马局长发起调度</Text>
                    <Text className="dispatch-time">07/27 16:53</Text>
                </View>
                <View className="dispatch-content">
                    根据热区实时变化，发现目前热区与今天调度报告中的预测热区相比较变动较大，请相关部门及…
                </View>
            </View>
        </View>
    )
  }
}
