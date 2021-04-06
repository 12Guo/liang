import Taro, { Component } from '@tarojs/taro'
import { View, Image, Text, Input } from '@tarojs/components'
import { rootSourceBaseUrl } from '../../../utils/requests'

import cn from 'classnames'
import isEmpty from 'lodash/isEmpty'
import './index.scss'

//图标引用
const checkedImage = `${rootSourceBaseUrl}/assets/common/radio/checked.png`;
const uncheckedImage = `${rootSourceBaseUrl}/assets/common/radio/unchecked.png`;
const treeImage = `${rootSourceBaseUrl}/assets/common/icon-tree.png`;
const iconRight = `${rootSourceBaseUrl}/assets/common/icon-right.png`

interface UnitModuleProps {
    data: any,
    type: number,
    onCheck: (item: any) => void,
    onSub: (item: any) => void,
    canCheck: boolean,
    isChoose: boolean,
}

interface UnitModuleState {

}

const unitData = ['部门', '下级区域'];

export default class UnitModule extends Component<UnitModuleProps, UnitModuleState> {
    constructor(props) {
        super(props)
    }

    static defaultProps = {
        canCheck: true,
        isChoose: true
    }

    onCheckHandle = (item, e) => {
        e.stopPropagation()
        this.props.onCheck(item);
    }

    onSubHandle = (item) => {
        !item.checked && this.props.onSub(item);
    }

    render() {
        const { data, type, canCheck, isChoose } = this.props;
        if (isEmpty(data)) {
            return;
        }

        return (
            <View className={cn('module__container', { 'module__container--hide': data.children.filter(child => child.type == type).length == 0 })}>
                <Text className='module__title'>{unitData[type - 2]}</Text>
                <View className='module__body'>
                    {
                        data.children.filter(child => child.type == type).map(item => (
                            <View key={item.id} className='module__item' onClick={this.onSubHandle.bind(this, item)}>
                                {isChoose && <Image className={cn('img', { 'img--disabled': !canCheck })} onClick={this.onCheckHandle.bind(this, item)} src={item.checked ? checkedImage : uncheckedImage} />}
                                <Text className='txt'>{`${item.name}`}</Text>
                                <View className='sub'>
                                    {isChoose ? (
                                        <View className={cn('sub__container', { 'sub__container--disabled': item.checked })}>
                                            <Image className='tree_img' src={treeImage} />
                                            <Text className='tree_txt'>下级</Text>
                                        </View>
                                    ) : <Image className='right_img' src={iconRight} />}
                                </View>
                            </View>
                        ))
                    }
                </View>
            </View>
        )
    }
}