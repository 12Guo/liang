import Taro, { Component, Config } from '@tarojs/taro'
import { View } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import MyWork from './components/MyWork'
import { listAssignToMe } from '../../service/home'
import './work.scss'
import moment from 'moment';
import get from 'lodash/get';

interface WorkProps {
  userStore: any;
}

interface WorkState {
  list: any[];
}

@inject('userStore')
@observer
export default class Work extends Component<WorkProps, WorkState> {

  config: Config = {
    navigationBarTitleText: '今日工作'
  }

  constructor(props) {
    super(props)
    this.state = {
      list: []
    }
  }

  componentWillMount() {

  }

  componentDidMount() {
    try {
      const startTime = moment().startOf('day').valueOf()
      const endTime = moment().endOf('day').valueOf()
      const params = { startTime, endTime, isInspector: false }
      listAssignToMe(params).then((res) => {
        this.setState({
          list: get(res, 'data', [])
        })
      })
    }
    catch (err) { }
  }

  componentWillUnmount() { }

  componentDidShow() { }

  componentDidHide() { }

  render() {
    const { list } = this.state
    return (
      <View className='work-page'>
        {
          list.map((item) => <MyWork key={item.id} data={item} />)
        }
      </View>
    )
  }
}
