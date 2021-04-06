import Taro, { Component, Config } from '@tarojs/taro';
import { AtIcon } from 'taro-ui'
import { observer, inject } from '@tarojs/mobx';
import { View, Picker, Image, Text } from '@tarojs/components';
import ListView from '@common/components/ListView'
import EmptyHolder from '@common/components/EmptyHolder'
import moment from 'moment'
import isEmpty from 'lodash/isEmpty'
import {alarmStatusCodes, getPollutantName} from '@common/utils/monitor'
import { rootSourceBaseUrl } from '@common/utils/requests'
import {getSites} from '../../service/dispatch'
import {listAlarms,getAlarmTypeName} from '../../service/alarm'

import './site_alarm.scss'

const factorIcon = rootSourceBaseUrl + "/assets/task_dispatch/icon-switch.png";

const pollutantCodes:any[] = [{
    "code": "-1",
    "name": "全部状态"
}].concat(alarmStatusCodes);


interface SiteAlarmProps {
    userStore: any;
}

interface SiteAlarmState {
    sites: any[],
    site?: any,
    pollutantCode?: any,
    alarmSelectStatus: any,
    dataList: any,
    isInit: boolean,
    hasMore: boolean,
    offset: number,
    limit: number,
}

@inject('userStore')
@observer
class SiteAlarmPage extends Component<SiteAlarmProps, SiteAlarmState> {
    config: Config = {
        navigationBarTitleText: '监测预警',
        enablePullDownRefresh: true
    }

    constructor(props) {
        super(props);

        this.state = {
            sites:[],
            dataList: [],
            isInit: true,
            hasMore: true,
            offset: 0,
            limit: 20,
            alarmSelectStatus: {
                code: "-1",
                name: "全部状态"
            }
        }
    }

    componentDidMount() {
        this.getSites();
        this.fetchList();
    }

    componentDidShow(){
    }


    //下拉刷新
    onPullDownRefresh() {
        this.fetchNewList();
        Taro.stopPullDownRefresh()
    }

    // 污染类型
    getSites = async () => {
        const {userStore:{userDetails}} = this.props;

        getSites(userDetails.divisionCode).then((sites) => {
            this.setState({
                sites: [{code:'',name: '全部站点'}].concat(sites) 
            });
        });
    }

    fetchList = (callback?:any) => {
        const { isInit, dataList, site, pollutantCode, limit, offset, alarmSelectStatus} = this.state;

        let siteCode = site ? site.code: '';
        let factorCode = pollutantCode ? pollutantCode.code : '';

        listAlarms(siteCode, factorCode, offset, limit).then(res =>{
            let { data: { entries = []} } = res;

            let newList = [];
            if (isInit) {
                newList = entries;
            }else {
                newList = dataList.concat(entries);
            }
            console.log("alarmSelectStatus",alarmSelectStatus.code);
            newList = newList.filter(alarm => {
                if (alarmSelectStatus.code == "-1"){
                    return true;
                }
                if (alarmSelectStatus.code == "1" && alarm.alarmStatus){
                    return true;
                }
                if (alarmSelectStatus.code == "0" && !alarm.alarmStatus){
                    return true;
                }
                return false;
            })
            let hasMore = entries.length >= limit;
            if (newList.length < limit){
                hasMore = false;
            }
            this.setState({
                isInit: false,
                dataList: newList,
                hasMore: hasMore,
                offset: offset + limit
            },()=>{
                if(callback){
                    callback();
                }
            });
        }).catch(res=> {
            if(callback){
                callback();
            }
         });
       
    }

    fetchNewList = () => {
        this.setState({
            isInit: true,
            hasMore: true,
            dataList: [],
            offset: 0
        }, () => {
            this.fetchList();
        })
    }

    onSiteChange(e){
        this.setState({
            site: this.state.sites[e.detail.value] 
        },()=>{
            this.fetchNewList();
        });
    }

    onPollutionCodeChange = e => {
        this.setState({
            alarmSelectStatus: pollutantCodes[e.detail.value] 
        },()=>{
            this.fetchNewList();
        });
    }

    /**
     * 报警详情
     */
    alarmDetail = (alarmId: number) => {
        Taro.navigateTo({
            url: `./site_alarm_detail?alarmId=${alarmId}`
        })
    }

    getAlarmFactors = (alarm : any)=>{
        //分析报告内容
        const analysisReportContent:any = alarm.analysisReportContent;
        let factorList:string[] = analysisReportContent && analysisReportContent.abnormalFactor && analysisReportContent.abnormalFactor.factors || [];
        if(factorList.length == 0 && alarm && alarm.factorCode){
            factorList = [alarm.factorCode];
        }
        return factorList;
    }
    

    render() {
        const { sites,pollutantCode,site, hasMore, dataList, isInit,alarmSelectStatus } = this.state;
        let isEmptyData = !dataList || dataList.length == 0;

        const showEmpty = (<View className='empty'><EmptyHolder text='暂无数据' /></View>)
        
        let factorList;
        const renderList = dataList.map((item) => (
            <View className='dataItem' key={item.id}>
                <View className='titleAndStatus'>
                    <View className='title'>【{getAlarmTypeName(item.alarmType)}】{item.sourceName}</View>
                    <View className={item.alarmStatus? 'alarmStatus done':'alarmStatus'}>{item.alarmStatus?'已处置':'未处置'}</View>
                </View>
                <View className={`content ${factorList = this.getAlarmFactors(item)}`} onClick={this.alarmDetail.bind(this,item.id)} >
                    {
                        factorList && factorList.length>0 &&
                        factorList.map(code => {
                            return  getPollutantName(code)!='' ? (
                                <Text className='factorName'>{getPollutantName(code)}</Text>
                            ):(<Text></Text>);
                        })
                    }
                    {item.content}
                </View>
                <View className='timeAndDisposalUser'>
                    <View className='alarmTime'>{moment(item.alarmTime).format('YYYY/MM/DD HH:mm')}</View>
                    {
                      item.disposalUserName &&
                      <View className='disposalUser'>{item.disposalUserName}</View>
                    }
                </View>
            </View>
        ));

        return (
            <View className='alarm-page'>
                <View className='siteAndFactorPickerView'>
                    <Picker mode='selector' value={0} range={sites}  range-key='name' onChange={this.onSiteChange}>
                        <View className='choosedSite'>
                            <View className='name'>{site? site.name: '全部站点'}</View>
                            <AtIcon className='chevron_right' value='chevron-down' size='20' color='#7A8499' />
                        </View>
                    </Picker>

                    <Picker mode='selector' value={0} range={pollutantCodes}  range-key='name' onChange={this.onPollutionCodeChange}>
                        <View className='choosedPollutantCode'>
                            <View className='name'>{alarmSelectStatus? alarmSelectStatus.name : '全部状态'}</View>
                            <Image className="icon" src={factorIcon}></Image>
                        </View>
                    </Picker>
                </View>    

                <View className='splitView'></View>

                <ListView
                    com-class='alarm-page__body'
                    hasMore={hasMore}
                    hasData={!isEmpty(dataList)}
                    onRefresh={this.fetchNewList}
                    onEndReached={this.fetchList}
                >
                    <View className='list-container'>
                        {isEmptyData ? isInit ? null : showEmpty : renderList}
                    </View>
                </ListView>

                
            </View>
        );
    }
}

export default SiteAlarmPage;