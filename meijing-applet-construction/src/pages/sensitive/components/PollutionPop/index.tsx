import Taro, { PureComponent } from '@tarojs/taro'
import { View, CoverView, CoverImage } from '@tarojs/components'
import { rootConstructionSourceBaseUrl } from '@common/utils/requests'

import './index.scss'
import moment from 'moment'

const IconMore = `${rootConstructionSourceBaseUrl}/assets/pages/sensitive/right.png`

interface PollutionPopProps {
    data: any;
}

interface PollutionPopState {
    showTip: boolean;
}

export default class PollutionPop extends PureComponent<PollutionPopProps, PollutionPopState> {
    constructor(props) {
        super(props)
        this.state = {
            showTip: false
        }
    }

    onDetail = () => {
        const { data = {} } = this.props
        Taro.navigateTo({
            url: `/pages/pollution-manage/detail?id=${data.pollutionSourceId}`
        })
    }

    render() {
        const { data = {} } = this.props
        return (
            <CoverView className='pollution-pop'>
                <CoverView className='content'>
                    <CoverView className='title'>{data.pollutionSourceName}</CoverView>
                    {data.latestTime && <CoverView className='time'>最新预警 {moment(data.latestTime).fromNow()}</CoverView>}
                    <CoverView className='address'>{data.pollutionSourceAddress}</CoverView>
                </CoverView>
                <CoverImage className='pop_img' src={IconMore} onClick={this.onDetail} />
            </CoverView>
        )
    }
}