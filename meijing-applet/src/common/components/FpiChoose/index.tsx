import Taro, { Component } from '@tarojs/taro'
import { View, Image, Text, Input, ScrollView } from '@tarojs/components'
import UserModule from './UserModule'
import UnitModule from './UnitModule'
import ChooseModule from './ChooseModule'
import HistoryModule from './HistoryModule'
import { rootSourceBaseUrl } from '../../utils/requests'
import { departmentUsers, childDivisionUsers, latestLinkman, addLatest } from '../../service/user'
import { transformTreeData, getNodeByKeyWord, setNodeUnCheck, getNodeById, getNodeByType } from './utils'
import { isOldVersion } from '../../utils/common'
import FpiLoading from '../FpiLoading/loading'
import cn from 'classnames'
import './index.scss'
import isEmpty from 'lodash/isEmpty'
import get from 'lodash/get'
import cloneDeep from 'lodash/cloneDeep'

//图标引用
const checkedImage = `${rootSourceBaseUrl}/assets/common/radio/checked.png`;
const uncheckedImage = `${rootSourceBaseUrl}/assets/common/radio/unchecked.png`;

interface FpiChooseProps {
    user: any,
    config: any,
    onOK: (checkedList: any) => void
}

interface FpiChooseState {
    data: any,
    navbars: any,
    keyword: any,
    placeholder: any,
    searchList: any,
    isLoading: boolean,
    showHistory: boolean,
    historyList: any,
    showMore: boolean,
}

export default class FpiChoose extends Component<FpiChooseProps, FpiChooseState> {
    constructor(props) {
        super(props)
        this.state = {
            data: {
                id: '',
                name: '',
                type: 1,
                checked: false,
                children: []
            },
            navbars: [],
            keyword: '',
            placeholder: '搜索人员',
            searchList: [],
            isLoading: true,
            showHistory: true,
            showMore: false,
            historyList: []
        }
    }

    static defaultProps = {
        // config: [{ type: 4, single: true }]
        config: []
    }

    // 初始化数据
    getInitData = async () => {
        let divisionCodeParam = ''
        let divisionNameParam = ''
        if (isOldVersion()) {
            const { user: { divisionCode, divisionName } } = this.props;
            divisionCodeParam = divisionCode
            divisionNameParam = divisionName
        }
        else {
            let { user: { pollutionSourceInfo: { divisionCode, divisionName }, tenant } } = this.props;
            divisionCodeParam = tenant.code
            divisionNameParam = divisionName
        }
        try {
            const departmentUsersResp = await departmentUsers(divisionCodeParam);
            // const childDivisionUsersResp = await childDivisionUsers(divisionCode);
            const { data: departmentUserList } = departmentUsersResp;
            // const { data: divisionUserList } = childDivisionUsersResp;
            const departmentList = departmentUserList.filter(item => item.departmentId);
            transformTreeData(departmentList, divisionNameParam)
            // const divisionList = divisionUserList.map(division => {
            //     return {
            //         id: division.divisionCode,
            //         name: division.divisionName,
            //         type: 3,
            //         checked: false,
            //         origin: division,
            //         children: division.users.map(user => {
            //             return {
            //                 id: user.id,
            //                 name: user.name,
            //                 type: 4,
            //                 checked: false,
            //                 children: [],
            //                 avatar: user.avatar,
            //                 origin: user,
            //                 path: `${divisionName}-${division.divisionName}`
            //             }
            //         }),
            //         path: `${divisionName}`
            //     }
            // })

            let noDepartment = departmentUserList.find(item => item.departmentId == 0)
            let noDepartmentList = noDepartment ? [noDepartment] : []
            transformTreeData(noDepartmentList, divisionNameParam, 4)

            this.setState({
                data: {
                    id: divisionCodeParam,
                    name: divisionNameParam,
                    type: 1,
                    checked: false,
                    users: get(noDepartmentList, '[0].users', []),
                    children: [
                        ...departmentList,
                        // ...divisionList,
                    ]
                },
                navbars: [{ id: divisionCodeParam, name: divisionNameParam, isAll: false, checked: false }],
                isLoading: false
            })
        }
        catch (e) {
            console.log(e);
        }
    }

    componentWillMount() {
        this.getInitData();
    }

    componentDidMount() {
        this.getRecentPerson()
    }

    // 最近联系人
    getRecentPerson = () => {
        if (isEmpty(this.state.historyList)) {
            latestLinkman().then(res => {
                this.setState({ historyList: get(res, 'data', []).slice(0, 10).map(item => ({ userId: item.id, name: item.name })) })
            })
        }
    }

