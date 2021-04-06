import Taro, { Component } from '@tarojs/taro';
import { View, Image, Text } from '@tarojs/components'
import './constructionProblem.scss'
import { rootConstructionSourceBaseUrl } from '../../utils/requests'

const img1 = rootConstructionSourceBaseUrl + "/assets/pages/statistics/buildTop.png";
const img2 = rootConstructionSourceBaseUrl + "/assets/pages/statistics/buildEnd.png";

interface MyProps {
    data: InfoType[],
    onClick?: (item: any) => void
}

interface MyState {

}

interface InfoType {
    name: string,
    superviseDepartmentName: string,
    problemNum: number,
    disposalRate: number,
    superviseDepartmentId: number
    pollutionSourceId: number
}

class Index extends Component<MyProps, MyState>{
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    // 跳转到异常问题页面
    onNaviQuestion(item) {
        const { onClick } = this.props
        onClick && onClick(item)
        // Taro.navigateTo({
        //     url: `/pages/pollution-manage/question?id=${item.pollutionSourceId}&name=${item.name}`
        // })

    }

    render() {
        const { data = [] } = this.props
        return (
            data.map((item, index) => {
                return <View className={`flex_row ${index === data.length - 1 ? "" : "border_bottom"}`}
                    onClick={
                        this.onNaviQuestion.bind(this, item)
                    } key={item.pollutionSourceId + 998 * index}>
                    <Image className="image_style" src={index < 3 ? img1 : img2}></Image>
                    <View className="flex_col box1">
                        <Text className="text1">{item.name}</Text>
                        <Text className="text2">监管部门：{item.superviseDepartmentName === null ? '无' : item.superviseDepartmentName}</Text>
                    </View>
                    <View className="flex_col box2">
                        <Text className="text3">{item.problemNum}</Text>
                        <Text className="text2">问题数</Text>
                    </View >
                    <View className="flex_col box2">
                        <Text className="text4">{(100 * (item.disposalRate || 0)).toFixed(0) + '%'}</Text>
                        <Text className="text2">处置率</Text>
                    </View>
                    {/* <View className="devide_line"></View> */}
                </View>
            })

        );
    }
}
export default Index