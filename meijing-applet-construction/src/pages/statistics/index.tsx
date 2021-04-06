import Taro, { Component, Config } from '@tarojs/taro'
import { View, ScrollView, Text } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import FilterTabs, { FilterTabsType } from '@common/components/FilterTabs'
import SpecialTreat from './components/SpecialTreat'
import QuestionType from './components/QuestionType'
import DateCycle from './components/DateCycle'
import { treatmentMeasure, labelIncident, siteProblem, department } from '../../service/statistics'
import { constructionSiteSentryCount } from '../../service/home'
import get from 'lodash/get'
import './index.scss'
import ProblemList from '@common/components/List/constructionProblem'
import EmptyHolder from '@common/components/EmptyHolder'
import Table from '@common/components/Table/index'
import isEmpty from 'lodash/isEmpty'
import moment from 'moment';

interface StatisticsProps {
  userStore: any;
}

interface StatisticsState {
  tabId: number;
  questionTypeData: any;
  specialTreatData: any;
  siteProblemData: any;
  departmentData: any;
  time: any;
  parseDepartData: any;
  departmentIds: string;
  deviceCount: number | string;
}

@inject('userStore')
@observer
export default class Statistics extends Component<StatisticsProps, StatisticsState> {

  config: Config = {
    navigationBarTitleText: '统计'
  }
  constructor(props) {
    super(props)

    this.state = {
      tabId: 0,
      questionTypeData: {},
      specialTreatData: {},
      siteProblemData: {},
      departmentData: {},
      parseDepartData: [],
      time: {
        startTime: moment().startOf('day').valueOf(),
        endTime: moment().endOf('day').valueOf()
      },
      departmentIds: '',
      deviceCount: ''
    }
  }

  // 解析表格的数据，并传给表格进行渲染
  parseDepartmentData = () => {
    let { departmentData, parseDepartData } = this.state
    let type = { department: '', data: [] }
    parseDepartData = []
    departmentData.forEach((item, index) => {

      parseDepartData.push(Object.assign({}, type))
      parseDepartData[index]['department'] = item.departmentName
      parseDepartData[index].data = []

      parseDepartData[index].data.push(item.constructionSiteNum)
      parseDepartData[index].data.push(item.problemConstructionSiteNum)
      parseDepartData[index].data.push(item.problemConstructionSiteRate)

      parseDepartData[index].data.push(item.incidentNum)
      parseDepartData[index].data.push(item.superviseNum)

      parseDepartData[index].data.push(item.disposalNum)
      parseDepartData[index].data.push(item.unDisposalNum)
      parseDepartData[index].data.push(item.disposalRate)
    });
    this.setState({
      parseDepartData
    })
  }

  onNaviToMore = () => {
    const { time } = this.state
    this.$preload('time', time)
    const { time: { startTime, endTime } } = this.state

    Taro.navigateTo({
      url: `/pages/problem_site/index?startTime=${startTime}&endTime=${endTime}`
    })
  }

  onToMore = () => {
    const { time } = this.state
    this.$preload('time', time)
    Taro.navigateTo({
      url: '/pages/problem_site/tableList'
    })
  }

  onDepartment = () => {
    Taro.navigateTo({
      url: `/pages/sentry/filter`
    })
  }

  tabChoose(item: FilterTabsType) {
    this.setState({
      tabId: Number(item.id)
    });
  }

  onDateChange = (options) => {
    const { departmentIds = '' } = this.state
    const params = { ...options, departmentIds }
    const { userStore: { userDetails } } = this.props
    try {
      Promise.all([treatmentMeasure(params), labelIncident(params), siteProblem(params), department(params), constructionSiteSentryCount(userDetails.divisionCode)]).then(([specialTreatRes, questionTypeRes, siteProblemRes, departmentRes, deviceCountRes]) => {
        this.setState({
          questionTypeData: get(questionTypeRes, 'data', {}),
          specialTreatData: get(specialTreatRes, 'data', {}),
          siteProblemData: get(siteProblemRes, 'data', {}),
          deviceCount: deviceCountRes.data,
          departmentData: get(departmentRes, 'data', {}),
          time: options
        }, () => {
          this.parseDepartmentData()
        })
      })
    }
    catch (err) { }
  }

