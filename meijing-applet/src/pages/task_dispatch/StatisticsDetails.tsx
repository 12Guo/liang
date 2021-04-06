import Taro from '@tarojs/taro'
import { View, Text, Image, Button } from '@tarojs/components'
import { AtCountdown } from 'taro-ui'
import moment from 'moment'
import { rootSourceBaseUrl } from '@common/utils/requests'
import { RoutineDispatch } from '../../store/dispatch'
import { DivisionRankGoalInfo, ValueGoalInfo, FactorRankInfo, CalculateDayGoalValueInfo } from '../../service/division';
import { DivisionMonitorData } from '../../model'
import './StatisticsDetails.scss'

const turn_up = rootSourceBaseUrl + "/assets/task_dispatch/turn_up2.png";
const winter_pm25 = rootSourceBaseUrl + "/assets/task_dispatch/winter_pm25.png";
const goal_all = rootSourceBaseUrl + "/assets/task_dispatch/goal_all.png";
const goal_edit = rootSourceBaseUrl + "/assets/task_dispatch/goal_edit.png";
const turn_right = rootSourceBaseUrl + "/assets/task_dispatch/turn_right.png";
const goal_none = rootSourceBaseUrl + "/assets/task_dispatch/goal_none.png";
const turn_down = rootSourceBaseUrl + "/assets/task_dispatch/turn_down_icon2.png";
const event = rootSourceBaseUrl + "/assets/task_dispatch/event.png";
const xuncha = rootSourceBaseUrl + "/assets/task_dispatch/xuncha.png";
const point_warn = rootSourceBaseUrl + "/assets/task_dispatch/point_warn.png";
//数据查询
const shixu = rootSourceBaseUrl + "/assets/discovery/shixu.png";
//站点溯源
const zhandiansuyuan = rootSourceBaseUrl + "/assets/discovery/zhandiansuyuan.png";
//影响分析
const yingxiang = rootSourceBaseUrl + "/assets/discovery/yingxiang.png";
//监测排名
const jiancepaiming = rootSourceBaseUrl + "/assets/discovery/jiancepaiming.png";
//监测预警
const alarmUrl = rootSourceBaseUrl + "/assets/discovery/alarm.png";
//对比分析
const duibifenxi = rootSourceBaseUrl + "/assets/discovery/duibifenxi.png";

const ANALYSIS_MENUS = [
  {
    image: zhandiansuyuan,
    code: 'zhandiansuyuan',
    title: '站点溯源'
  }, {
    image: yingxiang,
    code: 'analyse',
    title: '影响分析'
  }, {
    image: jiancepaiming,
    code: 'rank',
    title: '监测排名'
  },
  {
    image: duibifenxi,
    code: 'site-comparison',
    title: '对比分析'
  }, {
    image: alarmUrl,
    code: 'alarm',
    title: '监测预警'
  }
]

interface Props {
  onAnalysisMenuClick: (menu: { code: string }) => void;
  dispatch: RoutineDispatch;
  style: any;
  divisionCode: string,
  loadSuccess: boolean,
  divisionFree: boolean;
  targetWeekData: number
  dayGoalValueInfo: CalculateDayGoalValueInfo
  rankGoalInfo?: DivisionRankGoalInfo,
  valueGoalInfo?: ValueGoalInfo,
  factorRankInfo?: FactorRankInfo,
  hourMonitorData?: DivisionMonitorData,
  translateUp: (initOffsetHeight: number) => void;
  isTurnDown: boolean;
  inspectStatistics: {
    totalWorks: number;
    watering: number;
    totalEvents: number;
    disposedEvents: number;
  }
  onNeedHideBodyHeightChange: (height: number) => void;

}
export default class StatisticsDetails extends Taro.Component<Props> {

  initOffsetHeight: 0;