    // 通过节点id获取节点
    getNodeById = (id: number) => {
        const { data } = this.state;
        return getNodeById(id, data);
    }

    // tab切换
    onTab = (index: number) => {
        let { navbars } = this.state;
        if (index !== navbars.length - 1) {
            navbars.splice(index + 1);
            this.setState({
                navbars,
                showMore: false
            })
        }
    }

    // 下级
    onSub = (item: any) => {
        let { navbars } = this.state;
        this.setState({
            navbars: [
                ...navbars,
                { id: item.id, name: item.name, isAll: false, checked: item.checked }
            ]
        })
    }

    // 勾选和取消
    onCheck = (item) => {
        const { config } = this.props;
        let { data } = this.state;
        let itemConfig = config.find(cfg => cfg.type == item.type);
        if (!isEmpty(config) && isEmpty(itemConfig)) {
            return;
        }
        let newData = data;
        let newItem = getNodeById(item.id, data, item.type);
        if (newItem) {
            if (itemConfig && itemConfig.single && !item.checked) {
                setNodeUnCheck(itemConfig.type, data);
            }
            // @ts-ignore
            newItem.checked = !item.checked;
            this.setState({
                data: newData
            })
        }
    }

    // 全选
    onCheckAll = (item) => {
        if (item.checked) { return; }
        const { config } = this.props;
        item.isAll = !item.isAll;
        let { navbars, data } = this.state;
        let curItem = getNodeById(item.id, data);
        navbars.splice(navbars.length - 1, 1, item);
        if (curItem) {
            // @ts-ignore
            curItem.children.forEach(child => {
                if (isEmpty(config)) {
                    child.checked = item.isAll
                }
                else {
                    let personConfig = config.find(cfg => cfg.type == child.type);
                    if (personConfig && personConfig.only) {
                        child.checked = item.isAll
                    }
                }
            })

            // @ts-ignore
            curItem.users.forEach(child => {
                if (isEmpty(config)) {
                    child.checked = item.isAll
                }
                else {
                    let personConfig = config.find(cfg => cfg.type == child.type);
                    if (personConfig && personConfig.only) {
                        if (!personConfig.single) {
                            child.checked = item.isAll
                        }
                    }
                }
            })
        }
        this.setState({
            navbars,
            data
        })
    }

    // 获取汇总信息
    getSumText = () => {
        const { config } = this.props;
        const { data } = this.state;
        let departmentList = [];
        let devisionList = [];
        let userList = [];
        getNodeByType(2, data, departmentList);
        getNodeByType(3, data, devisionList);
        getNodeByType(4, data, userList);
        let personConfig = config.find(cfg => cfg.type == 4);
        if (personConfig && (personConfig.single || personConfig.only)) {
            return `${userList.length}人`;
        }
        return `${userList.length}人、${departmentList.length}个部门`
    }

    onOKhandle = () => {
        const { data, historyList } = this.state;
        let departmentList = [];
        let devisionList = [];
        let userList = [];
        getNodeByType(2, data, departmentList);
        getNodeByType(3, data, devisionList);
        getNodeByType(4, data, userList);
        if (!isEmpty(userList)) {
            const ids = userList.map(item => item.id)
            //@ts-ignore
            // const addPersons = userList.filter(item => !ids.includes(item.id)).map(item => ({ userId: item.id, name: item.name }))
            // const savePerson = cloneDeep([...addPersons, ...historyList].slice(0, 10))
            // savePerson.forEach(person => delete person.checked)
            // Taro.setStorageSync('recentUsers', JSON.stringify(savePerson))
            addLatest(ids)
        }
        let checkedList = {
            // @ts-ignore
            choosedDepartmentUserList: departmentList,
            // @ts-ignore
            choosedDivisionUserList: devisionList,
            // @ts-ignore
            choosedUsers: userList,
        };
        this.props.onOK(checkedList);
    }

    onInputChange = (e) => {
        const { data } = this.state;
        let list = [];
        getNodeByKeyWord(e.detail.value, data, list);
        this.setState({
            keyword: e.detail.value,
            searchList: list,
            showMore: false
        })
    }

    getPaddingTop = () => {
        const { keyword, showMore, navbars, historyList } = this.state
        let paddingTop = 264
        if (!keyword && navbars.length === 1 && !isEmpty(historyList)) {
            if (showMore && historyList.length > 5) {
                paddingTop = 418
            }
            else {
                paddingTop = 334
            }
        }

        return paddingTop + 'rpx'
    }

