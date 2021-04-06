import Taro, { Component } from '@tarojs/taro';
import { View, Image, Text, ScrollView } from '@tarojs/components'
import { rootSourceBaseUrl } from '@common/utils/requests'
import './index.scss'
import isEmpty from 'lodash/isEmpty'
import EmptyHolder from '../EmptyHolder'

const sort_down = `${rootSourceBaseUrl}/assets/components/Table/sort_down.png`
const unsort_down = `${rootSourceBaseUrl}/assets/components/Table/unsort_down.png`
const sort_up = `${rootSourceBaseUrl}/assets/components/Table/sort_up.png`
const unsort_up = `${rootSourceBaseUrl}/assets/components/Table/unsort_up.png`
const download = `${rootSourceBaseUrl}/assets/components/Table/download.png`
const more = `${rootSourceBaseUrl}/assets/components/Table/more.png`
const less = `${rootSourceBaseUrl}/assets/components/Table/less.png`

interface Props {
    title?: string,
    data: any,
    tableTitle: any,
    downloadFlag?: boolean,
    sumFlag?: boolean,
    pullDown?: boolean
    onToMore?: () => void,
    devideNum?: number
}

interface State {
    // 上下的排序开关
    sortFlag: number,
    // 查看更多开关
    moreFlag: boolean,
    data: any,
    currentData: any,
    currentSortIndex: number,
    devideNum: number
}

interface Sum {
    department: String,
    data: number[]
}

let sumColumn: Sum = {
    department: '合计',
    data: []
}

class Index extends Component<Props, State> {

    static defaultProps = {
        downloadFlag: false,
        sumFlag: false,
        pullDown: false
    }

    constructor(props) {
        super(props)
        this.state = {
            sortFlag: 0,
            moreFlag: false,
            data: props.data,
            currentData: [],
            currentSortIndex: -1,
            devideNum: props.devideNum || 5
        }
    }

    onSort = (index: number) => {
        let { sortFlag, moreFlag, devideNum } = this.state

        let data = JSON.parse(JSON.stringify(this.state.data))

        sortFlag = (sortFlag + 1) % 3
        if (sortFlag === 0) {

            if (moreFlag) {
                this.setState({
                    currentData: data,
                    sortFlag,
                    currentSortIndex: index
                })
            } else {
                this.setState({
                    currentData: data.slice(0, devideNum),
                    sortFlag,
                    currentSortIndex: index
                })
            }

        } else if (sortFlag === 1) {
            if (moreFlag) {
                this.setState({
                    currentData: this.sort(data, index),
                    sortFlag,
                    currentSortIndex: index
                })
            } else {
                this.setState({
                    currentData: this.sort(data, index).slice(0, devideNum),
                    sortFlag,
                    currentSortIndex: index
                })
            }
        } else {
            if (moreFlag) {
                this.setState({
                    currentData: this.sort(data, index).reverse(),
                    sortFlag,
                    currentSortIndex: index
                })
            } else {
                this.setState({
                    currentData: this.sort(data, index).reverse().slice(0, devideNum),
                    sortFlag,
                    currentSortIndex: index
                })
            }

        }
    }

    // 排序
    sort(data, index) {
        return data.sort((a, b) => {
            return a.data[index] - b.data[index]
        });
    }

    onShowMore = () => {
        const { data } = this.state
        this.setState({
            moreFlag: true,
            currentData: data
        })

    }

    onShowLess = () => {
        const { data, devideNum } = this.state
        this.setState({
            moreFlag: false,
            currentData: data.slice(0, devideNum)
        })
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            data: nextProps.data
        }, () => {
            this.getInitData()
        })
    }

    componentDidMount() {
        this.getInitData()

    }

    getInitData() {
        let { data, devideNum } = this.state
        if (this.props.sumFlag) {
            let sum: number;
            for (let i = 0; i < data[0].data.length; i++) {
                sum = 0;
                data.forEach((item) => {
                    sum += item.data[i]
                });
                sumColumn.data.push(sum)
            };

            data.push(sumColumn)

            if (data.length <= devideNum) {
                this.setState({
                    currentData: data
                })
            } else {
                this.setState({
                    currentData: data.slice(0, devideNum)
                })
            }


        } else {
            if (data.length <= devideNum) {
                this.setState({
                    currentData: data
                })
            } else {
                this.setState({
                    currentData: data.slice(0, devideNum)
                })
            }
        }
    }

    render() {
        const { moreFlag, currentData, currentSortIndex, sortFlag, data, devideNum } = this.state
        return (
            <View>
                {
                    this.props.title &&
                    <View className="title">
                        <Text className="txt1">{this.props.title}</Text>
                        {
                            this.props.downloadFlag && <Image src={download} className="download"></Image>
                        }
                    </View>
                }
                {
                    isEmpty(currentData) ? <EmptyHolder text='暂无数据' /> :
                        <View>

                            <ScrollView className='history-table-wrap' ref='dom'
                                scrollX
                                scrollWithAnimation
                            >
                                <View className='table-box'>
                                    <View className="table flex-row">

                                        {
                                            <View>
                                                <View className="th flex-row head">
                                                    <View>部门</View>
                                                </View>
                                                {
                                                    currentData.map((item, index) => {
                                                        return <View className="td" key={index}>{item.department}</View>
                                                    })
                                                }

                                            </View>
                                        }
                                        {
                                            this.props.tableTitle.map((item, index) => {
                                                return (<View>
                                                    <View className="th" onClick={this.onSort.bind(this, index)}>
                                                        <View className='txt3'>{item}</View>
                                                        <View className="sort-box flex-col" >
                                                            <Image src={(sortFlag % 3 === 1 && currentSortIndex === index) ? sort_up : unsort_up} className="sort" ></Image>
                                                            <Image src={(sortFlag % 3 === 2 && currentSortIndex === index) ? sort_down : unsort_down} className="sort"></Image>
                                                        </View>
                                                    </View>
                                                    {
                                                        currentData.map((element, i) => {
                                                            return <View className="td" key={element.departmentId}>{index === 2 || index === 7 ? (element.data[index] * 100).toFixed(1) + '%' : element.data[index]}</View>
                                                        })
                                                    }
                                                </View>)
                                            })
                                        }
                                    </View>
                                </View>
                            </ScrollView>
                            {
                                this.props.pullDown && data.length > devideNum && <View>
                                    {
                                        !moreFlag ?
                                            <View className="footer">
                                                <View className='foot-box' onClick={this.onShowMore}>
                                                    <Text className="txt2">查看全部</Text>
                                                    <Image className="img" src={more}></Image>
                                                </View>
                                            </View>
                                            :
                                            <View className="footer">
                                                <View className='foot-box' onClick={this.onShowLess}>
                                                    <Text className="txt2">收起表格</Text>
                                                    <Image className="img" src={less}></Image>
                                                </View>
                                            </View>
                                    }
                                </View>
                            }
                            {
                                (!this.props.pullDown && data.length > devideNum) &&

                                <View className="footer">
                                    <View className='foot-box' onClick={this.props.onToMore}>
                                        <Text className="txt4">更多 ></Text>
                                    </View>
                                </View>

                            }

                        </View>
                }
            </View>

        );
    }
}
export default Index