import Taro, { Component, Config, } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { AtAvatar } from 'taro-ui'
import { observer, inject } from '@tarojs/mobx';
import {User} from '@common/service/user'
import RadioButton from '@common/components/radioButton'

import './selectPerson.scss'

interface SelectPersonProps {
  userStore: any;
}

interface SelectPersonState {
  userList: User[],
  checkedUserIds : number[]
}


@inject('userStore')
@observer
export default class Index extends Component<SelectPersonProps, SelectPersonState> {

  config: Config = {
    navigationBarTitleText: '选择成员',
    navigationBarBackgroundColor: '#107EFF',
    navigationBarTextStyle: 'white',
    backgroundColor: '#107EFF',
  }

  constructor(props) {
    super(props)
    this.state = {
      userList : [],
      checkedUserIds: []
    }
  }

  componentWillMount () { 
  }

  componentDidMount () { 
  }

  batchOperate(){
    Taro.navigateTo({
      url: './selectPerson'
    })
  }

  choose(){}

  changeDepartment(){
    Taro.navigateTo({
      url: './selectDepartment'
    })
  }

  changeDivision(){
    Taro.navigateTo({
      url: './selectDivision'
    })
  }

  addRole(){
    Taro.navigateTo({
      url: '../personalInfo/roleEdit'
    })
  }

  delete(){
    
  }


  render () {
    return (
      <View className='content'>

          <View className='operateView'>
            <RadioButton class-name="radio" checked={false}/>
            <Text className='text'>全选</Text>
          </View>

          <ScrollView
                className='personListView'
                scrollY
                scrollWithAnimation>
                  <View className='personView' onClick={this.choose.bind(this)}>
                    <RadioButton class-name="radio" checked={false}/>
                    <AtAvatar className='avatar' circle image='http://file.qqtouxiang.com/meinv/2019-08-16/5852e356c831c5dae57b0ba54a6805fe.jpg'/>
                    <Text className='name'>宋城德</Text>
                  </View> 
                  <View className='personView' onClick={this.choose.bind(this)}>
                    <RadioButton class-name="radio" checked={false}/>
                    <AtAvatar className='avatar' circle image='http://file.qqtouxiang.com/meinv/2019-08-16/5852e356c831c5dae57b0ba54a6805fe.jpg'/>
                    <Text className='name'>赵本山</Text>
                  </View>
                  <View className='personView' onClick={this.choose.bind(this)}>
                    <RadioButton class-name="radio" checked={false}/>
                    <AtAvatar className='avatar' circle image='http://file.qqtouxiang.com/meinv/2019-08-16/5852e356c831c5dae57b0ba54a6805fe.jpg'/>
                    <Text className='name'>留的发</Text>
                  </View>  
          </ScrollView>        

          <View className='buttonView'>
              <View className='blueButton' onClick={this.changeDepartment.bind(this)}>移动部门</View>
              <View className='blueButton' onClick={this.changeDivision.bind(this)}>移动区域</View>
              <View className='blueButton' onClick={this.addRole.bind(this)}>添加色色</View>
              <View className='redButton' onClick={this.delete.bind(this)}>删除</View>
          </View>
      </View>
    )
  }
}
