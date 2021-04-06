import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import SiteProgress from './components/SiteProgress'
import get from 'lodash/get'
import './index.scss'

import { rootConstructionSourceBaseUrl } from '@common/utils/requests'
import { constructionSiteProgressStat } from '../../service/statistics'

const video = `${rootConstructionSourceBaseUrl}/assets/pages/work/video.png`
const monitor = `${rootConstructionSourceBaseUrl}/assets/pages/work/monitor.png`
const depart_examine = `${rootConstructionSourceBaseUrl}/assets/pages/work/depart_examine.png`
const inspection_report = `${rootConstructionSourceBaseUrl}/assets/pages/work/inspection_report.png`
const inspector_examine = `${rootConstructionSourceBaseUrl}/assets/pages/work/inspector_examine.png`
const record = `${rootConstructionSourceBaseUrl}/assets/pages/work/record.png`
const supervise = `${rootConstructionSourceBaseUrl}/assets/pages/work/supervise.png`
const examine = `${rootConstructionSourceBaseUrl}/assets/pages/work/examine.png`

interface WorkBenchProps {
  userStore: any;
}

interface WorkBenchState {
  list: ListType[],
  siteProgressData: any,
}

interface ListType {
  title: string,
  options: OptionsType[]
}

interface OptionsType {
  img: any,
  txt: string,
  path?: string
}
@inject('userStore')
@observer
export default class Workbench extends Component<WorkBenchProps, WorkBenchState> {

  constructor(props) {
    super(props)
    this.state = {
      list: [
        {
          title: '实时监测',
          options: [{
            img: video,
            txt: '视频哨兵',
            path: '/pages/sentry/index'
          },
          {
            img: monitor,
            txt: '在线监测',
            path: '/pages/monitor/index'
          }]
        },
        {
          title: '日常工作',
          options: [{
            img: inspection_report,
            txt: '巡查上报',
            path: '/pages/work_options/inspection_report'
          },
          {
            img: supervise,
            txt: '整改督察',
            path: '/pages/supervise/index?nameType=inspect'
          },
          {
            img: record,
            txt: '工地档案',
            path: '/pages/work_options/record'
          }]
        },
        {
          title: '考核评估',
          options: [{
            img: depart_examine,
            txt: '部门考核',
            path: '/common/pages/webview/index?url=' + encodeURIComponent(`work/construction?dataType=department&title=${encodeURIComponent('部门考核')}`)
          },
          {
            img: inspector_examine,
            txt: '巡查员考核',
            path: '/common/pages/webview/index?url=' + encodeURIComponent(`work/construction?dataType=inspector&title=${encodeURIComponent('巡查员考核')}`)
          }
          ]
        }
      ],
      siteProgressData: {}
    }
  }

  config: Config = {
    navigationBarTitleText: '工作台'
  }

  onNavigateTo(path) {
    Taro.navigateTo({
      url: path
    });
  }

  componentDidMount() {
    this.getConstructionSiteProgressStat()
  }

  componentDidShow() {
    this.getConstructionSiteProgressStat()
    const { userStore: { userDetails } } = this.props
    const isSystemOperator = get(userDetails, 'roles', []).find(role => role.code === 'system_operator')
    if (isSystemOperator) {
      const { list } = this.state
      if (list[1].options.length === 3) {
        list[1].options.push({
          img: examine,
          txt: '事件审核',
          path: '/pages/work_options/examine'
        })
        this.setState({ list })
      }
    }
  }

  getConstructionSiteProgressStat = () => {
    constructionSiteProgressStat().then(siteProgressDataRes => {
      this.setState({
        siteProgressData: siteProgressDataRes.data || {}
      })
    })
  }

  render() {
    const { list, siteProgressData } = this.state
    return (
      <View className='work-page'>
        <View className="echart">
          <SiteProgress data={siteProgressData} />
        </View>
        <View className="select_options">
          {
            list.map((item, index) => {
              return (
                <View key={index}>
                  <View className="title">
                    <Text className="txt1">{item.title}</Text>
                  </View>
                  <View className="options_box">
                    {
                      item.options.map((element, i) => {
                        return (
                          <View className="option_item" key={i} onClick={this.onNavigateTo.bind(this, element.path)}>
                            <Image className="img1" src={element.img}></Image>
                            <Text className="txt2">{element.txt}</Text>
                          </View>
                        )
                      })
                    }
                  </View>
                </View>
              )
            })
          }
        </View>
      </View>
    )
  }
}