  onSentryHandle = () => {
    const { time: { startTime, endTime } } = this.state
    Taro.navigateTo({
      url: `/pages/device/index?startTime=${startTime}&endTime=${endTime}`
    })
  }

  onSuperviseHandle = () => {
    const { time: { startTime, endTime } } = this.state
    Taro.navigateTo({
      url: `/pages/supervise/index?startTime=${startTime}&endTime=${endTime}`
    })
  }

  componentDidShow() {
    if (this.checkIsRefresh()) {
      setTimeout(() => {
        const { time } = this.state
        this.onDateChange(time)
      }, 300)
    }
    else {
      const { time } = this.state
      this.onDateChange(time)
    }
  }

  componentWillUnmount() {
    Taro.removeStorageSync('statistics-search-filter')
  }

  checkIsRefresh = () => {
    const statisticsSearchFilter = Taro.getStorageSync('statistics-search-filter') || {}
    const { departmentIds } = this.state
    const selectedDepartment = statisticsSearchFilter.departmentIds || ''
    if (departmentIds != selectedDepartment) {
      this.setState({ departmentIds: selectedDepartment })
      return true
    }
    return false
  }

  onProblem = (item) => {
    const { time: { startTime, endTime } } = this.state
    Taro.navigateTo({
      url: `/pages/pollution-manage/question?id=${item.pollutionSourceId}&name=${item.name}&startTime=${startTime}&endTime=${endTime}&tabId=1`
    })
  }

  render() {
    const { tabId, questionTypeData, specialTreatData, siteProblemData, parseDepartData, deviceCount } = this.state
    const statisticsSearchFilter = Taro.getStorageSync('statistics-search-filter') || {}
    const isFilter = !!statisticsSearchFilter.departmentIds
    return (
      <View className='statistics-page'>
        <View className='topTabView'>
          <View className='tabs'>
            <FilterTabs isMore={false}
              data={[{ id: 0, name: '今日' }, { id: 1, name: '本周' }, { id: 2, name: '本月' }]}
              tabId={tabId}
              onMore={() => { }}
              rowNum={5}
              storageKey='statistics-search-filter'
              showDepartment={!isFilter}
              showFilter={isFilter}
              onDepartment={this.onDepartment}
              onFilter={this.onDepartment}
              onTab={this.tabChoose.bind(this)} />
            <DateCycle dateType={tabId} onChange={this.onDateChange.bind(this)} />
          </View>
          <ScrollView scrollY scrollWithAnimation className='scrollView'>
            <View className='body-container'>
              <SpecialTreat deviceData={deviceCount} data={specialTreatData} onSentry={this.onSentryHandle} onSupervise={this.onSuperviseHandle} />
              <QuestionType data={questionTypeData} />

              <View className="site_problem">
                <View className="site_problem_header">
                  <Text className="txt1">问题工地</Text>
                </View>
                {
                  isEmpty(siteProblemData) ? <View className='empty'><EmptyHolder text='暂无数据' /></View> : (
                    <View className='site_problem_pd'>
                      <View>
                        <ProblemList data={siteProblemData.length > 5 ? siteProblemData.slice(0, 5) : siteProblemData} onClick={this.onProblem.bind(this)}></ProblemList>
                      </View>
                      {
                        siteProblemData.length > 5 ?
                          <View className="site_problem_more" onClick={this.onNaviToMore}>
                            更多 >
                        </View> : ''
                      }
                    </View>)}
              </View>

              <View className="depaerment">
                <Table title={'部门管辖'} data={parseDepartData} tableTitle={["工地数", "异常工地数", "异常工地比例", "问题数", "督查数", "处置数", "超时未处置", "处置率"]} onToMore={this.onToMore}></Table>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    )
  }
}
