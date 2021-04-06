import Taro, { Component } from '@tarojs/taro'
import { View, Image, Text } from '@tarojs/components'
import { rootSourceBaseUrl, getUserAvatarUrl } from '../../../utils/requests'

import cn from 'classnames'
import isEmpty from 'lodash/isEmpty'
import './index.scss'

//图标引用
const checkedImage = `${rootSourceBaseUrl}/assets/common/radio/checked.png`;
const uncheckedImage = `${rootSourceBaseUrl}/assets/common/radio/unchecked.png`;

interface ChooseModuleProps {
    data: any,
    type: number,
    keyword: string,
    onCheck: (item: any) => void,
    isChoose: boolean,
    onDetail?: (item: any) => void,
}

interface ChooseModuleState {

}

const unitData = ['部门', '区域', '人员'];

export default class ChooseModule extends Component<ChooseModuleProps, ChooseModuleState> {
    constructor(props) {
        super(props)
    }

    onCheckHandle = (item) => {
        this.props.onCheck(item);
    }

    static defaultProps = {
        isChoose: true
    }

    onUser = (user) => {
        const { onDetail } = this.props
        onDetail && onDetail(user)
    }

    render() {
        const { data = [], type, keyword, isChoose } = this.props;
        return (
            <View className={cn('module__search', { 'module__search--hide': isEmpty(data) })}>
                <Text className='module__title'>{unitData[type - 2]}</Text>
                <View className='module__body'>
                    {
                        data.map(item => (
                            <View key={item.id} className='module__item' onClick={this.onUser.bind(this, item)}>
                                {isChoose && <Image className='img' onClick={this.onCheckHandle.bind(this, item)} src={item.checked ? checkedImage : uncheckedImage} />}
                                {type == 4 && <Image className='user_img' src={`${getUserAvatarUrl(item.id)}`} />}
                                <View className='user_wrapper'>
                                    <View className='name'>
                                        <Text className='name__pre'>{item.name.substr(0, item.name.indexOf(keyword))}</Text>
                                        <Text className='name__high'>{keyword}</Text>
                                        <Text className='name__next'>{item.name.substr(item.name.indexOf(keyword) + keyword.length)}</Text>
                                    </View>
                                    <Text className='path'>{item.path.replace("-null", "")}</Text>
                                </View>
                            </View>
                        ))
                    }
                </View>
            </View>
        )
    }
}