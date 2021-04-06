import Taro, { Config } from '@tarojs/taro'
import { ComponentType } from 'react'
import { observer, inject } from '@tarojs/mobx';
import { UserStore } from '@common/store/user'
import { WebView, View } from '@tarojs/components'
import { getLocation } from '../../service/userDivision'
import qs from 'query-string'
import { webSite } from '@common/utils/requests'

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
        getLocation().then(location => {
            this.setState({
                longitude: location.longitude,
                latitude: location.latitude,
            });
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
        const { userStore: { userDetails: { divisionCode } } } = this.props;
        const { longitude, latitude } = this.state;
        const url = longitude && latitude && `${webSite}impact-analysis?divisionCode=${divisionCode}&latitude=${latitude}&longitude=${longitude}&title=${encodeURIComponent('影响分析')}`
        return (
            <View className="root">
                {url && <WebView className="web_view" src={url} />}
            </View>
        )
    }

} export default DiscussAnalysis as ComponentType