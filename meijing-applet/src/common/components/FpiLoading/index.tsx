import { Component } from '@tarojs/taro'
import { View } from '@tarojs/components'
import cn from 'classnames'
import './index.scss'

interface FpiLoadingProps {
    /**
     * 当前是否loading效果
     */
    isLoading: boolean
}

interface FpiLoadingState {
    current: number
}

let timer: any = 0;

export default class FpiLoading extends Component<FpiLoadingProps, FpiLoadingState> {

    constructor(props) {
        super(props);

        this.state = {
            current: 0
        }
    }

    static defaultProps = {
        isLoading: false
    }

    componentDidMount() {
        timer = setInterval(() => {
            this.setState({
                current: (this.state.current + 1) % 3
            })
        }, 100)
    }

    componentWillUnmount() {
        clearInterval(timer);
    }

    render() {
        const { current } = this.state;
        const { isLoading } = this.props;
        return (
            <View className='fpi-loading'>
                <View className={cn('dot', { active: current == 0 && isLoading })}></View>
                <View className={cn('dot', { active: current == 1 && isLoading })}></View>
                <View className={cn('dot', { active: current == 2 && isLoading })}></View>
            </View>
        )
    }
}