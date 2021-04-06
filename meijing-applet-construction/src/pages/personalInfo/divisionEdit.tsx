import Taro, { Component, Config } from '@tarojs/taro'
import { View, Text, Button } from '@tarojs/components'
import { observer, inject } from '@tarojs/mobx';
import DivisionChoose from '@common/components/divisionChoose';
import './divisionEdit.scss'
import { Division } from '@common/utils/divisionUtils'
import {getChildren,getParentDivisions} from '../../service/division'
import {navBackWithData} from '@common/utils/common'

interface DivisionEditProps {
    userStore: any;
}

interface DivisionEditState {
    /**
     * 已选择的行政区列表（按省、市、区、乡镇顺序存入）
     */
    selectDivisions: Division[];
     /**
     * 加载中
     */
    isLoading: boolean;
}


@inject('userStore')
@observer
export default class DivisionEdit extends Component<DivisionEditProps, DivisionEditState> {

    config: Config = {
        navigationBarTitleText: '更改区域',
        navigationBarBackgroundColor: '#FFFFFF',
        navigationBarTextStyle: 'black',
        backgroundColor: '#FFFFFF',
    }

    constructor(props) {
        super(props);
        this.state = {
            selectDivisions: [],
            isLoading: true,
        }
    }

    async componentWillMount() {
        let {divisionCode} = this.$router.params;

        try {
            let resp = await getParentDivisions(divisionCode);
            this.setState({ selectDivisions:resp.data.selectDivisions, isLoading:false });
        } catch (error) {
        }
    }

    componentDidMount() {
    }

    divisionChange(choosedDivisions: Division[]) {
        if (choosedDivisions && choosedDivisions.length > 0) {
            this.setState({
                selectDivisions: choosedDivisions
            });
        }
    }

    ok(){
        const { selectDivisions } = this.state;
        const division = selectDivisions[selectDivisions.length-1];
        navBackWithData({
            division_edit: division
        });
    }


    render() {
        const { selectDivisions, isLoading } = this.state;

        if (isLoading) {
            return <View className='divisionEdit'></View>
        }

        let selectedDivision;
        let selectedShowText;
        if (selectDivisions && selectDivisions.length > 0) {
            selectedDivision = selectDivisions[selectDivisions.length - 1];

            selectedShowText = selectDivisions.map((divisionSel) => {
                return <Text>{divisionSel.name}</Text>
            });
        } else {
            selectedShowText = '';
        }

        return (
            <View className='divisionEdit'>
                <View className='topView'>
                    <Text className='top_word'>我当前所在区域</Text>
                    <Text className='selected_division'>{selectedDivision ? selectedDivision.name : ''}</Text>
                </View>

                <View className='top_choosed'>
                    <Text className='division'>已选：{selectedShowText}</Text>
                </View>

                <DivisionChoose class-name='divisionChoose' selectDivisions={selectDivisions} getChildren={getChildren.bind(this)} onChoose={this.divisionChange.bind(this)} />

                <View className='button_panel'>
                    <Button className='edit_button' onClick={this.ok.bind(this)}>确定</Button>
                </View>
            </View>
        )
    }
}
