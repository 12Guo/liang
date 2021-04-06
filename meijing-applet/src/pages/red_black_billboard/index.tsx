import Taro, { Config } from '@tarojs/taro'
import { ComponentType } from 'react'
import { Image, View } from '@tarojs/components'
import './index.scss'
import { rootSourceBaseUrl } from '@common/utils/requests'

interface RedBlackBillboardProps {

}

interface RedBlackBillboardState {

}

interface RedBlackBillboard {
    props: RedBlackBillboardProps,
    state: RedBlackBillboardState
}

const imageUrl = rootSourceBaseUrl + '/assets/red_black_billboard/image.png';

class RedBlackBillboard extends Taro.Component {

    constructor() {
        super(...arguments)
        this.state = {
        }
    }

    config: Config = {
        navigationBarTitleText: '红黑榜',
    }

    componentWillMount() {

    }

    render() {
        return (
            <View className="root">
                <Image className="image" src={imageUrl}></Image>
            </View>
        )
    }

} export default RedBlackBillboard as ComponentType