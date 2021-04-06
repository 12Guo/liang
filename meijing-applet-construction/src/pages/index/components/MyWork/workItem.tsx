import Taro, { PureComponent } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { SimpleRichView } from '@common/components/rich-text'
import { rootConstructionSourceBaseUrl } from '@common/utils/requests'
import cn from 'classnames'

import './workItem.scss'

interface WorkItemProps {
    data: any;
}

interface WorkItemState {

}

const WorkTypes = {
    SENTRY: {
        img: `${rootConstructionSourceBaseUrl}/assets/pages/index/shipin2.png`,
        title: '视频预警处置'
    },
    PATROL: {
        img: `${rootConstructionSourceBaseUrl}/assets/pages/index/shijian2.png`,
        title: '巡查事件处置'
    },
    SUPERVISE: {
        img: `${rootConstructionSourceBaseUrl}/assets/pages/index/ducha2.png`,
        title: '督查事件处置'
    },
    DEFAULT: {
        img: `${rootConstructionSourceBaseUrl}/assets/pages/index/richang.png`,
        title: '日常巡查'
    },
}

export default class WorkItem extends PureComponent<WorkItemProps, WorkItemState> {
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    onDetail = () => {
        const { data = {} } = this.props
        if (!data.status) {
            const dataType = data.type || 'PATROL'
            let url = ''
            if (dataType === 'DEFAULT') {
                url = `/pages/work_options/inspection_report`
            }
            else {
                url = `/pages/works/detail?inspectId=${data.id}`
            }
            Taro.navigateTo({
                url
            })
        }
    }

    render() {
        const { data = {} } = this.props
        const dataType = WorkTypes[data.type || 'PATROL']
        return (
            <View className='work-item'>
                <Image className='left' src={dataType.img} />
                <View className='center'>
                    <Text className='center_top'>{dataType.title}</Text>
                    <View className='center_bottom'>
                        <SimpleRichView content={data.content} onAtClick={() => { }} onTagClick={() => { }} />
                    </View>
                    {/* <Text className='center_bottom'>{data.content}</Text> */}
                </View>
                <Text onClick={this.onDetail} className={cn('right', { 'right--gray': data.status })}>{data.status ? (data.type == 'DEFAULT' ? '已完成' : '已处置') : (data.type == 'DEFAULT' ? '去完成' : '去处置')}</Text>
            </View>
        )
    }
}