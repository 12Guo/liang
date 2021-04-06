import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, Swiper, SwiperItem, Picker, Block, ScrollView } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import LineChart from '@common/components/LineChart'
import SprayItem from '@common/components/FbiItems/SprayItem'
import ListView from '@common/components/ListView'
import EmptyHolder from '@common/components/EmptyHolder'
import AlarmItem from '@common/components/FbiItems/AlarmItem'
import FilterTabs, { FilterTabsType } from '@common/components/FilterTabs'
import get from 'lodash/get'
import cn from 'classnames'
import { FactorCode, getFactorName, listDataByTimeNew, alarmsList, getSiteFactorConfigBySiteType, alarmsListByPage, listSites, sprayHistories } from '../../service/alarm'
import './detail.scss'
import moment from 'moment';
import isEmpty from 'lodash/isEmpty';

interface DetailProps {
  userStore: any;
}

interface DetailState {
  siteDetail: any;
  current: number;
  hour: number;
  factorCode: FactorCode;
  siteHourDataList: any[],
  factors: any,

  circleList: any[],
  warnList: any[],
  paramQuery: {
    offset: number,
    limit: number
  },
  isInit: boolean,
  isLoading: boolean,
  hasMore: boolean,
  total: number,
  siteInfos: any[],
  tabId: string | number,
  timeChooseVisible: boolean
  firstLoading: boolean
  sprayList: any,
}

const Times = [
  { label: '24h', code: 24 },
  { label: '48h', code: 48 },
  { label: '72h', code: 72 }
]

const EnumDevice = {
  construction_dust: '工地扬尘站',
  tower_crane: '工地塔吊',
  spray: '工地喷淋'
}

@inject('userStore')
@observer
export default class Status extends Component<DetailProps, DetailState> {

  config: Config = {
    navigationBarTitleText: '视频设备状态'
  }

  constructor(props) {
    super(props)
    const { data = '{}' } = this.$router.params
    this.state = {
      siteDetail: JSON.parse(data),
      current: 0,
      hour: 24,
      factorCode: 'a34004',
      siteHourDataList: [],
      factors: [],
      circleList: [],

      warnList: [],
      paramQuery: {
        offset: 0,
        limit: 20
      },
      isInit: true,
      hasMore: true,
      isLoading: true,
      total: 0,
      siteInfos: [],
      tabId: 'construction_dust',
      timeChooseVisible: true,
      firstLoading: true,
      sprayList: []
    }
  }
  //@ts-ignore
  refLineChart = (node) => this.lineChart = node

  componentWillMount() {
    const { userStore: { userDetails } } = this.props
    Taro.setNavigationBarTitle({
      title: get(userDetails, 'tenant.name')
    })
  }

  componentDidMount() {
    try {
      const { userStore: { userDetails } } = this.props
      Promise.all([getSiteFactorConfigBySiteType('construction_dust'), listSites(userDetails.tenant.code)]).then(([factorRes, siteRes]) => {
        const siteInfos = get(siteRes, 'data', []);
        const factorsList = get(factorRes, 'data', []).map(factor => ({ label: factor.name, value: factor.code, unitCode: factor.unitCode === "--" ? "" : factor.unitCode }))
        this.setState({
          factors: factorsList,
          factorCode: get(factorsList,'[0].value','a34004'),
          siteInfos
        }, this.fetchData)
      })
    }
    catch (err) { }
  }

