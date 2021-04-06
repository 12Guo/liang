import Taro, { PureComponent } from '@tarojs/taro';
import { View, Image } from '@tarojs/components';
import "./index.scss"
import { rootConstructionSourceBaseUrl } from "@common/utils/requests";

interface ConstructionItemProps {
    list: any[],
    onTenant: any,
    nowTenantCode: string
}
interface ConstructionItemState {

}

const switchConstructionImg = rootConstructionSourceBaseUrl + "/assets/pages/green-construction/switch-construction.png"

export default class ConstructionItem extends PureComponent<ConstructionItemProps, ConstructionItemState> {
    constructor(){
        super(...arguments);
    }
    onCheckTenant(tenantCode){
        this.props.onTenant(tenantCode);
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
        const { list=[], nowTenantCode } = this.props;
        console.log(list);

        return (
            list.map((item:any) => (
                <View className="construction_item" key={item.id} onClick={() => this.onCheckTenant(item.tenantCode)}>
                    <View className="left">
                        <View className="name">{item.tenantName}</View>
                        <View className="address">{item.address || ""}</View>
                    </View>
                    <View className="right">
                        {
                            nowTenantCode == item.tenantCode && <Image src={switchConstructionImg} className="img" />
                        }
                    </View>
                </View>
            ))
        )
    }
}
