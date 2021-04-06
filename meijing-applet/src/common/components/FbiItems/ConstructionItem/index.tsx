import Taro, { PureComponent } from '@tarojs/taro';
import { View } from '@tarojs/components';
import "./index.scss"

interface ConstructionItemProps {
    construction: any,
    onTenant: any
}
interface ConstructionItemState {}

export default class ConstructionItem extends PureComponent<ConstructionItemProps, ConstructionItemState> {
    constructor(){
        super(...arguments);
    }
    onCheckTenant(tenantCode, tenantName, tenantId){
        this.props.onTenant(tenantCode, tenantName, tenantId);
    }
    toThousand = (val) => {
        if (!val || isNaN(val)) {
            return ''
        }
        else if (val < 1000) {
            return `(${val}m)`
        }
        else {
            return `${(val / 1000).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,')}km`
        }
    }

    render(){
        const { construction } = this.props;

        return (
            construction && (
                <View className="construction_item" key={construction.id} onClick={this.onCheckTenant.bind(this, construction.code, construction.name, construction.id)}>
                    <View className="left">
                        <View className="name">{construction.name}</View>
                        <View className="address">{construction.address || ""}</View>
                    </View>
                    <View className="right">{this.toThousand(construction.distance)}</View>
                </View>
            )
        )
    }
}