  //渲染折线图
  showLineCharts = () => {
    const { siteHourDataList, factorCode, circleList, tabId, factors } = this.state;

    let xAxisData: any[] = [];
    let seriesData: any[] = [];
    let timeFormate: string = tabId === "construction_dust" ? "HH" : "HH:mm";
    let circleIndex: any = []
    for (let i = 0; i < siteHourDataList.length; i++) {
      const dataTime: number = siteHourDataList[i].time;
      xAxisData.push(moment(dataTime).format(timeFormate));
      let factorValue = get(siteHourDataList, `[${i}].${factorCode}`);
      let findIndex = circleList.findIndex(circle => circle.alarmDataTime === dataTime)
      if (findIndex > -1) {
        circleIndex.push(i)
      }
      seriesData.push(factorValue);
    }
    let option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        top: '12%',
        left: '3%',
        right: '4%',
        bottom: '18%',
        containLabel: true
      },
      color: ['#EF6363'],
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xAxisData,
      },
      yAxis: {
        type: 'value',
        name: ((factors || []).find(item => item.value === factorCode) || {}).unitCode,
        nameGap: 10
      },
      series: [{
        smooth: true,
        data: seriesData,
        type: 'line',
        name: getFactorName(factorCode),
        itemStyle: {
          normal: {
            // label: {
            //     show: true,
            // }, 
            color: function (params) {
              if (circleIndex.includes(params.dataIndex)) {
                return '#E03434';
              }
              return '#414F70';
            },
            lineStyle: {
              color: '#414F70'
            }
          }
        },
      }]
    };
    setTimeout(() => {
      //@ts-ignore
      this.lineChart && this.lineChart.refresh(option);
    }, 500);
  }

  fetchData = () => {
    try {
      const { current, hour, siteInfos, tabId } = this.state;

      const isConstructionDust = tabId === "construction_dust";
      const filterTabSites = siteInfos.filter(item => item.siteType === tabId)
      const siteCode = get(filterTabSites, `[${current}].siteCode`, '4109280000000000100005')

      const nowHour = moment().startOf('hour').valueOf()
      const startTime = isConstructionDust ? moment(nowHour).subtract(hour, 'hour').valueOf() : moment().startOf("minute").subtract(60, "minutes").valueOf();
      const monuteEndTime = moment().endOf("minute").valueOf();

      Promise.all([
        listDataByTimeNew({ siteCode, startTime, endTime: isConstructionDust ? nowHour : monuteEndTime, dataType: isConstructionDust ? "hour" : "minute" }),
        alarmsList({ siteCodes: siteCode, queryBeginTime: startTime, queryEndTime: nowHour, alarmTimeType: 'HOUR' }),
        getSiteFactorConfigBySiteType(tabId)
      ]).then(([resp, res, factorRes]) => {
        const factorsList = get(factorRes, 'data', []).map(factor => ({ label: factor.name, value: factor.code, unitCode: factor.unitCode === "--" ? "" : factor.unitCode }))

        this.setState({
          siteHourDataList: resp.data,
          circleList: res.data,
          factors: factorsList,
          factorCode: factorsList[0].value || "a34004",
          firstLoading: false
        }, () => {
          this.showLineCharts();
        });
      })
      this.fetchList()
    }
    catch (e) { }
  }

  onChange = (e) => {
    const { paramQuery } = this.state
    this.setState({
      current: e.detail.current,
      paramQuery: {
        ...paramQuery,
        offset: 0
      },
      warnList: [],
      total: 0
    }, this.fetchData)
  }

  handleFactorChange = (res) => {
    const index = res.detail.value;
    const { factors } = this.state
    this.setState({
      factorCode: factors[index].value,
    }, () => {
      this.showLineCharts();
    })
  }

  onTimeChange = (item) => {
    const { paramQuery } = this.state
    this.setState({
      hour: item.code,
      paramQuery: {
        ...paramQuery,
        offset: 0
      },
      warnList: [],
      total: 0
    }, this.fetchData)
  }

  // 获取报警列表
  fetchList = (callback?: any) => {
    const { paramQuery, isInit, warnList, current, siteInfos, tabId } = this.state;
    const filterTabSites = siteInfos.filter(item => item.siteType === tabId)
    const siteCode = get(filterTabSites, `[${current}].siteCode`, '4109280000000000100005')
    alarmsListByPage({ ...paramQuery, siteCodes: siteCode }).then(res => {
      const { data: { entries = [], total = 0 } } = res;
      let newList = entries;
      if (!isInit) {
        newList = warnList.concat(newList);
      }
      this.setState({
        warnList: newList,
        isLoading: false,
        isInit: false,
        hasMore: entries.length == paramQuery.limit,
        paramQuery: {
          ...paramQuery,
          offset: paramQuery.offset + paramQuery.limit
        },
        total
      }, () => {
        if (callback) {
          callback();
        }
      });
    }).catch(res => {
      if (callback) {
        callback();
      }
    });
    if (tabId === 'spray') {
      this.fetchSpray(siteCode)
    }
  }

  /**
   * 喷淋接口请求
   */
  fetchSpray = (siteCode) => {
    try {
      sprayHistories({ constructionCode: siteCode, offset: 0, limit: 200 }).then(res => {
        this.setState({ sprayList: get(res, 'data.entries', []) })
      })
    }
    catch (err) { }
  }

  /**
   * 刷新操作
   */
  onRefresh = () => {
    const { paramQuery } = this.state;
    this.setState({
      paramQuery: {
        ...paramQuery,
        offset: 0
      },
      warnList: [],
      total: 0,
      current: 0
    }, () => {
      this.fetchList();
    })
  }

  tabChoose(item: FilterTabsType) {
    const siteTypeCode = item.id;

    this.setState({
      tabId: item.id,
      current: 0,
      sprayList: [],
      timeChooseVisible: siteTypeCode === "construction_dust"
    }, () => {
      this.fetchData();
      this.onRefresh();
    });
  }

  render() {
    const {
      current, siteInfos, hour, factorCode, warnList = [], factors, hasMore, isLoading, total, tabId, timeChooseVisible,
      siteHourDataList, firstLoading, sprayList
    } = this.state

    let isEmptyData = !warnList || warnList.length == 0;
    const isEmptyLineData = siteHourDataList.length === 0;
    const showEmpty = (<View className='empty' style={{ paddingTop: "40px" }}><EmptyHolder text='暂无数据' /></View>)
    const showList = warnList.map((alarm, index) => (
      <AlarmItem data={alarm} isLast={index === warnList.length - 1} />
    ));
    const isEmptyTab = siteInfos.filter(item => item.siteType === tabId).length === 0

    return (
      <View className='status-page'>
        <View className='topTabView'>
          <View className='tabs'>
            <FilterTabs isMore={false}
              data={[{ id: 'construction_dust', name: '扬尘站' }, { id: 'tower_crane', name: '塔吊' }, { id: 'spray', name: '喷淋' }]}
              tabId={tabId}
              onMore={() => { }}
              rowNum={5}
              onTab={this.tabChoose.bind(this)} />
          </View>
        </View>

        {
          isEmptyTab ? showEmpty : (
            <Block>
              <View className='swiper-content'>
                <Swiper className='list__container'
                  indicatorColor='#999'
                  indicatorActiveColor='#333'
                  circular
                  indicatorDots
                  onChange={this.onChange}
                  current={current}
                >
                  {
                    siteInfos.filter(item => item.siteType === tabId).map((item, index) => (
                      <SwiperItem key={item.siteCode}>
                        <View className={cn('list__item', { 'list__item__status': item.online })}>
                          <View className={`icon icon__${item.siteType}`}></View>
                          <View className='content'>
                            <Text className='name'>{get(item, 'siteName', '--')}</Text>
                            <Text className='type'>{EnumDevice[item.siteType]}</Text>
                          </View>
                          <View className='status'>{item.online ? '· 在线' : ' 离线'}</View>
                        </View>
                      </SwiperItem>
                    ))
                  }
                </Swiper>
              </View>

              {tabId !== 'spray' && (
                <Block>
                  <View className='chart-content'>
                    <Text className='title'>变化趋势</Text>
                    <View className='condition'>
                      <View className='time'>
                        {
                          timeChooseVisible && Times.map(time =>
                            <Text
                              onClick={this.onTimeChange.bind(this, time)}
                              className={cn('time-txt', { 'time-txt__active': time.code === hour })}
                              key={time.code}
                            >
                              {time.label}
                            </Text>
                          )
                        }
                      </View>
                      {
                        // !isEmptyLineData && (
                          <Picker mode='selector' value={0} range={factors} range-key='label' onChange={this.handleFactorChange.bind(this)}>
                            <View className='container'>
                              <Text className='factorName'>{get(factors.find(factor => factor.value === factorCode), 'label', '')}</Text>
                            </View>
                          </Picker>
                        // )
                      }
                    </View>
                    <View className="fpi_chart__body">
                      <View
                        style={{
                          visibility: isEmptyLineData ? "hidden" : "visible",
                          height: isEmptyLineData ? "0" : "auto"
                        }}
                      >
                        {
                          !isEmptyLineData && <LineChart ref={this.refLineChart} />
                        }
                        
                      </View>
                      {
                        firstLoading === false && isEmptyLineData && showEmpty
                      }
                    </View>
                  </View>

                  {total && (
                    <View className='warn-content'>
                      <Text className='title'>报警记录</Text>
                      {/* 列表展示部分 */}
                      <ListView
                        com-class='warn-list'
                        hasMore={hasMore}
                        hasData={!isEmpty(warnList)}
                        showLoading={isLoading}
                        onRefresh={this.onRefresh}
                        onEndReached={this.fetchList}
                      >
                        {isEmptyData ? showEmpty : showList}
                      </ListView>
                    </View>
                  )}
                </Block>
              )}

              {tabId === 'spray' && (
                <ScrollView className='scrolly' scrollY scrollWithAnimation>
                  <View className='spray-content'>
                    {sprayList.map((item, index) => (
                      <SprayItem data={item} isLast={index === sprayList.length - 1} />
                    ))}
                  </View>
                  {isEmpty(sprayList) && (<View className='empty' style={{ paddingTop: "60px" }}><EmptyHolder text='暂无数据' /></View>)}
                </ScrollView>
              )}
            </Block>
          )
        }

      </View>
    )
  }
}