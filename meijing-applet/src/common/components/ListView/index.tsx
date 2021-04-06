import Taro, { Component } from '@tarojs/taro'
import { View, Text, ScrollView, Block } from '@tarojs/components'
import { AtActivityIndicator } from 'taro-ui'
import cn from 'classnames'
import './index.scss'
import FpiLoading from '../FpiLoading'
import Loading from '../FpiLoading/loading'

interface ListViewProps {
    /**
     * 加载更多函数
     */
    onEndReached: (callback?: () => void) => void,
    /**
     * 下拉刷新操作
     */
    onRefresh: () => void,
    /**
     * 是否存在更多
     */
    hasMore: boolean,
    /**
     * 距离底部多远时触发上拉操作
     */
    lowerThreshold?: number,
    /**
     * 是否存在数据
     */
    hasData?: boolean,
    /**
     * 是否显示内容模块的loading效果
     */
    showLoading?: boolean,
}

interface ListViewState {
    dargStyle: any;
    downDragStyle: any;
    start_p: any;
    scrollY: any;
    dargState: any;
    isLoading: boolean;
    loadMore: boolean;
}

export default class ListView extends Component<ListViewProps, ListViewState> {
    static externalClasses = ['com-class']

    static defaultProps = {
        hasMore: true,
        lowerThreshold: 50
    }

    constructor(props) {
        super(props)
        this.state = {
            dargStyle: {            //下拉框的样式
                top: 0 + 'px'
            },
            downDragStyle: {        //下拉图标的样式
                height: 0 + 'px'
            },
            start_p: {},
            scrollY: true,
            dargState: 0,           //刷新状态 0不做操作 1刷新 -1加载更多
            isLoading: false,
            loadMore: false,
        }
    }

    reduction() {
        //还原初始设置
        const time = 0.5;
        this.setState({
            dargState: 0,
            dargStyle: {
                top: 0 + 'px',
                transition: `all ${time}s ease-in`
            },
            downDragStyle: {
                height: 0 + 'px',
                transition: `all ${time}s ease-in`
            },
            isLoading: true
        });
        
        setTimeout(() => {
            this.setState({
                dargStyle: {
                    top: 0 + 'px',
                },
                downDragStyle: {
                    height: 0 + 'px',
                },
                scrollY: true,
                isLoading: false
            })
        }, time * 500);
    }

    touchStart(e) {
        this.setState({
            start_p: e.touches[0]
        })
    }

    touchmove(e) {
        let move_p = e.touches[0],                      //移动时的位置
            deviationX = 0.30,                          //左右偏移量(超过这个偏移量不执行下拉操作)
            deviationY = 50,                            //拉动长度（低于这个值的时候不执行）
            maxY = 100;                                 //拉动的最大高度

        let start_x = this.state.start_p.clientX,
            start_y = this.state.start_p.clientY,
            move_x = move_p.clientX,
            move_y = move_p.clientY;

        //得到偏移数值
        let dev = Math.abs(move_x - start_x) / Math.abs(move_y - start_y);
        if (dev < deviationX) {                             //当偏移数值大于设置的偏移数值时则不执行操作
            let pY = Math.abs(move_y - start_y) / 1.05;     //拖动倍率
            if (move_y - start_y > 0) {
                //下拉操作
                if (pY >= deviationY) {
                    this.setState({ dargState: 1 })
                } else {
                    this.setState({ dargState: 0 })
                }
                if (pY >= maxY) {
                    pY = maxY
                }
                this.setState({
                    dargStyle: {
                        top: pY + 'px',
                    },
                    downDragStyle: {
                        height: pY + 'px'
                    },
                    scrollY: false                      //拖动的时候禁用
                })
            }
            else if (start_y - move_y > 0 && this.props.hasMore) {
                //上拉操作
                // if (pY >= deviationY) {
                //     this.setState({ dargState: -1})
                // } else {
                //     this.setState({ dargState: 0 })
                // }
                // if (pY >= maxY) {
                //     pY = maxY
                // }
                // this.setState({
                //     dargStyle: {
                //         top: -pY + 'px',
                //     },
                //     upDragStyle: {
                //         height: pY + 'px'
                //     },
                //     scrollY: false                      //拖动的时候禁用
                // })
            }

        }
    }

    down() {
        //下拉
        this.props.onRefresh()
    }

    ScrollToUpper() {
        //滚动到顶部事件
    }

    ScrollToLower(event: any) {
        //滚动到底部事件
        this.setState({
            scrollY: false,
            loadMore: true,
        },()=>{
            this.props.onEndReached(()=>{
                this.setState({
                    scrollY: true,
                    loadMore: false,
                });
            });
        });
    }

    touchEnd() {
        if (this.state.dargState === 1) {
            this.down();
            this.reduction();
        }else{
            if(!this.state.loadMore){
                this.setState({
                    dargStyle: {
                        top: 0 + 'px',
                    },
                    downDragStyle: {
                        height: 0 + 'px',
                    },
                    scrollY: true,
                    isLoading: false
                });
            }
        }
    }

    render() {
        let { dargStyle, downDragStyle, isLoading, loadMore } = this.state;
        const { lowerThreshold, hasMore, hasData = true, showLoading = false } = this.props;

        let loadMoreTxt:string = '数据加载中···';
        if(!hasMore && hasData){
            loadMoreTxt = '没有更多了';
        }

        return (
            <View className='list-view com-class'>       
                <View className='list-view__container'>                 
                    <View className='list-view__header' style={downDragStyle}>
                        <FpiLoading isLoading={isLoading} />
                    </View>
                    <ScrollView
                        style={dargStyle}
                        lowerThreshold={lowerThreshold}
                        onTouchMove={this.touchmove}
                        onTouchEnd={this.touchEnd}
                        onTouchStart={this.touchStart}
                        onScrollToUpper={this.ScrollToUpper}
                        onScrollToLower={this.ScrollToLower}
                        className='list-view__body'
                        scrollY={this.state.scrollY}
                        scrollWithAnimation
                    >
                        {
                            showLoading ? <Loading /> : (
                                <View className='listContent'>
                                    <View>
                                        {this.props.children}
                                    </View>
                                    {
                                        hasData && 
                                        <View className='list-view__more'>{loadMoreTxt}</View>
                                    }
                                </View>
                            )
                        }
                    </ScrollView>
                </View>
            </View>
        )
    }
}