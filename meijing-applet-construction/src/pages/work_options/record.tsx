import Taro, { Component } from '@tarojs/taro';
import { View, Text, Button, Image, Input } from '@tarojs/components'
import ListView from '@common/components/ListView'
import { getSiteRecords } from '../../service/workbench'
import './record.scss'
import isEmpty from 'lodash/isEmpty'
import EmptyHolder from '@common/components/EmptyHolder'

import { rootConstructionSourceBaseUrl } from '@common/utils/requests'

const search = `${rootConstructionSourceBaseUrl}/assets/pages/work/search.png`

interface MyProps {

}

interface MyState {
    data: InfoType[]
    paramQuery: any,

    isInit: boolean,
    hasMore: boolean,
    isLoading: boolean
}

interface InfoType {
    id: number,
    name: string,
    // 部门
    superviseDepartmentName: string,
    // 部门id
    superviseDepartmentId: number,
    // 施工类别
    type: string,
    // 施工状态
    status: string,
}

const siteType = { CONSTRUCTION_SITE: '建筑工地', DEMOLITION_SITE: '拆迁工地', a: '123123' }


class Index extends Component<MyProps, MyState> {
    constructor(props) {
        super(props)
        this.state = {
            data: [],
            // 当前页
            paramQuery: {
                keywords: '',
                offset: 0,
                limit: 20,
            },
            isInit: true,
            hasMore: true,
            isLoading: true,
        }
    }

    componentDidMount() {
        this.fetchList()
    }

    config = {
        navigationBarTitleText: '工地档案'
    };

    // 获取列表
    fetchList = (callback?: any) => {
        const { paramQuery, isInit, data } = this.state;
        getSiteRecords({ ...paramQuery }).then(res => {
            const { data: { entries = [] } } = res;
            let newList = entries;
            if (!isInit) {
                newList = data.concat(newList);
            }
            this.setState({
                data: newList,
                isLoading: false,
                isInit: false,
                hasMore: entries.length == paramQuery.limit,
                paramQuery: {
                    ...paramQuery,
                    offset: paramQuery.offset + paramQuery.limit,
                }
            }, () => {
                if (callback) {
                    callback();
                }
            });
        }).catch(res => {
            if (callback) {
                callback();
            }
        });
    }

    // 刷新回调函数
    onRefresh = () => {
        const { paramQuery } = this.state;
        this.setState({
            paramQuery: {
                ...paramQuery,
                offset: 0
            },
            data: []
        }, () => {
            this.fetchList();
        })
    }

    // 跳转到工地详情页面
    onNaviToDetails(item) {
        Taro.navigateTo({
            url: `/pages/pollution-manage/detail?id=${item.id}`
        })
    }

    // 处理input的onChange
    handleChange = (e) => {
        const { paramQuery } = this.state
        this.setState({
          data: [],
          paramQuery: {
            ...paramQuery,
            keywords: e.detail.value,
            offset: 0
          },
          hasMore: true,
          isLoading: true
        }, this.fetchList)    
    }

    render() {
        const { data,hasMore,isLoading} = this.state
        const isEmptyData = !data || data.length === 0

        const showEmpty = (<View className='empty'><EmptyHolder text='暂无数据' /></View>)

        const showList = data.map((item, index) => {
            return (
                <View className="content" onClick={this.onNaviToDetails.bind(this,item)}>
                    <View className="content_box">
                        <View className="flex_row_between">
                            <Text className="txt3">{item.name}</Text>
                            {
                                item.status ? item.status === '完工' ?
                                    <Text className="txt4">{item.status}</Text>
                                    : <Text className="txt7">{item.status}</Text>
                                    : ''
                            }
                        </View>
                        <View className="box1">
                            <Text className="txt5">
                                {item.type ? siteType[item.type] : ''}
                            </Text>
                        </View>
                        <Text className="txt6">
                            监管部门：{item.superviseDepartmentName ? item.superviseDepartmentName : ''}
                        </Text>

                    </View>
                </View>
            )
        })

        return (
            <View>
                {/* 筛选 */}
                <View className="header">
                    <View className="search_input">
                        <Image src={search} className="img2"></Image>
                        <Input placeholder="搜索工地名称" placeholderClass="txt2" className="site_input" onInput={this.handleChange}></Input>
                    </View>
                </View>
                {/* 列表展示部分 */}
                <ListView
                    com-class='body'
                    hasMore={hasMore}
                    hasData={!isEmpty(data)}
                    showLoading={isLoading}
                    onRefresh={this.onRefresh}
                    onEndReached={this.fetchList}
                >
                    {isEmptyData ? showEmpty : showList}
                </ListView>

            </View>
        );
    }
}
export default Index
