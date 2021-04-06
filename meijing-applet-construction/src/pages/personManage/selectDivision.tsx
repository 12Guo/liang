import Taro, { Component, Config } from '@tarojs/taro'
import { View, Button } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import DivisionChoose from '@common/components/divisionChoose';
import {getChildren,getParentDivisions} from '../../service/division'
import {navBackWithData} from '@common/utils/common'
import { Division } from '@common/utils/divisionUtils'


import './selectDivision.scss'

interface PersonalInfoProps {
  userStore: any;
}

interface PersonalInfoState {
    /**
     * 已选择的行政区列表（按省、市、区、乡镇顺序存入）
     */
    selectDivisions: Division[];
     /**
     * 加载中
     */
    isLoading: boolean;
}

@inject('userStore')
@observer
export default class Index extends Component<PersonalInfoProps, PersonalInfoState> {

  config: Config = {
    navigationBarTitleText: '选择转移到的区域',
    navigationBarBackgroundColor: '#107EFF',
    navigationBarTextStyle: 'white',
    backgroundColor: '#107EFF',
  }

  constructor(props) {
    super(props)
    this.state = {
      selectDivisions: [],
      isLoading: true,
    }
  }

  async componentWillMount() {
    let {divisionCode} = this.$router.params;

    if(divisionCode){
      try {
        let selectDivisionsResp = await getParentDivisions(divisionCode);
        this.setState({ selectDivisions: selectDivisionsResp.data, isLoading:false });
      } catch (error) {
      }
    }
  }


  componentDidMount () { 
  }

  divisionChange(choosedDivisions: Division[]) {
      if (choosedDivisions && choosedDivisions.length > 0) {
          this.setState({
              selectDivisions: choosedDivisions
          });
      }
  }

  ok(){
      const { selectDivisions } = this.state;
      const division = selectDivisions[selectDivisions.length-1];

      navBackWithData({
          division_choose: division
      });
  }


  render () {
    const { selectDivisions, isLoading } = this.state;

    if (isLoading) {
        return <View className='content'></View>
    }

    return (
      <View className='content'>
        <View className='top_back'></View>

        <DivisionChoose class-name='divisionChoose' selectDivisions={selectDivisions} getChildren={getChildren.bind(this)} onChoose={this.divisionChange.bind(this)} />

        <View className='button_panel'>
            <Button className='edit_button' onClick={this.ok.bind(this)}>确定</Button>
        </View>  
      </View>
    )
  }
}
