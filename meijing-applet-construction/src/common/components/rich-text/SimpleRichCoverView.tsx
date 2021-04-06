import Taro, { Component } from '@tarojs/taro'
import { CoverView, Block } from '@tarojs/components'

import './SimpleRichView.scss'

/**
 * @param item 被点击对象的完整内容，例如 @[张三](/users/1)
 * @param type 被点击对象的类型，例如：# or @
 * @param name 被点击对象的名称，例如：张三
 * @param category 被点击对象的类别，例如：users、departments 等
 * @param id 被点击对象的id，比如 userId、departmentId 等
 */
type OnClick = (item: string, type: string, name: string, category: string, id: string) => void;

interface SimpleRichCoverViewProps {
  /**
   * 待显示的文本
   */
  content: string;
  /**
   * 当 @ 对象被点击时
   */
  onAtClick?: OnClick;
  /**
   * 当 # 对象被点击时
   */
  onTagClick?: OnClick;
}

interface SimpleRichCoverViewState {

}

const REGEX = /([@#]\[[\S]+\]\(\/[a-zA-Z0-9_-]+\/\d+\))/g
const ITEM_REGEX = /^([@#])\[([\S]+)\]\((\/[a-zA-Z0-9_-]+\/\d+)\)/       

export default class SimpleRichCoverView extends Component<SimpleRichCoverViewProps, SimpleRichCoverViewState>{
  static externalClasses = ['class-name']
  static defaultProps = {
  }

  constructor(props) {
    super(props);
  }

  componentWillMount() {
  }

  componentDidMount() {
  }

  onTextClick = (item: string, type: string, name: string, category: string, id: string) => {
    const { onAtClick, onTagClick } = this.props
    if (type == '@') {
      onAtClick && onAtClick(item, type, name, category, id)
    } else {
      onTagClick && onTagClick(item, type, name, category, id)
    }
  }

  render() {
    const { content } = this.props
    const items = content ? content.split(REGEX) : []
    const textViews = items.map((item) => {
      const itemMatched = item.match(ITEM_REGEX)
      if (itemMatched) {
        return (
          <CoverView
            style={"display: inline-block"}
            key={item}
            onClick={() => this.onTextClick(itemMatched[0], itemMatched[1], itemMatched[2], itemMatched[3], itemMatched[4])}
            className={itemMatched[1] == '@' ? 'at' : 'tag'}>
            {itemMatched[1] + itemMatched[2]}
          </CoverView>
        )
      } else if (item && item.trim().length > 0) {
        if (item.trim().length > 18) {
          item = item.trim().substring(0, 18);
          item += "...";
        }
        return <CoverView style={"display: inline-block"} key={item}>{item}</CoverView>
      }
    })
    return (
      <CoverView style={"display: inline-block"} className="simple-rich-view class-name">
        {textViews}
      </CoverView>
    )
  }

}
