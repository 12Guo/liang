import Taro, {Component, Config } from '@tarojs/taro';
import { View } from '@tarojs/components'
import './table.scss'
import Table from '@common/components/Table/index'
import {getData} from '@common/components/Table/data'

interface MyProps{
}

interface MyState{
    title: string,
    data: any,
    tableTitle: any,
    downloadTitle: boolean,
    sumFlag: boolean
}

class Index extends Component<MyProps,MyState> {

    constructor(props){
        super(props)
        this.state={
            // 标题
            title: '部门处置情况',
            // 模拟数据
            data: getData,
            // 是否
            // table的标题
            tableTitle: ['巡查员人数','应该巡查数','巡查数','测试1','测试2'],
            // 下载功能按钮
            downloadTitle: true,
            // 合计
            sumFlag: true
        }
    }

    componentWillMount() {}

    componentDidMount() {}

    componentDidShow() {}

    componentDidHide() {}

    config: Config = {
        navigationBarTitleText: 'Table排序组件'
    };

    render() {
        const {title, data, tableTitle} = this.state

        return (
            <View>
                <Table  title={title}  data={data} tableTitle={tableTitle}></Table>
            </View>
        );
    }
}
export default Index