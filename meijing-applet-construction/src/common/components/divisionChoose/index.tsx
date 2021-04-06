import Taro, { Component } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { DivisionLevel, getDivisionLevel, Division, SimpleDivision, getParentDivisionCode, SUPER_DIVION_CODE} from '@common/utils/divisionUtils'
import './index.scss'

/**
 * 默认展示4级行政区
 */
const DEFAULT_SHOW_LEVELS = 4;


/**
 * 请选择
 */
const PLEASE_CHOOSE = 'PLEASE_CHOOSE';


export interface ShowDivision extends Division {
    /**
     * 是否选中
     */
    selected?: boolean;
}

interface DivsionChooseProps{
    /**
     * 传入的已选中的行政区数组
     */
    selectDivisions?: Division[];

    /**
     * 展示的行政区最大级数 默认4级
     */
    levels?: number;

    /**
     * 行政区选中后回调函数
     */
    onChoose?: (choosedDivisions: Division[]) => void;

    /**
     * 获取下级行政区列表,使用时可以判断是否需要加载下级行政区
     */
    getChildren: (divisionCode:string) => Promise<Taro.request.Promised<any>>;
}



interface DivsionChooseState {
    /**
     * 已选择的行政区列表（按省、市、区、乡镇顺序存入）
     */
    selectDivisions: Division[];

    /**
     * 用于区分selectDivisions的显示，可以是行政区编码 或 PLEASE_CHOOSE
     */
    selectedDivsionCode: string;

    /**
     * 是否展示请选择
     */
    pleaseChoose:boolean;

    /**
     * 当前组件展示的行政区列表
     */
    divisionShowList: ShowDivision[];

    /**
    * 展示的行政区最大级  参考: DivisionLevel
    */
    maxDivisionLevel: number;
}


export default class DivisionChoose extends Component<DivsionChooseProps, DivsionChooseState>{
    static externalClasses = ['class-name']

    static defaultProps = {
        selectDivisions: [],
        levels: DEFAULT_SHOW_LEVELS,
        onChoose: () => {},
        getChildren: () => {},
    }

    constructor(props) {
        super(props);
       
        this.state = {
            selectDivisions: [],
            pleaseChoose: false,
            divisionShowList: [],
            maxDivisionLevel: DivisionLevel.TOWN,
            selectedDivsionCode: PLEASE_CHOOSE,
        };
    }

    componentWillMount() {
    }

    async componentDidMount() {
        let { levels, selectDivisions, getChildren } = this.props;

        levels = levels || DEFAULT_SHOW_LEVELS;

        let selectDivision;
        let selectedDivsionCode;
        let parentDivisionCode = SUPER_DIVION_CODE;

        selectDivisions = selectDivisions || [];

        if(selectDivisions && selectDivisions.length>0){
            selectDivision = selectDivisions[selectDivisions.length-1];
            parentDivisionCode = getParentDivisionCode(selectDivision.code);
            selectedDivsionCode = selectDivisions.length < levels ? PLEASE_CHOOSE: selectDivision.code;
        }else{
            selectedDivsionCode = PLEASE_CHOOSE;
        }

        try {
            const resp = await getChildren(parentDivisionCode);
            const divisionShowList = this.setSelectedInShowList(resp.data,selectDivision);

            this.setState({
                selectDivisions: selectDivisions,
                pleaseChoose: divisionShowList.length>0  && selectDivisions.length < levels,
                divisionShowList: divisionShowList,
                maxDivisionLevel: this.getDivisionLevelWithLevels(levels) || DivisionLevel.TOWN,
                selectedDivsionCode: selectedDivsionCode,
            });
        } catch (error) {
        }
    }


    /**
     * 获取行政区几级level
     * @param levels 几级
     */
    getDivisionLevelWithLevels(levels: number): number {
        if (!levels || levels <= 0) {
            return DivisionLevel.TOWN;
        }

        let i = 0;
        let divisionLevel;
        for (let key in DivisionLevel) {
            if (i < levels) {
                divisionLevel = DivisionLevel[key];
            }
            i++;
        }
        return divisionLevel;
    }

