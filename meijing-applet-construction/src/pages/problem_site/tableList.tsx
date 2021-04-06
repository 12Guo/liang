import Taro, { Component } from '@tarojs/taro';
import { View } from '@tarojs/components'
import DateSelect from '@common/components/DateSelect/index'
import Table from '@common/components/Table/index'
import { department } from '../../service/statistics'
import './tableList.scss'
import moment from 'moment'
interface MyProps { }

interface MyState {
    startDate: number,
    endDate: number,
    departmentData:any,
    parseDepartData: any
}

class Index extends Component<MyProps, MyState> {

    constructor(props) {
        super(props)
        this.state = {
            startDate: moment(Date.now()).startOf('days').valueOf(),
            endDate: moment(Date.now()).endOf('days').valueOf(),
            departmentData: {},
            parseDepartData: []
        }
    }

    componentWillMount() { }

    componentDidMount() {
        this.getInitData(this.$router.preload.time)
    }

    getInitData = async (time) => {
        const resp = await department(time)
        this.setState({
            departmentData: resp.data,
            startDate: time.startTime ,
            endDate: time.endTime ,
            parseDepartData: []
        },()=>{
            this.parseDepartmentData()
        })
    }

    // 解析表格的数据，并传给表格进行渲染
    parseDepartmentData = () => {
        let { departmentData, parseDepartData } = this.state
        const type = { department: '',data:[] }

        departmentData.forEach((item, index) => {
            parseDepartData.push(Object.assign({},type))

            parseDepartData[index]['department'] = item.departmentName
            parseDepartData[index].data = []

            parseDepartData[index].data.push(item.disposalNum)
            parseDepartData[index].data.push(item.unDisposalNum)
            parseDepartData[index].data.push(item.disposalRate)
            parseDepartData[index].data.push(item.constructionSiteNum)
            parseDepartData[index].data.push(item.problemConstructionSiteNum)
            parseDepartData[index].data.push(item.problemConstructionSiteRate)
            parseDepartData[index].data.push(item.superviseNum)
            parseDepartData[index].data.push(item.incidentNum)
        });

        this.setState({
            parseDepartData
        })
    }

    // 传入日期组件中的方法
    onConfirm = async(startDate, endDate) => {
        this.setState({
            startDate,
            endDate
        })

        let param = {startTime: startDate,endTime: endDate}
        this.getInitData(param)
    }

    config = {
        navigationBarTitleText: '部门管辖'
    };

    render() {
        const { startDate, endDate,parseDepartData} = this.state
        return (
            <View>
                <View className="date_select">
                    <DateSelect startDate={startDate} endDate={endDate} onConfirm={this.onConfirm}></DateSelect>
                </View>
                <Table devideNum={10} data={parseDepartData} tableTitle={["处理数", "未处理数", "处理率", "工地数", "问题工地数", "问题工地比例","监督数","事件数"]} pullDown={true}>

                </Table>

            </View>
        );
    }
}
export default Index