  componentDidMount() {
    const { onNeedHideBodyHeightChange, divisionFree } = this.props
    const query = Taro.createSelectorQuery().in(this.$scope);
    if (divisionFree) {
      query.selectAll('.turn_up_icon_view,.recent_goal,.detail,.gap').boundingClientRect((res) => {
        this.initOffsetHeight = res[2].height + res[3].height + 20
        onNeedHideBodyHeightChange(this.initOffsetHeight)
      }).exec()
    } else {
      query.selectAll('.turn_up_icon_view,.recent_goal,.detail,.icon_group,.gap').boundingClientRect((res) => {
        this.initOffsetHeight = res[2].height + res[3].height + 25 + res[4].height
        onNeedHideBodyHeightChange(this.initOffsetHeight)
      }).exec()
    }
  }

  onEditGoal = (value) => {
    if (isNaN(value) || value == -1) {
      return;
    }
    const { divisionCode, dayGoalValueInfo } = this.props;
    let path = `division_goal/current_goal_edit?title=${encodeURIComponent('目标达成分析研判')}&divisionCode=${divisionCode}&divisionGoalId=${dayGoalValueInfo.decomposedGoalId}&pm25Value=${dayGoalValueInfo.goalValue}`;
    Taro.navigateTo({
      url: '/common/pages/webview/index?url=' + encodeURIComponent(path)
    })
  }

  onMore = () => {
    let path = `analyst?title=${encodeURIComponent('统计分析')}`;
    Taro.navigateTo({
      url: '/common/pages/webview/index?url=' + encodeURIComponent(path)
    })
  }

  showDivisionGoalList = () => {
    const { divisionCode, divisionFree } = this.props;
    let path = "";
    if (divisionFree) {
      path = `division_goal/analyse?title=${encodeURIComponent('目标达成分析研判')}&divisionCode=${divisionCode}&divisionFree=${divisionFree}`;
    } else {
      path = `division_goal/analyse?title=${encodeURIComponent('目标达成分析研判')}&divisionCode=${divisionCode}`;
    }
    Taro.navigateTo({
      url: '/common/pages/webview/goal_webview?url=' + encodeURIComponent(path)
    })
  }

  onJumpMore = () => {
    Taro.switchTab({
      url: '/pages/work_circle/index'
    });
  }

  onJumpGoalEdit = () => {
    const { divisionCode, divisionFree } = this.props;
    let path = "";
    if (divisionFree) {
      path = `division_goal/edit?title=${encodeURIComponent('设置年目标')}&divisionCode=${divisionCode}&flag=applet&divisionFree=${divisionFree}`;
    } else {
      path = `division_goal/edit?title=${encodeURIComponent('设置年目标')}&divisionCode=${divisionCode}&flag=applet`;
    }
    Taro.navigateTo({
      url: '/common/pages/webview/index?url=' + encodeURIComponent(path)
    })
  }

