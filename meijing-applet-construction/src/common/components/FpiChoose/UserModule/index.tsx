import Taro, { Component } from '@tarojs/taro'
import { View, Image, Text, Input } from '@tarojs/components'
import { rootSourceBaseUrl, getUserAvatarUrl } from '../../../utils/requests'

import cn from 'classnames'
import isEmpty from 'lodash/isEmpty'
import './index.scss'

//图标引用
const checkedImage = `${rootSourceBaseUrl}/assets/common/radio/checked.png`;
const uncheckedImage = `${rootSourceBaseUrl}/assets/common/radio/unchecked.png`;

interface UserModuleProps {
    data: any,
    onCheck: (item: any) => void,
    isSpace: boolean,
    isChoose: boolean,
    onDetail?: (item: any) => void,
}

interface UserModuleState {

}

export default class UserModule extends Component<UserModuleProps, UserModuleState> {
    constructor(props) {
        super(props)
    }

    onCheckHandle = (item) => {
        const { data } = this.props;
        !data.checked && this.props.onCheck(item);
    }

    static defaultProps = {
        isChoose: true
    }

    onUser = (user) => {
        const { onDetail } = this.props
        onDetail && onDetail(user)
    }

    render() {
        const { data, isSpace, isChoose } = this.props;
        if (isEmpty(data)) {
            return;
        }
        return (
            <View className={cn('module__person', { 'module__person--hide': data.users.filter(child => child.type == 4).length == 0 })}>
                <View className={cn('space', { 'space--hide': isSpace }}></View>
                <View className='module__body'>
                    {
                        data.users.filter(child => child.type == 4).map(item => (
                            <View key={item.id} className={cn('module__item', { 'module__item--disabled': data.checked })} onClick={this.onUser.bind(this, item)}>
                                {isChoose && <Image className='img' onClick={this.onCheckHandle.bind(this, item)} src={item.checked ? checkedImage : uncheckedImage} />}
                                <Image className='user_img' src={`${getUserAvatarUrl(item.id)}`} />
                                <Text className='user_txt'>{item.name}</Text>
                            </View>
                        ))
                    }
                </View>
            </View>
        )
    }
}