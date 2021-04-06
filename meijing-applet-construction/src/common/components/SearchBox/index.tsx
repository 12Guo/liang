import Taro, { Component } from '@tarojs/taro'
import { View, Input } from '@tarojs/components'
import { rootSourceBaseUrl } from '../../utils/requests'
import './index.scss'


const searchImg = `${rootSourceBaseUrl}/assets/common/search.png`;

interface SearchBoxProps {
    placeholder: string,                    // 默认占位显示
    value: string,                          // 显示值
    onInput: (value: string) => void;       // 文本输入事件
}

interface SearchBoxState {

}

export default class SearchBox extends Component<SearchBoxProps, SearchBoxState> {
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    onInputChange = (e)=>{
        this.props.onInput(e.detail.value);
    }

    render() {
        const { placeholder, value } = this.props;
        return (
            <View className='search-box'>
                <Input className='input'
                    placeholderClass='input-placeholder'
                    type='text'
                    value={value}
                    placeholder={placeholder}
                    // focus={false}
                    style={{ backgroundImage: `url(${searchImg})` }}
                    onInput={this.onInputChange.bind(this)}
                />
            </View>
        )
    }
}