import Taro, { PureComponent } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { rootConstructionSourceBaseUrl } from '@common/utils/requests'

import './index.scss'

const IconAI = `${rootConstructionSourceBaseUrl}/assets/pages/index/ai.png`

interface AiTipProps {
    data: any;
}

interface AiTipState {
    showTip: boolean;
}

export default class AiTip extends PureComponent<AiTipProps, AiTipState> {
    constructor(props) {
        super(props)
        this.state = {
            showTip: false
        }
    }

    onChange = () => {
        this.setState({ showTip: true })
    }

    onClose = () => {
        this.setState({ showTip: false })
    }

    onDetail = () => {
        Taro.navigateTo({
            url: '/pages/sensitive/index'
        })
    }

    render() {
        const { showTip } = this.state
        const { data = [] } = this.props
        return (
            <View className='ai-tip'>
                {showTip ?
                    (
                        <View className='ai-container'>
                            <Image className='ai-img' src={IconAI} />
                            <View className='tip'>
                                <View className='tip_txt' onClick={this.onDetail}>
                                    当前需重点关注的工地是：<Text className='strong'>{data.slice(0, 3).map((item) => item.pollutionSourceName).join('、')}</Text>，所有敏感工地名单，请<Text className='link'>查看详情>></Text>
                                </View>
                                <View className='tip_img' onClick={this.onClose}></View>
                            </View>
                        </View>
                    ) :
                    <Image className='ai-img ai-img--roate' src={IconAI} onClick={this.onChange} />
                }
            </View>
        )
    }
}