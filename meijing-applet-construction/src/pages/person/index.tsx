import Taro, { Component, Config } from '@tarojs/taro'
import { View } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import { UserStore } from '../../store/user'
import { navBackWithData } from '@common/utils/common'
import FpiChoose from '@common/components/FpiChoose';

interface MyProps {
  userStore: UserStore;
}

interface MyState {
  dataCode: string,
  chooseConfig: any
}

@inject('userStore')
@observer
export default class Index extends Component<MyProps, MyState> {
  config: Config = {
    navigationBarTitleText: '人员选择'
  }

  constructor(props) {
    super(props);
    this.state = {
      dataCode: 'personChoosedData',
      chooseConfig: []
    };
  }

  componentWillMount() {
    const { dataCode, type, radio, only } = this.$router.params;
    let chooseConfig = [];
    if (type) {
      chooseConfig.push({
        type,
        single: radio === 'true',
        only: only === 'true'
      })
    }
    this.setState({
      dataCode,
      chooseConfig
    })
  }

  onOkHandle = (allList: any) => {
    const { dataCode } = this.state;
    navBackWithData({
      [dataCode]: allList
    });
  }

  render() {
    const { userDetails } = this.props.userStore;
    const { chooseConfig } = this.state;
    return (
      <View className='content'>
        <FpiChoose user={userDetails} onOK={this.onOkHandle} config={chooseConfig} />
      </View>
    )
  }
}
