import Taro, { Component } from '@tarojs/taro'
import { View, Image, Text } from '@tarojs/components'
import { rootSourceBaseUrl } from '../../utils/requests'
import cn from 'classnames'
import './index.scss'

interface TopBarProps {
    // 背景颜色和字体颜色
    background?: string
    color?: string
    title: string,
    onBack?: () => void,
    backVisible?: boolean,
    fixed: boolean,
}

interface TopBarState {
    statusHeight: number,
    navHeight: number
}

export default class TopBar extends Component<TopBarProps, TopBarState> {
    constructor(props) {
        super(props)
        this.state = {
            statusHeight: 20,
            navHeight: 44,
        }
    }

    componentWillMount() {
        Taro.getSystemInfo({
            success: (res) => {
                let isIos = res.system.indexOf('iOS') > -1;
                this.setState({
                    statusHeight: res.statusBarHeight,
                    navHeight: isIos ? 44 : 48
                })
            }
        })
    }

    render() {
        const { statusHeight, navHeight } = this.state;
        const { title, onBack, color, background = '#ffffff', backVisible = true, fixed = false } = this.props;
        return (
            <View className={cn('top-bar', { 'top-bar__fixed': fixed })} style={{ background: `${background}`, color: `${color}` }}>
                <View className='status' style={{ height: `${statusHeight}px` }}></View>
                <View className='navbar' style={{ height: `${navHeight}px` }}>
                    {
                        backVisible && <Image className='img' src={`${rootSourceBaseUrl}/assets/common/arrow.png`} onClick={onBack} />
                    }
                    <Text className='title'>{title}</Text>
                </View>
            </View>
        )
    }
}