import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, Image, ScrollView, Block } from '@tarojs/components'
import { AtInput } from 'taro-ui'
import {navBackWithData} from '@common/utils/common'
import { rootSourceBaseUrl } from '@common/utils/requests'
import {Label,LabelGroup,LabelType,labelGroupList,historyLabelList} from '../../service/label'
import {current as currentSpecialActivity,SpecialActivity} from '../../service/spectionAction'

import './labelChoose.scss'


interface LabelChooseProps {
}

interface LabelChooseState {
  /**
   * 用户使用的历史标签
   */
  historyLabels: Label[],

  /**
   * 标签分组列表
   */
  labelGroups: LabelGroup[],

  /**
   * 专项行动标签
   */
  specialActivityLables: Label[],
  /**
   * 选中的标签
   */
  choosedLables: Label[],
}

export default class LabelChoose extends Component<LabelChooseProps, LabelChooseState> {

  config: Config = {
    navigationBarTitleText: '标签选择',
    navigationBarBackgroundColor: '#107EFF',
    navigationBarTextStyle: 'white',
    backgroundColor: '#107EFF',
  }

  constructor(props) {
    super(props)
    this.state = {
      historyLabels: [],
      labelGroups: [],
      choosedLables: [],
      specialActivityLables: [],
    }
  }

  async componentWillMount () { 
    try {
      const labelGroupsResp = await labelGroupList();
      const labelGroups = labelGroupsResp.data;
      
      const historyLabelsResp = await historyLabelList();
      const historyLabels = historyLabelsResp.data;

      //自动获取专项行动标签
      const currentSpecialActivityResp = await currentSpecialActivity();    
      const specialActivityList:SpecialActivity[] = currentSpecialActivityResp.data;

      let specialActivityLables:Label[] = [];
      if(specialActivityList && specialActivityList.length>0){
        for(let i=0;i<specialActivityList.length;i++){
          specialActivityLables.push({
            id:specialActivityList[i].id,
            name: specialActivityList[i].name,
            type: LabelType.SPECIAL_ACTIVITY,
          });
        }
      }

      this.setState({
        historyLabels: historyLabels,
        labelGroups: labelGroups,
        specialActivityLables: specialActivityLables,
      });
    } catch (error) {
    }
   
  }

  componentDidMount () { 
  }

  handleSearchChange(text:string){
    console.log(text);
  }

  labelChoose(label:Label){
    const {choosedLables} = this.state;

    if(this.isChoosed(label)){
      let tempLabels:Label[] = [];
      
      for(let i=0; i<choosedLables.length;i++){
        if(choosedLables[i].type == label.type
          && choosedLables[i].id == label.id){
            continue;
        }
        tempLabels.push(choosedLables[i]);
      }

      this.setState({
        choosedLables: tempLabels
      });
    }else{
      choosedLables.push(label);
      this.setState({
        choosedLables: choosedLables
      });
    }
  }

  /**
   * 判断标签是否已选
   * @param label 
   */
  isChoosed(label:Label){
    const {choosedLables} = this.state;

    let exists = false;
    for(let i=0;i<choosedLables.length;i++){
      if(choosedLables[i].type == label.type
         && choosedLables[i].id == label.id){
        exists = true;
        break;
      }
    }
    return exists;
  }

  /**
   * 渲染标签列表
   * @param title 标题
   * @param labels 标签列表
   */
  renderLabels(title:string,labels:Label[]) {
    if(labels && labels.length>0){
      return (
        <View className='labelView'>
            <View className='title'>{title}</View>
            <View className='labelContainer'>
            {
              labels.map((label) => {
                  return (
                    <Text key={label.id} className={this.isChoosed(label)? 'label selected':'label'} onClick={this.labelChoose.bind(this,label)}>{label.name}</Text>
                  )
              })
            }
            </View>
        </View>
      );
    }
  }

  cancelButton(){
    Taro.navigateBack();
  }

  okButton(){
    const {choosedLables} = this.state;
    navBackWithData({
      choosedLables: choosedLables,
    });     
  }

  render () {
    const {historyLabels,labelGroups,specialActivityLables} = this.state;

    const showLabelGroups = labelGroups && labelGroups.length > 0 ?
            labelGroups.map((labelGroup) => {
                return (<Block key={Math.random()*100}>
                            {this.renderLabels(labelGroup.name,labelGroup.labels)}
                        </Block>)
            }) : '';

    return (
        <View className='content'>
            <View className='searchView'>
                <Image className='searchButton' src={`${rootSourceBaseUrl}/assets/common/search.png`}/>
                <AtInput className='personInput' 
                        name='name' 
                        type='text'
                        cursor='0'
                        // autoFocus={true}
                        // focus={true}
                        border={false}
                        placeholder='搜索标签'
                        value={''}
                        onChange={this.handleSearchChange.bind(this)}
                    />
            </View>

            <ScrollView
                className='lableListView'
                scrollY
                scrollWithAnimation
                >
              {
                this.renderLabels('历史标签',historyLabels)
              }
              {showLabelGroups}
              {
                this.renderLabels('专项行动',specialActivityLables)
              }
            </ScrollView>  

            <View className='buttonView'>
                <Text className='leftButton' onClick={this.cancelButton.bind(this)}>取消</Text>
                <Text className='rightButton' onClick={this.okButton.bind(this)}>确认</Text>
            </View>
        </View>
    )
  }
}
