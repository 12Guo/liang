import Taro, { Component } from '@tarojs/taro'
import { Image } from '@tarojs/components'
import { checkedImage, uncheckedImage } from '../../utils/common'


interface RadioProps {
    /**
     * 是否选中
     */
    checked?: boolean,

    checkedImage?: string,

    uncheckedImage?: string,

    /**
     * 点击事件
     */
    onClick?: (checked: boolean) => void,
}

interface RadioState {
    checked: boolean,
    checkedImage: string,
    uncheckedImage: string,
}

export default class RadioButton extends Component<RadioProps, RadioState>{
    static externalClasses = ['class-name']

    constructor(props) {
        super(props);

        this.setState({
            checked: props.checked || false,
            checkedImage: props.checkedImage || checkedImage,
            uncheckedImage: props.uncheckedImage || uncheckedImage,
        });
    }

    static defaultProps = {
        checked: false,
        checkedImage: checkedImage,
        uncheckedImage: uncheckedImage,
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.checked != this.props.checked) {
            this.setState({
                checked: nextProps.checked
            })
        }
    }

    click() {
        const { onClick } = this.props;
        let { checked } = this.state;

        checked = !checked;
        this.setState({
            checked: checked,
        });

        if (onClick) {
            onClick(checked);
        }
    }

    render() {
        const { checked, checkedImage, uncheckedImage } = this.state;

        return (
            <Image className='class-name' src={checked ? checkedImage : uncheckedImage} onClick={this.click.bind(this)}></Image>
        )
    }
}