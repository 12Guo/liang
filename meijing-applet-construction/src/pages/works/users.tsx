import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import { getViewList } from '../../service/inspect'
import { getUserAvatarUrl } from '@common/utils/requests'
import './users.scss'
import moment from 'moment';

interface UsersProps {
    userStore: any;
}

interface UsersState {
    list: any[],
    type: string
}

@inject('userStore')
@observer
export default class Users extends Component<UsersProps, UsersState> {

    config: Config = {
        navigationBarTitleText: '同行人'
    }

    constructor(props) {
        super(props)
        this.state = {
            list: [],
            type: '1'
        }
    }

    componentWillMount() {
        this.getInitData();
    }

    getInitData = async () => {
        const { type = '1', partner, inspectId } = this.$router.params;
        let list = [];
        if (partner && type == '1') {
            list = JSON.parse(partner)
        }
        if (type == '2') {
            const viewListResp = await getViewList(parseInt(inspectId), 0, 200);
            const { data: { entries = [] } } = viewListResp;
            list = entries.map(item => ({
                avatar: `${getUserAvatarUrl(item.userId)}`,
                name: item.userName,
                time: moment(item.createTime).format('YYYY-MM-DD HH:mm:ss')
            }))
        }
        this.setState({
            list,
            type
        })
        Taro.setNavigationBarTitle({ title: type == '1' ? '同行人' : '浏览记录' });
    }

    render() {
        const { list = [], type } = this.state;
        return (
            <View className='users'>
                {
                    list.map(item => (
                        <View className='users_item'>
                            <Image className='users_img' src={item.avatar} />
                            <Text className='users_user'>{item.name}</Text>
                            {
                                type == '2' && (<Text className='users_time'>{item.time}</Text>)
                            }
                        </View>
                    ))
                }
            </View>
        )
    }
}