import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { AtList, AtListItem  } from 'taro-ui'
import { observer, inject } from '@tarojs/mobx';
import {Department,listDepartmentByDivision} from '../../service/department' 
import {getPageData} from '@common/utils/common';
import EmptyHolder from '@common/components/EmptyHolder'

import './index.scss'


interface DepartmentManageProps {
  userStore: any;
}

interface DepartmentManageState {
  departemtList: Department[];
}

@inject('userStore')
@observer
export default class DepartmentManage extends Component<DepartmentManageProps, DepartmentManageState> {

  config: Config = {
    navigationBarTitleText: '部门管理',
    navigationBarBackgroundColor: '#107EFF',
    navigationBarTextStyle: 'white',
    backgroundColor: '#107EFF',
  }

  constructor(props) {
    super(props)
    this.state = {
      departemtList: [],
    }
  }

  async componentWillMount() {
    const { userStore: {userDetails}} = this.props;
    try {
      const resDepartment = await listDepartmentByDivision(userDetails.divisionCode);
      this.setState({ departemtList: resDepartment.data});
    } catch (error) {
    }
  }

  componentDidMount () { 
  }

  componentDidShow(){
    
    const {department_edit,operType} = getPageData();
    
    if(department_edit && operType){

      const {departemtList} = this.state;
      
      if(operType == 'add'){
        departemtList.push(department_edit);
      }else{
        //更新部门列表
        for(let i=0;i<departemtList.length;i++){
          if(department_edit.id == departemtList[i].id){
            departemtList[i] = department_edit;
            break;
          }
        }
      }
      
      this.setState({
        departemtList: departemtList,
      });
    }

  }


  edit(department?:Department){
    Taro.navigateTo({
      url: department ? `./edit?type=edit&id=${department.id||0}&name=${department.name||'' }`
       : `./edit?type=add`,
    })
  }

  render () {
    const {departemtList} = this.state;

    const showEmpty = (<View className='empty'><EmptyHolder text='暂无数据' /></View>)
    const isEmpty = !departemtList || departemtList.length == 0;

    return (
      <View className='content'>
          <View className='top_back'></View>

          <ScrollView
              className='department_list'
              scrollY
              scrollWithAnimation
          >
            {
              isEmpty ? showEmpty:
              <AtList>
                {
                  departemtList.map((department) => {
                      return (
                        <AtListItem key={department.id}  title={department.name} arrow='right' onClick={this.edit.bind(this,department)}></AtListItem>
                      )
                  })
                }
               </AtList>
            }
          </ScrollView>

          <View className='addButtonView' onClick={this.edit.bind(this,null)}>
              <Text className='plusText'>+</Text>
              <Text className='text'>新增部门</Text>
          </View>
      </View>
    )
  }
}
