import Taro, { Component, Config, } from '@tarojs/taro'
import { View, Button } from '@tarojs/components'
import { AtInput } from 'taro-ui'
import { observer, inject } from '@tarojs/mobx';
import { add, update, rootDivisionCode } from '../../service/department'
import { navBackWithData } from '@common/utils/common'

import './edit.scss'


export enum OperType {
  ADD = 'add',
  EDIT = 'edit'
};

interface DepartmentEditProps {
  userStore: any;
}

interface DepartmentEditState {
  id?: number | string;
  name?: string;
  type: OperType | string;
  parentCode: string;
}

@inject('userStore')
@observer
export default class DepartmentEdit extends Component<DepartmentEditProps, DepartmentEditState> {

  config: Config = {
    navigationBarTitleText: '',
    navigationBarBackgroundColor: '#107EFF',
    navigationBarTextStyle: 'white',
    backgroundColor: '#107EFF',
  }

  constructor(props) {
    super(props)
    this.state = {
      type: OperType.ADD,
      parentCode: rootDivisionCode
    }
  }

  async componentWillMount() {
    let { id, name, type, parentCode } = this.$router.params;
    let subTitle = type == OperType.ADD ? '新增' : '修改';

    Taro.setNavigationBarTitle({ title: `${subTitle}部门` });

    this.setState({
      id: id || 0,
      type: type,
      name: name || '',
      parentCode
    });
  }

  componentDidMount() {

  }

  handleNameChange(name: string) {
    this.setState({
      name: name && name.trim() || '',
    });
  }

  async edit() {
    const { id, name, type, parentCode } = this.state;
    const { userStore: { userDetails } } = this.props;

    if (!name || name.length == 0) {
      return;
    }
    else if (name.replace(/[\u4e00-\u9fa5]/g, 'xx').length > 20) {
      Taro.showToast({
        title: '你输入的部门名称过长',
        icon: 'none',
        duration: 2000
      })
      return;
    }

    try {
      let department;
      if (OperType.ADD == type) {
        department = await add({
          name: name,
          divisionCode: userDetails.divisionCode || '',
          divisionName: userDetails.divisionName || '',
          parentCode
        });
      } else {
        if (!id) {
          return;
        }
        department = await update(id, name);
      }

      navBackWithData({
        department_edit: department.data,
        operType: type,
      });
    } catch (error) {
    }
  }


  render() {
    const { name } = this.state;

    return (
      <View className='content'>
        <View className='top_back'></View>

        <View className='nameView'>
          <AtInput className='name_input'
            name='name'
            type='text'
            maxLength='10'
            border={false}
            placeholder='请输入部门名称'
            value={name || ''}
            clear
            // autoFocus={false}
            onChange={this.handleNameChange.bind(this)}
          />
        </View>

        <View className='button_panel'>
          <Button className='eidt_button' onClick={this.edit.bind(this)}>保存</Button>
        </View>
      </View>
    )
  }
}