import Taro, { Config } from '@tarojs/taro'
import { ComponentType } from 'react'
import { Image, View } from '@tarojs/components'
import './index.scss'
import { rootSourceBaseUrl } from '@common/utils/requests'

interface SecureProps {

}

interface SecureState {

}

interface Secure {
    props: SecureProps,
    state: SecureState
}

const imageUrl = rootSourceBaseUrl + '/assets/secure/secure.png';

class Secure extends Taro.Component {

    constructor() {
        super(...arguments)
        this.state = {
        }
    }

    config: Config = {
        navigationBarTitleText: '保障工作',
    }

    componentWillMount() {

    }

    render() {
        return (
            <View className="root">
                <Image className="image" src={imageUrl} mode="widthFix"></Image>
            </View>
        )
    }

} export default Secure as ComponentType