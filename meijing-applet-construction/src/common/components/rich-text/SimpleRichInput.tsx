import Taro, { Component } from '@tarojs/taro'
import { View, Block } from '@tarojs/components'
import { AtTextarea } from 'taro-ui';
import { AtTextareaProps } from 'taro-ui/@types/textarea';
import { rootSourceBaseUrl } from '@common/utils/requests'
import { Recorder, RecorderPlay } from '../recorder'
import FpiTag from '../FpiTag'
import './SimpleRichInput.scss'


interface SimpleRichInputProps extends Partial<AtTextareaProps> {
  source?: string;
  /**
   * 默认传入的
   */
  value: string;
  /**
   * 当在文本框中输入 @ 字符时触发，一般情况是用来触发选择用户、部门、行政区的页面
   */
  onAt?: () => void;
  /**
   * 当文本框中输入 # 字符时触发，参考上面 onAt 方法的说明
   */
  onTag?: () => void;

  onRecorder?: () => void;
  /**
   * 用来侦听输入文本内容的变化
   * @param value: 用户输入的详细信息，而不是展示出来的信息，例如： '@[张三](/users/1)，今天晚上要组织#[夜查](/tags/1)'
   */
  onValueChange: (value: string) => void;

  /**
   * 录音完成，返回录音path、录音时长times[ms]
   */
  onRecorderDone?: (path: string, times: number) => void
  recoderDuration: number | undefined;
  recorderPath: string | undefined;
  showVoice: boolean | undefined;
}

