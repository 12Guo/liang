import Taro, { Component, Config } from '@tarojs/taro';
import { observer, inject } from '@tarojs/mobx';
import { View, Text } from '@tarojs/components';
import { getPollutionSourceTypeList } from '../../service/pollutionType';
import './index.scss'

interface MarkProps {
    userStore: any;
}

interface MarkState {
    pollutionTypes: any
}

@inject('userStore')
@observer
class MarkPage extends Component<MarkProps, MarkState> {
    config: Config = {
        navigationBarTitleText: '污染源类型'
    }

    static externalClasses = ['com-class']

    constructor(props) {
        super(props);

        this.state = {
            pollutionTypes: []
        }
    }

    componentDidMount() {
        this.getPollutionType();
    }

    // 污染类型
    getPollutionType = async () => {
        try {
            const res = await getPollutionSourceTypeList();
            const { data } = res;
            this.setState({
                pollutionTypes: data
            })
        }
        catch (err) { console.log(err) }
    }

    onAdd = (pollution) => {
        Taro.navigateTo({
            url: `./add?id=${pollution.id}`
        })
    }

    render() {
        const { pollutionTypes } = this.state;
        return (
            <View className='mark-page'>
                <View className='mark-page_header'>
                    <Text className='header_title'>选中污染源类型</Text>
                </View>
                <View className='mark-page_body'>
                    {
                        pollutionTypes.map(pollution => (
                            <View key={pollution.id} className='mark_item' onClick={this.onAdd.bind(this, pollution)}>
                                <Text className='txt'>{pollution.name}</Text>
                            </View>
                        ))
                    }
                </View>
            </View>
        );
    }
}

export default MarkPage;