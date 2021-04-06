import Taro, { Config } from '@tarojs/taro'
import { ComponentType } from 'react'
import { View, Text } from '@tarojs/components'
import './index.scss'
import { getPollutantTags } from '../../service/pollutant'

interface PointTag {
    id: number,
    name: string
}

interface SignPointProps {

}

interface SignPointState {
    pollutantTags: PointTag[]
}

interface SignPoint {
    props: SignPointProps,
    state: SignPointState
}

class SignPoint extends Taro.Component {

    constructor() {
        super(...arguments)
        this.state = {
            pollutantTags: [],
        }
    }

    config: Config = {
        navigationBarTitleText: '标记',
    }

    componentWillMount() {
        let tags: PointTag[] = [];
        getPollutantTags().then((res) => {
            res.map((tag) => {
                tags.push(tag);
            })
            this.setState({
                pollutantTags: tags
            })
        })
    }

    onNoticeChange() {

    }

    onSelect(id: number) {
        Taro.navigateTo({
            url: `/pages/default/index`
        })
    }

    render() {
        const { pollutantTags } = this.state;
        return (
            <View className="root">
                <View className="title">选中污染源类型</View>
                <View className="sign_group">
                    {pollutantTags.map((res) => {
                        return (
                            <Text className="sign_content" onClick={this.onSelect.bind(this, res.id)}>{res.name}</Text>
                        )
                    })}
                </View>
            </View>
        )
    }

} export default SignPoint as ComponentType