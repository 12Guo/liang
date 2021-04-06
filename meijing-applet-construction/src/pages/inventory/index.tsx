import Taro, { Config } from '@tarojs/taro'
import { ComponentType } from 'react'
import { Image, View } from '@tarojs/components'
import './index.scss'
import { rootSourceBaseUrl } from '@common/utils/requests'

interface InventoryProps {

}

interface InventoryState {

}

interface Inventory {
    props: InventoryProps,
    state: InventoryState
}

const imageUrl = rootSourceBaseUrl + '/assets/inventory/inventory.png';

class Inventory extends Taro.Component {

    constructor() {
        super(...arguments)
        this.state = {
        }
    }

    config: Config = {
        navigationBarTitleText: '工作盘点',
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

} export default Inventory as ComponentType