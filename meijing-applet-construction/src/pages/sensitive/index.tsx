import Taro, { Component, Config } from '@tarojs/taro'
import { View, Map, ScrollView } from '@tarojs/components'
import SearchBox from '@common/components/SearchBox'
import PollutionPop from './components/PollutionPop'
import SensitiveItem from '@common/components/FbiItems/SensitiveItem'
import { Region } from 'src/service/dispatch'
import { getLocation } from '../../service/userDivision'
import { Location } from '../../model'
import cn from 'classnames'
import { observer, inject } from '@tarojs/mobx';
import throttle from 'lodash/throttle'
import { sensitiveList } from '../../service/home'
import './index.scss'
import isEmpty from 'lodash/isEmpty'
import EmptyHolder from '@common/components/EmptyHolder'

const icon = require('../../assets/pollutant_source/mingangongdi.png')
const icon_selected = require('../../assets/pollutant_source/mingangongdi-select.png')

interface SensitiveProps {
  userStore: any;
  dispatchStore: any;
}

interface SensitiveState {
  queryContent: string;
  mode: 'map' | 'list';
  sensitiveData: any[];
  centerLocaltion: Location;
  currentPollutionId: number;
}

@inject('userStore', 'dispatchStore')
@observer
export default class Sensitive extends Component<SensitiveProps, SensitiveState> {

  config: Config = {
    navigationBarTitleText: '敏感工地'
  }

  mapCtx: any;

  constructor(props) {
    super(props)
    this.state = {
      queryContent: '',
      mode: 'list',
      sensitiveData: [],
      centerLocaltion: {
        longitude: 0,
        latitude: 0
      },
      currentPollutionId: -1
    }
    // this.onRegionchange = throttle(this.onRegionchange, 100)
  }

  componentWillMount() {

  }

  componentDidMount() {
    getLocation().then(location => {
      this.setState({
        centerLocaltion: location
      }, () => {
        sensitiveList({}).then((sensitiveRes) => {
          const sensitiveData = sensitiveRes.data || []
          this.setState({
            sensitiveData: sensitiveData
          })
        })
      })
    })
  }

  componentWillUnmount() { }

  componentDidShow() {
    try {
      const { userStore: { userDetails }, dispatchStore } = this.props
      dispatchStore.loadLatestMonitorDatas(userDetails.divisionCode, true)
    }
    catch (error) { }
  }

  componentDidHide() { }

  // 关键字输入
  onInputChange = (val) => {
    this.setState({
      queryContent: val
    })
  }

  onFilterHandle = () => {
    const { mode } = this.state
    this.setState({
      mode: mode === 'list' ? 'map' : 'list'
    })
  }

  onRegionchange(e) {
    if (e.causedBy == "scale" || e.causedBy == "drag") {
      try {
        if (this.mapCtx == null) {
          this.mapCtx = Taro.createMapContext('map')
        }
        this.mapCtx.getRegion({
          success: (res) => {
            let region: Region = {
              minLocation: {
                latitude: res.southwest.latitude,
                longitude: res.southwest.longitude
              },
              maxLocation: {
                latitude: res.northeast.latitude,
                longitude: res.northeast.longitude
              }
            }
            sensitiveList(region).then((sensitiveRes) => {
              const sensitiveData = sensitiveRes.data || []
              this.setState({
                sensitiveData: sensitiveData
              })
            })
          }
        })
      } catch (error) {
        console.log(error);
      }
    }
  }

  onBindMarker(res) {
    console.log(res.markerId)
    this.setState({
      currentPollutionId: res.markerId
    })
  }

  render() {
    let { queryContent, mode, sensitiveData, centerLocaltion, currentPollutionId } = this.state
    const { dispatchStore: { examSiteMarkers } } = this.props;
    if (queryContent) {
      sensitiveData = sensitiveData.filter((item) => item.pollutionSourceName.includes(queryContent))
    }
    const markerList = sensitiveData.map(source => {
      const markerId = source.pollutionSourceId
      const selected = currentPollutionId === markerId
      return {
        "id": markerId,
        "title": "",
        "latitude": source.latitude,
        "longitude": source.longitude,
        "width": (selected ? 44 : 28),
        "height": (selected ? 44 : 28),
        "iconPath": selected ? icon_selected : icon
      }
    })
    const currentPollution = sensitiveData.find(item => item.pollutionSourceId === currentPollutionId)
    const allMarkers = [...examSiteMarkers, ...markerList]
    return (
      <View className='sensitive-page'>
        {/* 搜索栏 */}
        <View className='search-container'>
          <View className='search-box'>
            <SearchBox
              value={queryContent}
              placeholder='搜索工地'
              onInput={this.onInputChange.bind(this)}
            />
          </View>
          <View className='switch-box' onClick={this.onFilterHandle}>
            <View className={cn('icon', { 'icon--map': mode === 'list' })}></View>
          </View>
        </View>

        <View className='body'>
          {mode === 'map' ?
            (
              <Map
                id='map'
                className='map'
                longitude={centerLocaltion.longitude}
                latitude={centerLocaltion.latitude}
                onCalloutTap={this.onBindMarker.bind(this)}
                onMarkerTap={this.onBindMarker.bind(this)}
                markers={allMarkers}
                scale={13}
                show-location={true}
                bindregionchange={this.onRegionchange}
              >
                {!isEmpty(currentPollution) && <PollutionPop data={currentPollution} />}
              </Map>
            ) :
            (
              <ScrollView
                className='scrollView'
                scrollWithAnimation
                scrollY
              >
                <View className='list'>
                  {
                    sensitiveData.map((item, index) => <SensitiveItem key={index + item.id} data={item} />)
                  }
                </View>
                {isEmpty(sensitiveData) && <View className='empty'><EmptyHolder text='暂无数据' /></View>}
              </ScrollView>
            )}
        </View>
        <View style={"display:none;"} onClick={this.onRegionchange}></View>
      </View>
    )
  }
}
