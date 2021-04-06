import Taro, { Config } from '@tarojs/taro'
import { ComponentType } from 'react'
import { observer, inject } from '@tarojs/mobx';
import { UserStore } from '../../common/store/user'
import { WebView, View } from '@tarojs/components'
import { getLocation } from '../../service/userDivision'
import qs from 'query-string'
import { webSite } from '@common/utils/requests';

import './index.scss'

interface DiscussAnalysisProps {
    userStore: UserStore;
}

interface DiscussAnalysisState {
    longitude: number;
    latitude: number;
    divisionCode: string;
}

interface DiscussAnalysis {
    props: DiscussAnalysisProps,
    state: DiscussAnalysisState
}

@inject("userStore")
@observer
class DiscussAnalysis extends Taro.Component<DiscussAnalysisProps, DiscussAnalysisState> {

    constructor() {
        super(...arguments)
    }

    config: Config = {
        navigationBarTitleText: '影响分析',
    }


    componentDidMount() {
        const { location } = this.props.userStore.userDetails.pollutionSourceInfo;
        this.setState({
            longitude: location && location.longitude,
            latitude: location && location.latitude,
        });
    }


    onShareAppMessage(e) {
        let url = e.webViewUrl;
        const { title = '数据查询' } = qs.parse(url.split('/#/')[1]);
        return {
            title: `${title}`,
            path: `/pages/webview/index?url=${encodeURIComponent(url.split('/#/')[1])}`
        }
    }

    render() {
        const { userStore: { userDetails: { pollutionSourceInfo, tenant } } } = this.props;
        const { longitude, latitude } = this.state;
        const url = longitude && latitude && `${webSite}impact-analysis/index_tenant?code=${tenant.code}&source=green_construction&token=${Taro.getStorageSync("token")}&divisionCode=${pollutionSourceInfo && pollutionSourceInfo.divisionCode}&latitude=${latitude}&longitude=${longitude}&title=${encodeURIComponent('影响分析')}`
        console.log(url)
        return (
            <View className="root">
                {url && <WebView className="web_view" src={url} />}
            </View>
        )
    }

} export default DiscussAnalysis as ComponentType