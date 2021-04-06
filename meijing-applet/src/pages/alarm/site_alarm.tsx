import Taro, { Component, Config } from '@tarojs/taro';
import { AtIcon } from 'taro-ui'
import { observer, inject } from '@tarojs/mobx';
import { View, Picker, Image, Text } from '@tarojs/components';
import ListView from '@common/components/ListView'
import EmptyHolder from '@common/components/EmptyHolder'
import moment from 'moment'
import isEmpty from 'lodash/isEmpty'
import {getPollutantName, pollutantCodes} from '@common/utils/monitor'
import { rootSourceBaseUrl } from '@common/utils/requests'
import {listAlarms,getAlarmSourceName, getAlarmFactors} from '../../service/alarm'

import './site_alarm.scss'

const factorIcon = rootSourceBaseUrl + "/assets/task_dispatch/icon-switch.png";

export const alarmStatusCodes: any[] = [
    {
      "code": "ALREADY_DISPOSED",
      "name": "已处置"
    },
    {
      "code": "NOT_DISPOSED",
      "name": "未处置"
    }
  ];

const alarmStatusList:any[] = [{
    "code": "-1",
    "name": "全部状态"
}].concat(alarmStatusCodes);

const pollutantCodesList: any[] = [{
    "code": "",
    "name": "全部因子"
  },].concat(pollutantCodes);


interface SiteAlarmProps {
    userStore: any;
}

interface SiteAlarmState {
    sites: any[],
    site?: any,
    alarmSelectStatus: any,
    factorCode: string,
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
            },
            factorCode: '',
        }
    }

    componentDidMount() {
        this.fetchList();
    }

    componentDidShow(){
    }


    //下拉刷新
    onPullDownRefresh() {
        this.fetchNewList();
        Taro.stopPullDownRefresh()
    }

    fetchList = (callback?:any) => {
        const { isInit, dataList, limit, offset, alarmSelectStatus, factorCode} = this.state;
        
        const params:any = {
            factorCode,
            offset,
            limit,
            alarmStatus: alarmSelectStatus.code,
        };

        listAlarms(params).then(res =>{
            let { data: { entries = []} } = res;

            let newList = [];
            if (isInit) {
                newList = entries;
            }else {
                newList = dataList.concat(entries);
            }

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

    onFactorChange(e){
        this.setState({
            factorCode: pollutantCodesList[e.detail.value] && pollutantCodesList[e.detail.value].code || '',
        },()=>{
            this.fetchNewList();
        });
    }

    onPollutionCodeChange = e => {
        this.setState({
            alarmSelectStatus: alarmStatusList[e.detail.value] 
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


    render() {
        const { hasMore, dataList, isInit,alarmSelectStatus, factorCode } = this.state;
        let isEmptyData = !dataList || dataList.length == 0;

        const showEmpty = (<View className='empty'><EmptyHolder text='暂无数据' /></View>)
        
        let factorList;
        const renderList = dataList.map((item) => (
            <View className='dataItem' key={item.alarmId}>
                <View className='titleAndStatus'>
                    <View className='title'>【{getAlarmSourceName(item.sourceType)}】{item.sourceName}</View>
                    <View className={item.status == 'ALREADY_DISPOSED'? 'alarmStatus done':'alarmStatus'}>{item.status == 'ALREADY_DISPOSED'?'已处置':'未处置'}</View>
                </View>
                <View className={`content ${factorList = getAlarmFactors(item)}`} onClick={this.alarmDetail.bind(this,item.alarmId)} >
                    {
                        factorList && factorList.length>0 &&
                        factorList.filter((factor:any) => factor.code && factor.name).map((factor:any) => {
                            return  (
                                <Text className='factorName'>{factor.name}</Text>
                            );
                        })
                    }
                    {item.content}
                </View>
                <View className='timeAndDisposalUser'>
                    <View className='alarmTime'>{moment(item.createTime).format('YYYY/MM/DD HH:mm')}</View>
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
                    <Picker mode='selector' value={0} range={pollutantCodesList}  range-key='name' onChange={this.onFactorChange}>
                        <View className='choosedSite'>
                            <View className='name'>{factorCode? getPollutantName(factorCode) : '全部因子'}</View>
                            <AtIcon className='chevron_right' value='chevron-down' size='20' color='#7A8499' />
                        </View>
                    </Picker>

                    <Picker mode='selector' value={0} range={alarmStatusList}  range-key='name' onChange={this.onPollutionCodeChange}>
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