interface SimpleRichInputState {
  isFocus: boolean;
  tabbarHeight: number;
  bottomStyle: string;
  recorderHeight: number;
  recorderShow: boolean;
}
const REGEX = /([@#]\[[\S]+\]\(\/[a-zA-Z0-9_-]+\/\d+\))/g
const ITEM_REGEX = /^([@#])\[([\S]+)\]\((\/[a-zA-Z0-9_-]+\/\d+)\)/
const AT_TAG_REGEX = /^.*([@#])$/


class RichContent {
  fullFragments: string[];
  showFragments: string[];

  constructor(content: string) {
    this.fullFragments = []
    this.showFragments = []
    this.reload(content)
  }

  reload(content: string) {
    this.fullFragments.length = 0
    this.showFragments.length = 0
    if (content) {
      this.fullFragments = content.split(REGEX)
      this.fullFragments.forEach((item) => {
        const matched = item.match(ITEM_REGEX)
        if (matched) {
          this.showFragments.push(matched[1] + matched[2])
        } else {
          this.showFragments.push(item)
        }
      })
    }
  }

  addContent(content: string, cursor: number) {
    let offset = cursor
    let fragmentIndex = -1;
    for (let i = 0; i < this.showFragments.length; i++) {
      const fragment = this.showFragments[i]
      offset = offset - fragment.length
      if (offset <= 0) {
        fragmentIndex = i
        break
      }
    }
    if (fragmentIndex < 0) {
      this.reload(this.getFullContent() + content)
    } else {
      const fragment = this.fullFragments[fragmentIndex]
      if (fragment.match(ITEM_REGEX)) {
        if (offset == 0) {
          this.fullFragments[fragmentIndex] = fragment + ' ' + content
        } else {
          const showFragment = this.showFragments[fragmentIndex]
          this.fullFragments[fragmentIndex] = showFragment.substring(0, showFragment.length + offset) + content + showFragment.substring(showFragment.length + offset, showFragment.length)
        }
      } else {
        this.fullFragments[fragmentIndex] = fragment.substring(0, fragment.length + offset) + content + fragment.substring(fragment.length + offset, fragment.length)
      }
      this.reload(this.fullFragments.join(''))
    }
  }

  deleteContent(content: string, cursor: number) {
    let beginIndex: number = cursor, endIndex: number = cursor + content.length
    for (let i = 0; i < this.showFragments.length; i++) {
      const fragment = this.showFragments[i]
      if (beginIndex >= 0 && beginIndex < fragment.length) {
        const fullFragment = this.fullFragments[i]
        if (fullFragment.match(ITEM_REGEX)) {
          this.fullFragments[i] = ''
        } else {
          this.fullFragments[i] = fullFragment.substring(0, beginIndex) + fullFragment.substring(Math.min(endIndex, fullFragment.length), fullFragment.length)
        }
      }
      beginIndex = Math.max(beginIndex - fragment.length, 0)
      endIndex = endIndex - fragment.length
      if (endIndex <= 0) {
        break
      }
    }
    this.reload(this.fullFragments.join(''))
  }

  getShowContent() {
    return this.showFragments.join('')
  }

  getFullContent() {
    return this.fullFragments.join('')
  }
}

let isRecorder: boolean = false;

export default class SimpleRichInput extends Component<SimpleRichInputProps, SimpleRichInputState>{
  static externalClasses = ['class-name']
  static defaultProps = {
  }

  richContent: RichContent

  constructor(props: SimpleRichInputProps) {
    super(props);
    const { value } = this.props

    this.richContent = new RichContent(value)

    this.state = {
      isFocus: false,
      tabbarHeight: 0,
      bottomStyle: '-96px',
      recorderHeight: 0,
      recorderShow: false,
    };
  }

  componentWillMount() {

  }

  componentDidMount() {
    isRecorder = false;
  }

  handleValueChange = (e: any, newValue: string) => {
    const { onAt, onTag } = this.props
    const { value, cursor } = e.target || e.currentTarget
    const oldValue = this.richContent.getShowContent()
    console.log('e=>', e)
    console.log('richContent=>', this.richContent)
    const inputLength = value.length - oldValue.length
    if (inputLength > 0) {
      const input = value.substring(cursor - inputLength, cursor)
      let match: any
      if (match = input.match(AT_TAG_REGEX)) {
        if (match[1] == '@') {
          onAt && onAt();
        } else {
          onTag && onTag();
        }
      } else {
        this.richContent.addContent(input, cursor - input.length)
        this.props.onValueChange(this.richContent.getFullContent())
      }
    } else {
      const deleteContent = oldValue.substring(cursor, cursor - inputLength)
      this.richContent.deleteContent(deleteContent, cursor)
      this.props.onValueChange(this.richContent.getFullContent())
    }
  }





  /**
   * 输入框聚焦时触发
   */
  onFocus = (e: any) => {
    isRecorder = false;
    setTimeout(() => {
      const isFocus = true
      //tabBar高度
      const tabbarHeight = this.state.tabbarHeight;
      const recorderHeight = e.target.height - tabbarHeight;
      const bottomStyle = recorderHeight + 'px';

      this.setState({
        bottomStyle,
        isFocus,
        recorderHeight,
      })
    }, 80)
  }

  /**
   * 输入框失去焦点时触发
   */
  onBlur = () => {
    const { bottomStyle } = this.state;
    if (!isRecorder) {
      this.setState({
        isFocus: false,
        bottomStyle: isRecorder ? bottomStyle : '-96px',
        recorderShow: false
      })
      isRecorder = false;
    }
    else {
      this.setState({
        recorderShow: true,
      });
    }
  }

  onRecoder = () => {
    isRecorder = !isRecorder;
    const { recorderShow, bottomStyle } = this.state;
    this.setState({
      recorderShow: !recorderShow,
      bottomStyle: isRecorder ? bottomStyle : '-96px',
    });
  }

  /**
   * 录音完成
   */
  recoderFinish = (path: string | undefined, duration: number) => {
    isRecorder = false;
    this.setState({
      recorderShow: false,
      bottomStyle: '-96px'
    });
    if (path) {
      const { onRecorderDone } = this.props;
      onRecorderDone && onRecorderDone(path, duration);
    }
  }

  onAt() {
    const { onAt } = this.props
    this.setState({
      recorderShow: false,
    });
    onAt && onAt();
  }

  onTag() {
    const { onTag } = this.props
    this.setState({
      recorderShow: false,
    });
    onTag && onTag();
  }

  onRecorder() {
    const { onRecorder } = this.props
    onRecorder && onRecorder();
  }

  maskClick() {
    this.setState({
      recorderShow: false,
      bottomStyle: '-96px',
    })
  }

  render() {
    const { value, recorderPath, recoderDuration, source, showVoice = true } = this.props
    let { bottomStyle, recorderHeight, recorderShow } = this.state;
    this.richContent.reload(value)

    return (
      <Block>
        <AtTextarea {...this.props} className="class-name simpleTextArea" onChange={this.handleValueChange} onFocus={() => { }}
          onBlur={() => { }} value={this.richContent.getShowContent()} />
        {recorderPath && recoderDuration && recoderDuration > 0 &&
          <RecorderPlay class-name="recorderPlay" duration={recoderDuration} path={recorderPath} />
        }
        <View className='btn-group'>
          <FpiTag com-class='btn' icon={`${rootSourceBaseUrl}/assets/common/richInput/label_button.png`} onClick={this.onTag.bind(this)}>添加标签</FpiTag>
          {
            source !== "green_construction" && (
              <FpiTag com-class='btn' icon={`${rootSourceBaseUrl}/assets/common/richInput/at_button.png`} onClick={this.onAt.bind(this)}>关联人员</FpiTag>
            )
          }
          {showVoice && <FpiTag com-class='btn' icon={`${rootSourceBaseUrl}/assets/common/richInput/recoder_button.png`} onClick={this.onRecorder.bind(this)}>语音输入</FpiTag>}
        </View>
        {
          recorderShow &&
          <View className='mask' onClick={this.maskClick.bind(this)}></View>
        }

        <View className='atLabelVoiceView' style={'bottom:' + bottomStyle}>
          <View className='labelButton' onClick={this.onTag.bind(this)}></View>
          <View className='atButton' onClick={this.onAt.bind(this)}></View>
          <View className={recorderShow ? 'recoderButton ing' : 'recoderButton'} onClick={this.onRecoder}></View>
        </View>

        <Recorder height={recorderHeight} show={recorderShow} onFinish={this.recoderFinish} />
      </Block>
    )
  }
}