  render() {
    const { style, translateUp, isTurnDown, inspectStatistics, divisionFree, loadSuccess, rankGoalInfo, valueGoalInfo, factorRankInfo, dayGoalValueInfo } = this.props
    let hasGoalConfig = rankGoalInfo || valueGoalInfo;
    let goalType = valueGoalInfo ? valueGoalInfo.type : rankGoalInfo ? rankGoalInfo.type : "";
    let goalName = valueGoalInfo ? valueGoalInfo.name : rankGoalInfo ? rankGoalInfo.name : "";
    let unit = valueGoalInfo ? valueGoalInfo.unit : rankGoalInfo ? rankGoalInfo.unit : "";
    let actualValue = valueGoalInfo ? valueGoalInfo.actualValue : rankGoalInfo ? rankGoalInfo.actualValue : 0;
    let goalValue = valueGoalInfo ? valueGoalInfo.goalValue : rankGoalInfo ? rankGoalInfo.goalValue : 0;
    let endTime = valueGoalInfo ? valueGoalInfo.endTime : rankGoalInfo ? rankGoalInfo.endTime : 0;
    const intervalSeconds = moment(moment().endOf('day')).diff(moment(), "second")
    let isReach = valueGoalInfo ? valueGoalInfo.goalValue > valueGoalInfo.actualValue : rankGoalInfo ? rankGoalInfo.goalValue > rankGoalInfo.actualValue : "";
    let gapDay = moment(endTime).diff(moment(), 'day');
    let gapValue = actualValue - goalValue;
    let dayGoalReach = !dayGoalValueInfo || dayGoalValueInfo.goalValue == -1 ? true : dayGoalValueInfo.actualValue < dayGoalValueInfo.goalValue;

    return (
      <View className="turn_up_view" id="turn_up_view" style={style} onTouchMove={(e) => e.stopPropagation()} >
        <View className="head">
          <View className="turn_up_icon_view" onClick={() => translateUp(this.initOffsetHeight)}>
            {isTurnDown ? <Image className="image" src={turn_up}></Image>
              : <Image className="image" src={turn_down}></Image>}
          </View>
          {hasGoalConfig ?
            <View className="recent_goal">
              <View className="turn_down_show recent_goal_exists">
                <View className="title">
                  <Image className="goal_type_icon" src={winter_pm25}></Image>
                  <Text className="goal_name">{goalName}</Text>
                </View>
                {isTurnDown && <View className="value">
                  <Text className="value_simple">{valueGoalInfo ? "累计" : "当前"}</Text>
                  <View className="value_current">
                    <Text className="actualValue">{actualValue < 0 ? "--" : actualValue}</Text>
                  </View>
                  <Text className="value_goal">目标 {goalValue}</Text>
                </View>}
                <View className="all" onClick={this.showDivisionGoalList}>
                  <Text className="value_simple">查看全部</Text>
                  <Image src={goal_all} className="goal_type_icon"></Image>
                </View>
              </View>
              {!isTurnDown && goalType == "VALUE_GOAL" && <View className="turn_up_show">
                <View className="actual_value">
                  <Text className="value">{actualValue < 0 ? "--" : actualValue}</Text>
                  <Text className="unit">{unit}</Text>
                  {!isReach && <View className="reach">未达标</View>}
                </View>
                <View className="goal_value">
                  <Text className="goal">目标 {goalValue} {unit}</Text>
                  <Text className="control">剩余{actualValue < 0 ? "--" : gapDay}天控制浓度 {actualValue < 0 ? "--" : (valueGoalInfo && valueGoalInfo.surplusControlValue < 0 ? "--" : valueGoalInfo && valueGoalInfo.surplusControlValue)} {unit}</Text>
                </View>
              </View>}
              {!isTurnDown && goalType == "RANK_GOAL" && <View className="turn_up_show">
                <View className="actual_value">
                  <Text className="value">{actualValue < 0 ? "--" : actualValue}</Text>
                  <Text className="unit">{unit}</Text>
                  {!isReach && <View className="reach">未达标</View>}
                </View>
                <View className="goal_value">
                  <Text className="goal">目标 {goalValue} {unit}</Text>
                  <Text className="control">{gapValue < 0 ? "当前达成" : `目标差距${gapValue}${unit}`}</Text>
                </View>
              </View>}
            </View> :
            <View className="recent_goal">
              {!loadSuccess ?
                <View className="turn_down_show recent_goal_none">
                  <Button className='btn' plain disabled loading={true} type='primary'>目标正在加载中...</Button>
                </View> : <View className="turn_down_show recent_goal_none">
                  <View className="title">
                    <Image className="goal_type_icon" src={goal_none}></Image>
                    <Text className="goal_name">暂无目标</Text>
                  </View>
                  <View className="all" onClick={this.onJumpGoalEdit}>
                    <Text className="value_simple">立即配置</Text>
                    <Image src={goal_all} className="goal_type_icon"></Image>
                  </View>
                </View>}

            </View>}
          <View className="detail">
            {dayGoalValueInfo && !isTurnDown && <View className="pm25_goal">
              <View className='today'>
                <View className="totay_value">今日数据情况</View>
                <AtCountdown
                  className="count_down"
                  seconds={intervalSeconds}
                />
              </View>
              <View className="detail_data">
                <View className="goalValueInfo value_info_background">
                  <View className="title">PM2.5累计值</View>
                  <View className="value">
                    {dayGoalReach && <Text className="actual_value_reach">{dayGoalValueInfo.actualValue != -1 ? dayGoalValueInfo.actualValue : "--"}</Text>}
                    {!dayGoalReach && <Text className="actual_value">{dayGoalValueInfo.actualValue != -1 ? dayGoalValueInfo.actualValue : "--"}</Text>}
                    <Text className="simple_tip">({dayGoalValueInfo.unit})</Text>
                  </View>
                </View>
                <View className="goalRankInfo value_info_background">
                  <View className="title">本日实时排名</View>
                  <View className="value">
                    <Text className="current_rank">{factorRankInfo ? factorRankInfo.currentRank : '--'}</Text>
                    <Text className="simple_tip">/{factorRankInfo ? factorRankInfo.totalRank : '--'}</Text>
                  </View>
                </View>
              </View>
              {dayGoalValueInfo && dayGoalValueInfo.goalValue != -1 && <View className="control_content">
                <View className="goal_value">
                  <Text>目标浓度 {dayGoalValueInfo.goalValue}</Text>
                  <Image className="goal_edit_icon" src={goal_edit} onClick={this.onEditGoal.bind(this, dayGoalValueInfo.goalValue)}></Image>
                </View>
                <View className="control_value">
                  达成概率  {dayGoalValueInfo.probability != -1 ? (dayGoalValueInfo.probability * 100).toFixed(2) : '--'}%<Text className='split_hr'>|</Text>
                  {dayGoalValueInfo.surplusControlValue < 0 ? `无法达成` : '剩余控制' + (dayGoalValueInfo.surplusControlValue != -1 ? dayGoalValueInfo.surplusControlValue : "--")}
                </View>
              </View>}
            </View>}
            {/* <View className="event">
            <View className="title">
              <Image className="image" src={point_warn}></Image>
              <Text className="tip">站点报警</Text>
            </View>
            <View className="value">
              <Text className="tip">累计</Text>
              <Text className="num">66</Text>
            </View>
            <View className="value_right">
              <View>
              <Text className="tip">处理</Text>
              <Text className="num">22</Text>
              </View>
              <Image className="jump_more" src={turn_right}></Image>
            </View>
          </View> */}
            <View className="event">
              <View className="title">
                <Image className="image" src={event}></Image>
                <Text className="tip">事件数</Text>
              </View>
              <View className="value">
                <Text className="tip">上报</Text>
                <Text className="num">{inspectStatistics.totalEvents == 0 ? "--" : inspectStatistics.totalEvents}</Text>
              </View>
              <View className="value_right">
                <View>
                  <Text className="tip">处理</Text>
                  <Text className="num">{inspectStatistics.disposedEvents == 0 ? "--" : inspectStatistics.disposedEvents}</Text>
                </View>
                <Image className="jump_more" src={turn_right} onClick={this.onJumpMore}></Image>
              </View>
            </View>
            <View className="event">
              <View className="title">
                <Image className="image" src={xuncha}></Image>
                <Text className="tip">巡查数</Text>
              </View>
              <View className="value">
                <Text className="tip">累计</Text>
                <Text className="num">{inspectStatistics.totalWorks == 0 ? "--" : inspectStatistics.totalWorks}</Text>
              </View>
              <View className="value_right">
                <View>
                  <Text className="tip">洒水</Text>
                  <Text className="num">{inspectStatistics.watering == 0 ? "--" : inspectStatistics.watering}</Text>
                </View>
                <Image className="jump_more" src={turn_right} onClick={this.onJumpMore}></Image>
              </View>
            </View>
          </View>
        </View>
        <View className="gap"></View>
        <View className="foot">
          <View className="icon_group" style={{ display: `${divisionFree ? "none" : ""}` }}>
            {
              ANALYSIS_MENUS.map(menu => (
                <View key={menu.code} className="item" onClick={() => { this.props.onAnalysisMenuClick(menu) }}>
                  <Image className="image" src={menu.image}></Image>
                  <Text className="title">{menu.title}</Text>
                </View>
              ))
            }
          </View>
        </View>
      </View >
    )
  }
}