    /**
     * 选中行政区
     * @param division 行政区
     */
    async chooseDivision(division: SimpleDivision) {
        const {getChildren} = this.props;
        let { selectDivisions, maxDivisionLevel, divisionShowList } = this.state;

        const level = getDivisionLevel(division.code);
        
        if (selectDivisions && selectDivisions.length > 0) {
            
            let lastSelectDivision: Division = selectDivisions[selectDivisions.length - 1];
            const lastLevel = getDivisionLevel(lastSelectDivision.code);

            if (level == lastLevel) {
                //判断如果是同级切换，则更改selectDivisions的最后一个
                selectDivisions.pop();

                if(level == maxDivisionLevel){
                    selectDivisions.push({
                        name: division.name,
                        code: division.code,
                        status: division.status,
                    });

                    this.setState({
                        selectDivisions: selectDivisions,
                        divisionShowList: this.setSelectedInShowList(divisionShowList,division),
                        selectedDivsionCode: division.code,
                        pleaseChoose: false,
                    });

                    this.onChooseCallBack(selectDivisions);
                    return;
                }
            }else if(level < lastLevel){
                //先删除selectDivisions中>=level的divsion，然后push当前选中的division，divisionShowList重新获取
                while(true){
                    let last = selectDivisions.pop();
                    if(!last || getDivisionLevel(last.code)==level){
                        break;
                    }
                }
            }
        }

        selectDivisions.push({
            name: division.name,
            code: division.code,
            status: division.status,
        });

        if (level >= maxDivisionLevel) {
            //不加载下级
            this.setState({
                selectDivisions: selectDivisions,
                divisionShowList: this.setSelectedInShowList(divisionShowList,division),
                selectedDivsionCode: division.code,
                pleaseChoose: false,
            });
        } else {
            //获取下级行政区
            const childData = await getChildren(division.code);

            if(childData.data && childData.data.length>0){
                this.setState({
                    selectDivisions: selectDivisions,
                    divisionShowList: childData.data,
                    selectedDivsionCode: PLEASE_CHOOSE,
                    pleaseChoose: true,
                });
            }else{
                //未获取到下级行政区，不加载下级
                this.setState({
                    selectDivisions: selectDivisions,
                    divisionShowList: this.setSelectedInShowList(divisionShowList,division),
                    selectedDivsionCode: division.code,
                    pleaseChoose: false,
                });
            }
        }
        this.onChooseCallBack(selectDivisions);
    }

    /**
     * 切换到已选择的行政区
     * @param division 行政区
     */
    async switchDivision(division: Division){
        const {getChildren} = this.props;
        let { selectDivisions, selectedDivsionCode} = this.state;

        if(!selectDivisions || selectDivisions.length == 0 || division.code == selectedDivsionCode){
            return;
        }

        const divisionCode = division.code;

        //点击上级已选中行政区，获取同级行政区列表，改变divisionShowList
        let parentDivisionCode = getParentDivisionCode(divisionCode);

        const childData = await getChildren(parentDivisionCode);
        this.setState({
            divisionShowList: this.setSelectedInShowList(childData.data,division),
            selectedDivsionCode: division.code,
        });
    }

    /**
     * 点击请选择
     */
    async pleaseChooseClick(){
        const {getChildren} = this.props;
        const { selectDivisions, selectedDivsionCode } = this.state;

        if(selectedDivsionCode == PLEASE_CHOOSE || !selectDivisions
             || selectDivisions.length==0){
            return;
        }

        const parentDivisionCode = selectDivisions[selectDivisions.length-1].code;
        const childData = await getChildren(parentDivisionCode);
        this.setState({
            divisionShowList: childData.data,
            selectedDivsionCode: PLEASE_CHOOSE,
        });

    }

    /**
     * 展示的division列表 选中项顺序、标记设置
     * @param divisionShowList 展示的division列表
     * @param selectDivision 需要选中的division
     */
    setSelectedInShowList(divisionShowList:ShowDivision[],selectDivision:ShowDivision):ShowDivision[]{

        if(!selectDivision){
            return divisionShowList;
        }

        if(!divisionShowList || divisionShowList.length == 0){
            return [];
        }

        for(let i=0;i<divisionShowList.length;i++){
            divisionShowList[i].selected = divisionShowList[i].code == selectDivision.code;
        }
        return divisionShowList;
    }


    /**
     * 选中行政区变化时的回调函数
     * @param selectDivisions 
     */
    onChooseCallBack(selectDivisions:Division[]){
        const { onChoose } = this.props;
        if (onChoose) {
            onChoose(selectDivisions);
        }
    }


    render() {
        const { divisionShowList, selectDivisions, selectedDivsionCode,pleaseChoose } = this.state;
        let { levels} = this.props;

        if (!levels) {
            levels = DEFAULT_SHOW_LEVELS;
        }

        if (!divisionShowList || divisionShowList.length == 0) {
            return <View className='divisionChooseComponent'></View>
        }
        
        const showDivisionList = divisionShowList && divisionShowList.length > 0 ?
            divisionShowList.map((division) => {
                return (
                    <View key={division.code} className={division.selected ? 'division_item selected':'division_item'} onClick={this.chooseDivision.bind(this, division)}>
                        <Text>{division.name}</Text>
                    </View>
                )
            }) : '';

        const showSelectedDivisionInView = selectDivisions && selectDivisions.length > 0 ?
            selectDivisions.map((division) => {
                return  <View key={division.code} className='division'>
                            <Text className={selectedDivsionCode==division.code?'division_text border_bootom':'division_text' } onClick={this.switchDivision.bind(this, division)} >{division.name}</Text>
                        </View>
            }) : '';

        const showPleaseChoose = pleaseChoose ?
            <View className='choose_view' style={{ position: `${selectDivisions.length == 0 ? 'relative' : 'absolute'}` }} onClick={this.pleaseChooseClick.bind(this)}>
                <Text className='choose'>请选择</Text>
                {selectedDivsionCode == PLEASE_CHOOSE ? <View className='border_bootom'></View> : ''}
            </View>
        :'';
    

        return (
            <View className='divisionChooseComponent' >

                <View className='middle_choose'>
                    {showSelectedDivisionInView}
                    {showPleaseChoose}
                </View>

                <ScrollView
                    className='division_list class-name'
                    scrollY
                    scrollWithAnimation
                >
                    {
                        showDivisionList
                    }
                </ScrollView>
            </View>
        )
    }

}
