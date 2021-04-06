import Taro, { PureComponent } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import PieChart from '@common/components/PieChart'

import './today-item.scss'


interface TodayItemProps {
    data: any;
}

interface TodayItemState {

}

export default class TodayItem extends PureComponent<TodayItemProps, TodayItemState> {
    constructor(props) {
        super(props)
        this.state = {

        }
    }
    refPieChart = (node) => this.pieChart = node

    componentDidMount() {
        const chartData = [
            { value: 335, name: '直接访问' },
            { value: 310, name: '邮件营销' },
            { value: 234, name: '联盟广告' },
            { value: 135, name: '视频广告' },
            { value: 1548, name: '搜索引擎' }
        ];
        setTimeout(()=>{
            this.pieChart.refresh(chartData);
        },500)
        
    }

    render() {
        return (
            <View className='today-item'>
                <View className="pie-chart">
                    <PieChart ref={this.refPieChart} />
                </View>
            </View>
        )
    }
}