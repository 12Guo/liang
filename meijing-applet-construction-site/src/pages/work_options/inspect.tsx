import Taro, { Component } from '@tarojs/taro';
import { View, Text, Block } from '@tarojs/components'
import FilterTabs from '@common/components/FilterTabs/index'
import EventList from '@common/components/List/eventList'
import './inspect.scss'
import { rootConstructionSourceBaseUrl } from '@common/utils/requests'

const img1 = `${rootConstructionSourceBaseUrl}/assets/pages/work/video.png`
interface MyProps {

}

interface MyState {
    isMore: boolean,
    pollutionTypeList: Array<FilterTabsType>,
    pollutionActiveId: string
}

interface FilterTabsType {
    id: string | number,
    name: string
}

class Index extends Component<MyProps, MyState> {
    constructor(props) {
        super(props)
        this.state = {
            isMore: false,
            pollutionTypeList: [{ id: 0, name: '全部在线' }, { id: 1, name: '全部离线' }, { id: 2, name: '部分离线' }],
            pollutionActiveId: ''
        }
    }

    config = {
        navigationBarTitleText: '整改督查'
    };

    onToggleMoreHandle = () => {

    }

    onTabItemChange = (item) => {
        if (item.id == this.state.pollutionActiveId) {
            return;
        }

        this.setState({
            pollutionActiveId: item.id,
            isMore: false
        })
    }

    render() {
        const { isMore, pollutionTypeList, pollutionActiveId } = this.state
        return (
            <View>
                {/* tabs切换栏 */}
                <FilterTabs
                    isMore={isMore}
                    data={pollutionTypeList}
                    tabId={pollutionActiveId}
                    onMore={this.onToggleMoreHandle}
                    onTab={this.onTabItemChange}
                    showFilter={true}
                />

                <View className="history_list">
                    <EventList data={[{
                        imgFlag: img1,
                        title: '中心片区改造',
                        isUrgent: true,
                        content: '#裸土未覆盖、#道路未硬化、#未湿发处理、#进出口无冲洗设备',
                        tag: '住建局',
                        name: '巡查员：赵泉泉',
                        img: img1,
                        time: '37分钟前'
                    }]}>

                    </EventList>
                </View>


            </View>
        );
    }
}
export default Index