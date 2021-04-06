import Taro, { Component } from '@tarojs/taro';
import { View, Input, ScrollView, Text } from '@tarojs/components'
import './index.scss'
import RadioButton from '@common/components/radioButton'
import { treeByTenantCode } from '../../service/department'
import isEmpty from 'lodash/isEmpty'

interface DepartmentProps {
    divisionCode: string,
    onOkHandle: (selected: any) => void;
    otherDepartment?: boolean;
}

interface DepartmentState {
    departmentList: any,
    path: any,
    searchShow: Boolean,
    searchList: [],
    checkName: string,
    temp: {}
}


class Index extends Component<DepartmentProps, DepartmentState> {

    constructor(props) {
        super(props)
        this.state = {
            // 所有的部门列表
            departmentList: {
                name: "一级部门",
                children: []
            },
            // 当前选择的多级路由
            path: [],
            // 是否打开搜索
            searchShow: false,
            searchList: [],
            checkName: '',
            temp: {}
        }
    }

    // 初始化department数据
    getInitData = async () => {
        const { departmentList } = this.state;
        const { divisionCode, otherDepartment } = this.props;
        const departmentData = await treeByTenantCode(divisionCode)
        if(otherDepartment){
            departmentList.children = departmentData.data.concat({name: "其它部门", code: "-1", id: "-1", children: [], parentCode: null, parentId: null});
        } else {
            departmentList.children = departmentData.data;
        }

        this.initDepartmentList(departmentList)

        this.setState({
            departmentList,
            path: [departmentList]
        })
    }

    // 点击下级事件
    nextChild = (item) => {
        const { path } = this.state
        path.push(item)

        this.initPath(path)

        this.setState({
            path
        })
    }

    onTab = (index: number) => {
        let { path } = this.state
        this.setState({
            path: path.slice(0, index + 1)
        })
    }

    onChecked = (item: any) => {
        const { path } = this.state
        this.initPath(path)

        if (item.name === this.state.checkName) {
            this.setState({
                checkName: '',
                path,
                temp: {}
            })
        } else {
            this.findChecked(item.name, path[path.length - 1])
            this.setState({
                path,
                checkName: item.name,
                temp: item
            })
        }
    }

    onSelect = (item: any) => {
        const { searchList } = this.state
        this.initSearchList(searchList)

        if (item.name === this.state.checkName) {
            this.setState({
                checkName: '',
                searchList,
                temp: {}
            })
        } else {

            this.findSearch(item.name, searchList)
            this.setState({
                searchList,
                checkName: item.name,
                temp: item
            })
        }
    }



    findChecked = (word: string, data) => {
        if (data.name === word) {
            if (data.check) {
                data.check = false
            } else {
                data.check = true
            }
        }


        if (!isEmpty(data.children)) {
            for (let child of data.children) {
                this.findChecked(word, child)
            }
        }
    }

    findSearch(word: string, data) {
        for (let item of data) {
            if (item.name === word) {
                if (item.check) {
                    item.check = false
                } else {
                    item.check = true
                }
            }
        }
    }

    initDepartmentList = (node) => {
        node.check = false

        if (!isEmpty(node.children)) {
            for (let child of node.children) {
                this.initDepartmentList(child)
            }
        }
    }

    initSearchList(node) {
        for (let item of node) {
            item.check = false
        }
    }

    initPath = (path) => {
        for (let i = 0; i <= path.length - 1; i++) {
            this.initDepartmentList(path[i])
        }
    }

    handleSearch = (e) => {
        const { path, searchList } = this.state
        let value = e.target.value
        this.initDepartmentList(path[0])

        if (value && value.trim() != '') {
            const searchKey = value.trim();

            const list = getNodeByKeyWord(searchKey, path[0], searchList)
            this.setState({
                searchList: list,
                searchShow: true,
                checkName: searchKey,
                path
            });
        } else {
            this.setState({
                searchShow: false,
                searchList: [],
                checkName: '',
                path
            });
        }

    }

    confirm = () => {
        const { onOkHandle } = this.props
        const { temp } = this.state
        console.log(temp)
        onOkHandle(temp)
    }

    componentWillMount() {
        this.getInitData()
    }

    componentDidMount() { }

    componentDidShow() { }

    componentDidHide() { }

    render() {

        const { path, searchShow, searchList } = this.state;

        return (

            <View>
                <View className="search-box">
                    <Input
                        placeholderClass="place-holder"
                        className="search-input"
                        type="text"
                        placeholder="请输入"
                        onInput={this.handleSearch.bind(this)}
                    />
                </View>
                {
                    !searchShow && <View className="hr-tag"></View>

                }
                {
                    !searchShow &&
                    <ScrollView scrollX scrollWithAnimation>
                        <View className="path" >
                            {
                                path.map(function (item, index) {
                                    const isLine = (index === path.length - 1)
                                    return <View
                                        onClick={this.onTab.bind(this, index)}
                                        className={isLine ? 'path__item' : 'path__item--nav'}
                                    >{item.name}</View>
                                })
                            }
                        </View>
                    </ScrollView>
                }

                {!searchShow && path[path.length - 1] &&
                    (path[path.length - 1].children || []).map(function (item, index) {
                        return (
                            <View key={item.id} className="department-list flex-row" >
                                <View onClick={this.onChecked.bind(this, item)}>
                                    <RadioButton class-name='radio' checked={item.check} />
                                </View>
                                <Text className="txt">{item.name}</Text>
                                {
                                    item.children.length > 0 &&
                                    <View className="flex-row-center" onClick={this.nextChild.bind(this, item)}>
                                        <View className="icon"></View>
                                        <Text>下级</Text>
                                    </View>
                                }

                            </View>
                        )
                    })
                }

                {
                    !searchShow && <View className="kong"></View>
                }
                {
                    searchShow &&
                    searchList.map(function (item:any, index) {
                        return (
                            <View className="department-list flex-row">
                                <View onClick={this.onSelect.bind(this, item)}>
                                    <RadioButton class-name='radio' checked={item.check} />
                                </View>
                                <Text className="txt">{item.name}</Text>
                            </View>
                        )
                    })
                }
                <View className="botton flex-row" >
                    <View className="select">已选择：{this.state.checkName === '' ? "暂无选择" : this.state.checkName}</View>
                    <View className="comfirm" onClick={this.confirm}>确认</View>
                </View>
            </View>
        );
    }
}
export default Index

function getNodeByKeyWord(word, node, list: []) {

    if (node.name.includes(word)) {
        list.push(node);
    }

    if (!isEmpty(node.children)) {
        for (let child of node.children) {
            list.concat(getNodeByKeyWord(word, child, list));
        }
    }

    return list

}
