import Taro, { Component, Config } from '@tarojs/taro';
import { WebView } from '@tarojs/components';
import { webSite, baseUrl } from '@common/utils/requests'

// 标题对照关系
const MapTitle = {
  all: '工地巡查统计',
  department: '部门考核',
  inspector: '巡查员考核'
}

class WebViewPage extends Component {
  config: Config = {
    navigationBarTitleText: '',
    pageOrientation: 'landscape',
    navigationStyle: "custom"
  }

  static externalClasses = ['com-class']
  constructor(props) {
    super(props);

    this.state = {

    }
  }

  componentWillUnmount() {
    const from = this.$router.params.from
    let path = ''
    switch (from) {
      case 'construction':
        console.log(this.$router.params,'fk')
        const dataType = this.$router.params.dataType || 'all'
        path = `work/construction?dataType=${dataType}&title=${encodeURIComponent(MapTitle[dataType])}`
        break;
      case 'industry':
        path = `work/industry?title=${encodeURIComponent('行业部门统计')}`
        break;
      default:
        path = `work/construction?title=${encodeURIComponent('工地巡查统计')}`
        break;
    }
    Taro.navigateTo({
      url: '/pages/webview/index?url=' + encodeURIComponent(path)
    })
  }

  render() {
    let url = decodeURIComponent(this.$router.params.url || '')
    if (!url) {
      return ''
    }
    if (url.indexOf(baseUrl) == -1) {
      url = `${webSite}${url}`;
    }

    console.log(url);
    return (
      <WebView src={url} />
    );
  }
}

export default WebViewPage;