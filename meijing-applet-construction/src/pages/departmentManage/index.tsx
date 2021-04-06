import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import { rootSourceBaseUrl } from '@common/utils/requests'
import { Department, hierarchyList, rootDivisionCode, getNodeById, deleteByDivision } from '../../service/department'
import { getPageData } from '@common/utils/common';
import EmptyHolder from '@common/components/EmptyHolder'
import FpiConfirm from '@common/components/FpiConfirm';
import isEmpty from 'lodash/isEmpty'
import cn from 'classnames'

import './index.scss'
import get from 'lodash/get';

//图标引用
const addImageUrl = rootSourceBaseUrl + "/assets/common/add_image.png"

interface DepartmentManageProps {
  userStore: any;
}

interface DepartmentManageState {
  departemtList: any;
  navbarList: any[];
  selectedDepartment: any;
  showPopup: boolean;
}

// 一级部门显示
const rootDepartment = {
  createTime: 0,
  divisionCode: rootDivisionCode,
  divisionName: "一级部门",
  id: 0,
  modifyTime: 0,
  name: "一级部门"
}

@inject('userStore')
@observer
export default class DepartmentManage extends Component<DepartmentManageProps, DepartmentManageState> {

  config: Config = {
    navigationBarTitleText: '部门管理',
    navigationBarBackgroundColor: '#FFFFFF',
    navigationBarTextStyle: 'black',
    backgroundColor: '#FFFFFF',
  }

  constructor(props) {
    super(props)
    this.state = {
      departemtList: {
        ...rootDepartment,
        children: []
      },
      navbarList: [],
      selectedDepartment: {},
      showPopup: false,
    }
  }

  async componentWillMount() {
    const { userStore: { userDetails } } = this.props;
    const { departemtList } = this.state
    try {
      const resDepartment = await hierarchyList(userDetails.divisionCode);
      departemtList.children = resDepartment.data
      this.setState({ departemtList });
    } catch (error) {
    }
  }

  componentDidShow() {
    const { department_edit, operType } = getPageData();
    if (department_edit && operType) {
      const { departemtList, navbarList } = this.state;
      if (operType == 'add') {
        department_edit.children = []
        if (isEmpty(navbarList)) {
          departemtList.children.push(department_edit);
        }
        else {
          const currentNode = getNodeById(navbarList[navbarList.length - 1].id, departemtList)
          // @ts-ignore
          currentNode.children.push(department_edit)
        }
      } else {
        //更新部门列表
        const currentNode = getNodeById(department_edit.id, departemtList)
        // @ts-ignore
        currentNode.name = department_edit.name
      }
      this.setState({
        departemtList: departemtList,
      });
    }
  }


  // tab切换
  onTab = (index: number) => {
    let { navbarList } = this.state;
    if (index === 0) {
      navbarList = []
    }
    else if (index !== navbarList.length - 1) {
      navbarList.splice(index + 1);
    }
    this.setState({ navbarList })
  }

  // 下级选择
  nextChild = (department) => {
    const { navbarList } = this.state
    if (isEmpty(navbarList)) {
      navbarList.push(rootDepartment)
    }
    navbarList.push(department)
    this.setState({ navbarList })
  }

  // 关闭选中菜单
  onCloseMask = () => {
    this.setState({ selectedDepartment: {} })
  }

  // 新增部门
  addDepartment = () => {
    const { navbarList } = this.state
    if (navbarList.length >= 5) {
      Taro.showToast({
        title: '最多只能创建5级部门',
        icon: 'none',
        duration: 2000
      })
      return;
    }
    Taro.navigateTo({
      url: `./edit?type=add&parentCode=${get(navbarList, `[${navbarList.length - 1}].code`, rootDivisionCode)}`
    })
  }

  // 编辑部门
  editDepartment = department => {
    Taro.navigateTo({
      url: `./edit?type=edit&id=${department.id || 0}&name=${department.name || ''}`
    })
    this.setState({ selectedDepartment: {} })
  }

  // 删除部门
  delDepartment = () => {
    this.setState({
      showPopup: true
    })
  }

  // 长按选中的item
  onLong = department => {
    this.setState({
      selectedDepartment: department
    })
  }

  onCancel = () => {
    this.setState({
      showPopup: false,
      selectedDepartment: {}
    })
  }

  onConfirm = async () => {
    const { selectedDepartment, departemtList } = this.state;
    try {
      const res = await deleteByDivision(selectedDepartment.id)
      if (get(res, 'data.success')) {
        const currentParent = selectedDepartment.parentCode === rootDivisionCode ? departemtList : getNodeById(selectedDepartment.parentCode, departemtList)
        // @ts-ignore
        currentParent.children = (currentParent.children || []).filter(node => node.id !== selectedDepartment.id)
        this.setState({ departemtList, showPopup: false, selectedDepartment: {} })
      }
      else {
        Taro.showToast({
          title: '删除失败',
          mask: true,
          icon: 'none',
          duration: 2000
        });
      }
    }
    catch (e) {
      this.setState({ showPopup: false, selectedDepartment: {} })
    }
  }

  render() {
    const { departemtList, navbarList, selectedDepartment, showPopup } = this.state;
    // @ts-ignore
    const currentList = isEmpty(navbarList) ? departemtList.children : getNodeById(navbarList[navbarList.length - 1].id, departemtList).children;
    const showEmpty = (<View className='empty'><EmptyHolder text='暂无数据' /></View>)
    const isEmptyData = !currentList || currentList.length == 0;

    return (
      <View className='content'>
        {!isEmpty(navbarList) && (
          <ScrollView className='scrollView' scrollWithAnimation scrollX>
            <View className='navbar'>
              {
                navbarList.map((navbar, index) => (
                  <View
                    onClick={this.onTab.bind(this, index)}
                    key={navbar.id}
                    className={cn('navbar__item', { 'navbar__item--nav': index < navbarList.length - 1 })}
                  >{navbar.name}</View>
                ))
              }
            </View>
          </ScrollView>
        )}


        <ScrollView
          className={cn('department_list', { 'department_list-nonav': isEmpty(navbarList) })}
          scrollY
          scrollWithAnimation
        >
          {
            isEmptyData ? showEmpty :
              <View className='listWrap'>
                {
                  currentList.map((department, index) => {
                    return (
                      <View key={department.id} className={cn('list-item', { 'list-item__gray': selectedDepartment.id === department.id })}>
                        <View className='list-row' onClick={this.nextChild.bind(this, department)} onLongPress={this.onLong.bind(this, department)}>
                          <Text className='list-row_txt'>{department.name}</Text>
                          <View className='list-row_icon'></View>
                        </View>
                        <View className={cn('list-float', { 'list-float__show': selectedDepartment.id === department.id, 'list-float__bottom': index > 10 })}>
                          <Text className='txt' onClick={this.editDepartment.bind(this, department)}>编辑</Text>
                          <Text className='txt txt-red' onClick={this.delDepartment}>删除</Text>
                        </View>
                        {selectedDepartment.id === department.id && <View className='list-mask' onClick={this.onCloseMask}></View>}
                      </View>
                    )
                  })
                }
              </View>
          }
        </ScrollView>

        <View className='addButtonView' onClick={this.addDepartment}>
          <Image src={addImageUrl} className="add_image"></Image>
          <Text className='text'>新增部门</Text>
        </View>

        <FpiConfirm
          title='提示'
          content='确定删除该条数据吗？'
          isOpened={showPopup}
          onConfirm={this.onConfirm}
          onCancel={this.onCancel}
        />
      </View>
    )
  }
}