    onMoreBack = (isMore: boolean) => {
        this.setState({ showMore: isMore })
    }

    onRecent = (item) => {
        const checkItem = {
            type: 4,
            id: item.userId,
            name: item.name,
            checked: !item.checked
        }
        this.onCheck(checkItem)
    }

    render() {
        const { navbars, keyword, placeholder, searchList, isLoading, showHistory, historyList, showMore } = this.state;
        const { config } = this.props;
        const userConfig = config.find(cfg => cfg.type == 4);
        const isOnlyUser = !isEmpty(userConfig) && userConfig.only;
        if (isLoading) {
            return (
                <View className='fpi-choose fpi-choose--loading'>
                    <FpiLoading />
                </View>
            )
        }

        return (
            <View className={cn('fpi-choose', { 'fpi-choose--search': keyword })}>
                <View className='fpi-choose__header'>
                    <View className='search'>
                        <Input className='search__input'
                            placeholderClass='search--placeholder'
                            type='text'
                            value={keyword}
                            placeholder={placeholder}
                            onInput={this.onInputChange.bind(this)}
                        />
                    </View>
                    {
                        (!isEmpty(historyList) && !keyword && navbars.length === 1) ? <HistoryModule historyList={historyList} onMore={this.onMoreBack} onCheck={this.onRecent} /> :
                            (
                                <ScrollView className='scrollView' scrollWithAnimation scrollX>
                                    <View className='navbar'>
                                        {
                                            navbars.map((navbar, index) => (
                                                <View
                                                    onClick={this.onTab.bind(this, index)}
                                                    key={navbar.id}
                                                    className={cn('navbar__item', { 'navbar__item--nav': index < navbars.length - 1 })}
                                                >{navbar.name}</View>
                                            ))
                                        }
                                    </View>
                                </ScrollView>
                            )
                    }

                    <View className={cn('check-all', { 'check-all--disabled': !isEmpty(navbars) && navbars[navbars.length - 1].checked })}>
                        <Image
                            className='img'
                            onClick={this.onCheckAll.bind(this, navbars[navbars.length - 1])}
                            src={navbars[navbars.length - 1].isAll ? checkedImage : uncheckedImage}
                        />
                        <Text className='txt'>全选</Text>
                    </View>
                </View>
                <View className='fpi-choose__main' style={{ paddingTop: this.getPaddingTop() }}>
                    {
                        navbars.map((navbar, index) => (
                            <View key={navbar.id} className={cn('check-container', { 'check-container--checked': index === navbars.length - 1 })}>
                                <View className='tab__item'>
                                    {/* 部门 */}
                                    <UnitModule
                                        data={this.getNodeById(navbar.id)}
                                        onCheck={this.onCheck}
                                        type={2}
                                        canCheck={!isOnlyUser}
                                        onSub={this.onSub}
                                    />
                                    {/* 下级区域 */}
                                    <UnitModule
                                        data={this.getNodeById(navbar.id)}
                                        onCheck={this.onCheck}
                                        type={3}
                                        canCheck={!isOnlyUser}
                                        onSub={this.onSub}
                                    />

                                    {/* 人员 */}
                                    <UserModule
                                        data={this.getNodeById(navbar.id)}
                                        onCheck={this.onCheck}
                                        // @ts-ignore
                                        isSpace={this.getNodeById(navbar.id).children.filter(child => child.type == 2 || child.type == 3).length == 0}
                                    />
                                </View>
                            </View>
                        ))
                    }
                </View>

                <View className='fpi-choose__search'>
                    <ChooseModule
                        type={4}
                        data={searchList.filter(child => child.type == 4)}
                        keyword={keyword}
                        onCheck={this.onCheck}
                    />
                    <ChooseModule
                        type={3}
                        data={searchList.filter(child => child.type == 3)}
                        keyword={keyword}
                        onCheck={this.onCheck}
                    />
                    <ChooseModule
                        type={2}
                        data={searchList.filter(child => child.type == 2)}
                        keyword={keyword}
                        onCheck={this.onCheck}
                    />
                </View>

                <View className='fpi-choose__footer'>
                    <View className='footer__text'>已选：{this.getSumText()}</View>
                    <View className='footer__btn' onClick={this.onOKhandle}>确认</View>
                </View>
            </View>
        )
    }
}